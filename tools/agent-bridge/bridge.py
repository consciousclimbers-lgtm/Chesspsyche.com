#!/usr/bin/env python3
"""Send a minimal, allow-listed GitHub event to a configured HTTPS receiver.

This module deliberately does not include comment text, issue bodies, PR diffs,
secrets, or arbitrary event payloads. A 2xx response means accepted for delivery,
not that an agent completed an investigation.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


RETRYABLE_STATUS = {429, 500, 502, 503, 504}
MAX_ATTEMPTS = 3


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Never forward an Authorization header to a redirect target."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: N802
        return None


def validate_endpoint(value: str) -> str:
    """Require a plain HTTPS URL; reject userinfo, fragments and nonstandard ports."""
    if not value or any(ch.isspace() or ord(ch) < 32 or ord(ch) == 127 for ch in value):
        raise ValueError("receiver URL is missing or contains whitespace/control characters")
    try:
        parsed = urllib.parse.urlsplit(value)
        port = parsed.port
    except ValueError as exc:
        raise ValueError("receiver URL is malformed") from exc
    if parsed.scheme != "https" or not parsed.hostname:
        raise ValueError("receiver URL must use HTTPS and include a hostname")
    if parsed.username is not None or parsed.password is not None:
        raise ValueError("receiver URL must not contain username/password credentials")
    if parsed.fragment:
        raise ValueError("receiver URL must not contain a fragment")
    if port not in (None, 443):
        raise ValueError("receiver URL must use the standard HTTPS port")
    return value


def _first(*values: Any) -> Any:
    for value in values:
        if value is not None and value != "":
            return value
    return None


def build_payload(
    event_name: str,
    repository: str,
    fallback_sha: str,
    fallback_ref: str,
    run_id: str,
    run_attempt: str,
    server_url: str,
    event: dict[str, Any],
) -> dict[str, Any]:
    """Build a small payload from known event fields only."""
    action = event.get("action")
    pr = event.get("pull_request") or {}
    issue = event.get("issue") or {}
    workflow_run = event.get("workflow_run") or {}
    deployment = event.get("deployment") or {}
    deployment_status = event.get("deployment_status") or {}
    sender = event.get("sender") or {}
    repo_name = repository or (event.get("repository") or {}).get("full_name") or "unknown"

    source_sha = _first(
        pr.get("head", {}).get("sha"),
        workflow_run.get("head_sha"),
        deployment.get("sha"),
        event.get("after") if event_name == "push" else None,
        fallback_sha if event_name == "workflow_dispatch" else None,
    )
    source_ref = _first(
        pr.get("head", {}).get("ref"),
        workflow_run.get("head_branch"),
        event.get("ref") if event_name == "push" else None,
        fallback_ref if event_name in {"workflow_dispatch", "deployment_status"} else None,
    )
    pr_number = _first(pr.get("number"), issue.get("number"))
    pr_url = _first(pr.get("html_url"), issue.get("pull_request", {}).get("html_url"))
    pr_title = pr.get("title")
    # Do not treat an ordinary issue as a pull request.
    if not issue.get("pull_request") and not pr:
        pr_number = None
        pr_url = None
        pr_title = None

    source_run_id = workflow_run.get("id")
    source_run_url = workflow_run.get("html_url")
    if not source_run_url:
        source_run_url = f"{server_url.rstrip('/')}/{repo_name}/actions/runs/{run_id}"

    identity = {
        "event": event_name,
        "action": action,
        "repository": repo_name,
        "sha": source_sha,
        "ref": source_ref,
        "pull_request_number": pr_number,
        "review_id": (event.get("review") or {}).get("id"),
        "comment_id": (event.get("comment") or {}).get("id"),
        "workflow_run_id": source_run_id,
        "deployment_id": deployment.get("id"),
        "deployment_status_id": deployment_status.get("id"),
        "dispatch_run_id": run_id if event_name == "workflow_dispatch" else None,
    }
    stable_id = hashlib.sha256(
        json.dumps(identity, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()

    return {
        "schema_version": 1,
        "event_id": stable_id,
        "event_name": event_name,
        "action": action,
        "repository": repo_name,
        "sha": source_sha,
        "ref": source_ref,
        "bridge_run_id": str(run_id),
        "bridge_run_attempt": str(run_attempt),
        "source_run_id": source_run_id,
        "source_run_url": source_run_url,
        "pull_request_number": pr_number,
        "pull_request_url": pr_url,
        "pull_request_title": pr_title,
        "workflow_name": workflow_run.get("name"),
        "workflow_conclusion": workflow_run.get("conclusion"),
        "deployment_state": deployment_status.get("state"),
        "sender": sender.get("login"),
    }


def _write_summary(title: str, lines: list[str]) -> None:
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_path:
        return
    with open(summary_path, "a", encoding="utf-8") as summary:
        summary.write(f"## {title}\n")
        for line in lines:
            summary.write(f"- {line}\n")


def _post_once(url: str, token: str, payload: dict[str, Any]) -> int:
    data = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "ChessPsyche-Agent-Bridge/1.0",
            "X-Idempotency-Key": payload["event_id"],
        },
    )
    opener = urllib.request.build_opener(NoRedirectHandler)
    # Do not follow redirects: a bearer token must never be forwarded to another host.
    with opener.open(request, timeout=15) as response:
        return int(response.status)


def deliver(url: str, token: str, payload: dict[str, Any]) -> int:
    """Bounded retries for network errors and transient receiver failures."""
    last_status: int | None = None
    for attempt in range(MAX_ATTEMPTS):
        try:
            status = _post_once(url, token, payload)
            if 200 <= status < 300:
                return status
            last_status = status
            if status not in RETRYABLE_STATUS:
                raise RuntimeError("receiver returned a non-success HTTP status")
        except urllib.error.HTTPError as exc:
            last_status = exc.code
            if exc.code not in RETRYABLE_STATUS:
                raise RuntimeError("receiver rejected the event or redirected the request") from None
        except (urllib.error.URLError, TimeoutError, OSError):
            last_status = None
        if attempt < MAX_ATTEMPTS - 1:
            time.sleep(attempt + 1)
    if last_status is not None:
        raise RuntimeError(f"receiver did not accept the event (HTTP {last_status})")
    raise RuntimeError("receiver could not be reached after bounded retries")


def main() -> int:
    url = os.environ.get("AGENT_WEBHOOK_URL", "")
    token = os.environ.get("AGENT_WEBHOOK_TOKEN", "")
    if not url or not token:
        message = (
            "No event was sent. Configure both CHESSPSYCHE_AGENT_WEBHOOK_URL and "
            "CHESSPSYCHE_AGENT_WEBHOOK_TOKEN after a receiver is ready."
        )
        print("NOT CONFIGURED: " + message)
        _write_summary("Agent monitoring bridge: NOT CONFIGURED", [message])
        return 0

    try:
        # Validate the URL before constructing or sending any Authorization header.
        validate_endpoint(url)
        event_path = Path(os.environ["EVENT_PATH"])
        event = json.loads(event_path.read_text(encoding="utf-8"))
        payload = build_payload(
            os.environ.get("EVENT_NAME", ""),
            os.environ.get("REPOSITORY", ""),
            os.environ.get("SHA", ""),
            os.environ.get("REF", ""),
            os.environ.get("RUN_ID", ""),
            os.environ.get("RUN_ATTEMPT", ""),
            os.environ.get("SERVER_URL", "https://github.com"),
            event,
        )
        if not payload["event_name"] or not payload["repository"]:
            raise ValueError("required event metadata is missing")
        if not payload["sha"] and payload["event_name"] not in {"issue_comment"}:
            raise ValueError("the source commit SHA could not be identified safely")
        status = deliver(url, token, payload)
    except (ValueError, KeyError, OSError, json.JSONDecodeError, RuntimeError) as exc:
        # Exception messages are intentionally generic; never print the URL, token or receiver body.
        message = str(exc)
        print("DELIVERY FAILED: " + message, file=sys.stderr)
        _write_summary("Agent monitoring bridge: DELIVERY FAILED", [message])
        return 1

    print(f"EVENT FORWARDED: {payload['event_name']} for {payload['repository']}")
    print(f"Source SHA: {payload['sha'] or 'not supplied by this event'}")
    print(f"Receiver HTTP status: {status} (delivery only; agent review not confirmed)")
    _write_summary(
        "Agent monitoring bridge: EVENT FORWARDED",
        [
            f"Event: {payload['event_name']}",
            f"Repository: {payload['repository']}",
            f"Source SHA: {payload['sha'] or 'not supplied by this event'}",
            f"Receiver accepted the request (HTTP {status}). Agent review is not confirmed.",
        ],
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
