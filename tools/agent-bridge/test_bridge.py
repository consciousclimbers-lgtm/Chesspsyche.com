import unittest
from unittest.mock import patch
import urllib.error

import bridge


class ValidateEndpointTests(unittest.TestCase):
    def test_accepts_https_standard_port(self):
        self.assertEqual(
            bridge.validate_endpoint("https://agent.example/ingest"),
            "https://agent.example/ingest",
        )

    def test_accepts_explicit_443(self):
        bridge.validate_endpoint("https://agent.example:443/ingest")

    def test_rejects_http(self):
        with self.assertRaises(ValueError):
            bridge.validate_endpoint("http://agent.example/ingest")

    def test_rejects_missing_host(self):
        with self.assertRaises(ValueError):
            bridge.validate_endpoint("https:///ingest")

    def test_rejects_userinfo(self):
        with self.assertRaises(ValueError):
            bridge.validate_endpoint("https://user:pass@agent.example/ingest")

    def test_rejects_nonstandard_port(self):
        with self.assertRaises(ValueError):
            bridge.validate_endpoint("https://agent.example:8443/ingest")

    def test_rejects_fragment(self):
        with self.assertRaises(ValueError):
            bridge.validate_endpoint("https://agent.example/ingest#fragment")

    def test_rejects_whitespace(self):
        with self.assertRaises(ValueError):
            bridge.validate_endpoint("https://agent.example/ingest\n")

    def test_rejects_malformed_port(self):
        with self.assertRaises(ValueError):
            bridge.validate_endpoint("https://agent.example:notaport/ingest")


class PayloadTests(unittest.TestCase):
    def test_push_uses_after_sha_and_stable_event_id(self):
        event = {
            "ref": "refs/heads/main",
            "after": "abc123",
            "before": "old456",
            "repository": {"full_name": "owner/repo"},
            "sender": {"login": "calvin"},
        }
        first = bridge.build_payload(
            "push", "owner/repo", "fallback", "refs/heads/main",
            "100", "1", "https://github.com", event,
        )
        second = bridge.build_payload(
            "push", "owner/repo", "different-fallback", "refs/heads/main",
            "101", "1", "https://github.com", event,
        )
        self.assertEqual(first["sha"], "abc123")
        self.assertEqual(first["event_id"], second["event_id"])
        self.assertEqual(first["sender"], "calvin")

    def test_workflow_run_uses_source_commit_and_conclusion(self):
        event = {
            "action": "completed",
            "workflow_run": {
                "id": 987,
                "head_sha": "runsha",
                "head_branch": "main",
                "html_url": "https://github.com/owner/repo/actions/runs/987",
                "name": "Regression tests",
                "conclusion": "failure",
            },
        }
        payload = bridge.build_payload(
            "workflow_run", "owner/repo", "bridge-sha", "refs/heads/main",
            "200", "1", "https://github.com", event,
        )
        self.assertEqual(payload["sha"], "runsha")
        self.assertEqual(payload["workflow_conclusion"], "failure")
        self.assertEqual(payload["source_run_id"], 987)

    def test_pull_request_uses_head_sha_and_only_metadata(self):
        event = {
            "action": "opened",
            "pull_request": {
                "number": 7,
                "title": "Example PR",
                "html_url": "https://github.com/owner/repo/pull/7",
                "head": {"sha": "prsha", "ref": "feature"},
                "body": "MUST NOT BE FORWARDED",
            },
            "comment": {"body": "ALSO MUST NOT BE FORWARDED"},
        }
        payload = bridge.build_payload(
            "pull_request_target", "owner/repo", "base-sha", "refs/heads/main",
            "300", "1", "https://github.com", event,
        )
        self.assertEqual(payload["sha"], "prsha")
        self.assertEqual(payload["pull_request_number"], 7)
        self.assertNotIn("body", payload)
        self.assertNotIn("MUST NOT BE FORWARDED", repr(payload))

    def test_issue_comment_does_not_claim_unknown_pr_head_sha(self):
        event = {
            "action": "created",
            "issue": {
                "number": 8,
                "title": "A PR conversation",
                "pull_request": {"html_url": "https://github.com/owner/repo/pull/8"},
            },
            "comment": {"id": 44, "body": "private conversation text is excluded"},
        }
        payload = bridge.build_payload(
            "issue_comment", "owner/repo", "base-sha", "refs/heads/main",
            "400", "1", "https://github.com", event,
        )
        self.assertIsNone(payload["sha"])
        self.assertEqual(payload["pull_request_number"], 8)
        self.assertNotIn("private conversation text is excluded", repr(payload))

    def test_payload_does_not_include_arbitrary_event_fields(self):
        event = {
            "action": "submitted",
            "review": {"id": 55, "body": "review text excluded"},
            "secret_like_field": "do not forward",
        }
        payload = bridge.build_payload(
            "pull_request_review", "owner/repo", "sha", "ref",
            "500", "1", "https://github.com", event,
        )
        self.assertNotIn("secret_like_field", payload)
        self.assertNotIn("review text excluded", repr(payload))


class DeliveryTests(unittest.TestCase):
    @patch("bridge.time.sleep")
    @patch("bridge._post_once")
    def test_retries_transient_status_then_succeeds(self, post, sleep):
        post.side_effect = [urllib.error.HTTPError("https://hidden", 503, "error", {}, None), 202]
        status = bridge.deliver(
            "https://agent.example/ingest", "secret-token", {"event_id": "stable"}
        )
        self.assertEqual(status, 202)
        self.assertEqual(post.call_count, 2)
        self.assertEqual(sleep.call_count, 1)

    @patch("bridge._post_once")
    def test_does_not_retry_permanent_http_error(self, post):
        post.side_effect = urllib.error.HTTPError("https://hidden", 401, "error", {}, None)
        with self.assertRaisesRegex(RuntimeError, "rejected"):
            bridge.deliver(
                "https://agent.example/ingest", "secret-token", {"event_id": "stable"}
            )
        self.assertEqual(post.call_count, 1)


if __name__ == "__main__":
    unittest.main()
