import unittest

from monitor_summary import build_summary


class GitHubOnlySummaryTests(unittest.TestCase):
    def test_pull_request_summary_uses_head_metadata(self):
        event = {
            "action": "opened",
            "pull_request": {
                "number": 54,
                "title": "A safe test PR",
                "html_url": "https://github.com/owner/repo/pull/54",
                "head": {"sha": "head123", "ref": "feature-branch"},
                "body": "PRIVATE BODY MUST NOT APPEAR",
            },
            "comment": {"body": "PRIVATE COMMENT MUST NOT APPEAR"},
        }
        summary = build_summary(
            "pull_request_target", "owner/repo", "reviewer",
            "https://github.com/owner/repo/actions/runs/12",
            "base456", "refs/heads/main", event,
        )
        self.assertIn("head123", summary)
        self.assertIn(r"feature\-branch", summary)
        self.assertIn("A safe test PR", summary)
        self.assertIn("#54", summary)
        self.assertNotIn("PRIVATE BODY MUST NOT APPEAR", summary)
        self.assertNotIn("PRIVATE COMMENT MUST NOT APPEAR", summary)
        self.assertIn("does not do", summary)
        self.assertIn("invoke an AI agent", summary)

    def test_workflow_run_includes_conclusion_and_source_link(self):
        event = {
            "action": "completed",
            "workflow_run": {
                "name": "Regression tests",
                "head_sha": "testedsha",
                "head_branch": "main",
                "conclusion": "failure",
                "html_url": "https://github.com/owner/repo/actions/runs/99",
            },
        }
        summary = build_summary(
            "workflow_run", "owner/repo", "github-actions",
            "https://github.com/owner/repo/actions/runs/100",
            "bridge-sha", "refs/heads/main", event,
        )
        self.assertIn("testedsha", summary)
        self.assertIn("Regression tests", summary)
        self.assertIn("failure", summary)
        self.assertIn("actions/runs/99", summary)

    def test_push_uses_after_sha(self):
        summary = build_summary(
            "push", "owner/repo", "calvin", "https://github.com/owner/repo/actions/runs/1",
            "fallback", "refs/heads/main",
            {"ref": "refs/heads/main", "after": "newsha", "before": "oldsha"},
        )
        self.assertIn("newsha", summary)
        self.assertNotIn("oldsha", summary)

    def test_comment_text_is_never_included(self):
        summary = build_summary(
            "issue_comment", "owner/repo", "calvin", "https://github.com/owner/repo/actions/runs/1",
            "sha", "refs/heads/main",
            {"action": "created", "comment": {"body": "DO NOT INCLUDE ME"}},
        )
        self.assertNotIn("DO NOT INCLUDE ME", summary)

    def test_untrusted_markdown_is_escaped_and_bounded(self):
        summary = build_summary(
            "pull_request_target", "owner/repo", "actor", "https://github.com/run",
            "sha", "refs/heads/main",
            {"pull_request": {"number": 1, "title": "[click](https://evil.example) " + "x" * 400,
                              "head": {"sha": "sha", "ref": "branch"}}},
        )
        self.assertNotIn("[click]", summary)
        self.assertLess(len(summary), 2500)

    def test_html_brackets_are_escaped_without_double_escaping(self):
        summary = build_summary(
            "pull_request_target", "owner/repo", "actor", "https://github.com/run",
            "sha", "refs/heads/main",
            {"pull_request": {"number": 1, "title": "<img src=x onerror=alert(1)> a > b",
                              "head": {"sha": "sha", "ref": "branch"}}},
        )
        self.assertNotIn("<img", summary)
        self.assertIn("&lt;img", summary)
        self.assertIn("a &gt; b", summary)
        self.assertNotIn(r"\&", summary)
        self.assertNotIn("&amp;", summary)


if __name__ == "__main__":
    unittest.main()
