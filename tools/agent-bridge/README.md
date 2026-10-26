# ChessPsyche GitHub-only event monitoring

This workflow keeps event reporting inside GitHub Actions. It uses no external receiver, webhook, API token, paid hosting, or additional service.

## Events covered

- Pull request opened/reopened/updated/marked ready/converted to draft/closed
- Pull request reviews and inline review comments
- Issue/PR conversation comment events (comment text is never included)
- Pushes to `main`
- Completed `Regression tests` and `Live Guardian` workflows
- Deployment status changes
- Manual workflow dispatch

For each event, `.github/workflows/agent-monitor-bridge.yml` writes a concise report into the GitHub Actions run summary. The report includes only allow-listed metadata such as event type, actor, source commit, PR number/title/link, workflow result, and deployment state when available. It does not include comment text, issue bodies, PR diffs, or arbitrary event fields.

The workflow has `contents: read` permission. It checks out only the trusted default branch to run the summary builder; it never checks out or executes pull-request head code. It does not write to the repository, comment, approve, merge, or deploy.

## Tests

No third-party Python packages or secrets are needed:

```sh
python3 -m unittest discover -s tools/agent-bridge -p 'test_*.py' -v
```

The tests cover source commit selection, workflow result reporting, omission of comment/body content, and safe handling of untrusted Markdown metadata.

## How people and AI reviewers use the updates

GitHub Actions stores the report with the workflow run, where people with repository access can open it. Repo Claude and ChatGPT can inspect the repository, PRs, commits, and available workflow runs through their respective GitHub access. Gemini can independently review the evidence when asked.

This does **not** automatically wake up Claude, ChatGPT, or Gemini or invoke an AI review. Use GitHub's built-in notification/watch settings for alerts; availability and timing depend on each account's settings. No separate service is configured or required by this change.

## Honest status

- A green monitoring job means the event summary was written, not that the underlying regression workflow passed.
- A successful CI run is not proof that the live site was verified.
- Live verification still requires the existing deployment and Live Guardian checks on the deployed commit.
- This workflow is informational only and does not bypass Calvin's approval requirement for merging or deployment.
