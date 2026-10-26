#!/usr/bin/env python3
"""Write a safe, useful GitHub Actions summary from allow-listed event metadata."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any


def _clean(value: Any, limit: int = 240) -> str:
    """Make metadata safe for a Markdown job summary and keep it bounded."""
    if value is None:
        return "not provided"
    text = re.sub(r"[\x00-\x1f\x7f]", " ", str(value))
    # Escape HTML brackets first so the entities below are not escaped again.
    text = text.replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"([\\`*_{}\[\]()#+.!|~-])", r"\\\1", text)
    return text[:limit]


def build_summary(event_name: str, repository: str, actor: str, run_url: str,
                  fallback_sha: str, fallback_ref: str, event: dict[str, Any]) -> str:
    """Summarize only known metadata; never include comments, bodies, diffs, or secrets."""
    pr = event.get("pull_request") or {}
    issue = event.get("issue") or {}
    workflow_run = event.get("workflow_run") or {}
    deployment = event.get("deployment") or {}
    deployment_status = event.get("deployment_status") or {}

    sha = (
        (pr.get("head") or {}).get("sha")
        or workflow_run.get("head_sha")
        or deployment.get("sha")
        or (event.get("after") if event_name == "push" else None)
        or (fallback_sha if event_name == "workflow_dispatch" else None)
        or fallback_sha
    )
    ref = (
        (pr.get("head") or {}).get("ref")
        or workflow_run.get("head_branch")
        or (event.get("ref") if event_name == "push" else None)
        or fallback_ref
    )
    pr_number = pr.get("number") or (issue.get("number") if issue.get("pull_request") else None)
    pr_title = pr.get("title") or (issue.get("title") if issue.get("pull_request") else None)
    pr_url = pr.get("html_url") or (issue.get("pull_request") or {}).get("html_url")
    workflow_name = workflow_run.get("name")
    conclusion = workflow_run.get("conclusion")
    source_run_url = workflow_run.get("html_url")
    deployment_state = deployment_status.get("state")
    action = event.get("action")

    lines = [
        "## ChessPsyche GitHub event report",
        "",
        f"- **Event:** {_clean(event_name)}" + (f" / {_clean(action)}" if action else ""),
        f"- **Repository:** {_clean(repository)}",
        f"- **Actor:** {_clean(actor)}",
        f"- **Source commit:** `{_clean(sha, 64)}`",
        f"- **Ref:** `{_clean(ref)}`",
        f"- **This report:** {_clean(run_url, 300)}",
    ]
    if pr_number is not None:
        lines.extend([
            f"- **Pull request:** #{_clean(pr_number, 20)}",
            f"- **PR title:** {_clean(pr_title)}",
            f"- **PR link:** {_clean(pr_url, 300)}",
        ])
    if workflow_name:
        lines.extend([
            f"- **Completed workflow:** {_clean(workflow_name)}",
            f"- **Result:** {_clean(conclusion)}",
            f"- **Workflow run:** {_clean(source_run_url, 300)}",
        ])
    if deployment_state:
        lines.append(f"- **Deployment status:** {_clean(deployment_state)}")

    lines.extend([
        "",
        "**What this does:** records useful event metadata inside GitHub Actions.",
        "**What this does not do:** send data to an outside service, invoke an AI agent, approve a PR, merge code, or deploy the site.",
        "",
        "Review the linked workflow/check in GitHub. A report is not proof that the live site was verified.",
        "",
    ])
    return "\n".join(lines)


def main() -> None:
    event_path = os.environ.get("GITHUB_EVENT_PATH", "")
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY", "")
    if not event_path or not summary_path:
        raise SystemExit("Required GitHub Actions event/summary paths are missing.")
    event = json.loads(Path(event_path).read_text(encoding="utf-8"))
    summary = build_summary(
        os.environ.get("GITHUB_EVENT_NAME", "unknown"),
        os.environ.get("GITHUB_REPOSITORY", "unknown"),
        os.environ.get("GITHUB_ACTOR", "unknown"),
        os.environ.get("GITHUB_SERVER_URL", "https://github.com") + "/" +
        os.environ.get("GITHUB_REPOSITORY", "unknown") + "/actions/runs/" +
        os.environ.get("GITHUB_RUN_ID", "unknown"),
        os.environ.get("GITHUB_SHA", "unknown"),
        os.environ.get("GITHUB_REF", "unknown"),
        event,
    )
    with open(summary_path, "a", encoding="utf-8") as output:
        output.write(summary)


if __name__ == "__main__":
    main()
