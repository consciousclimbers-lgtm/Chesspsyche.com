# ChessPsyche agent monitoring bridge

This is a read-only GitHub event sender. It does not modify repository content, merge pull requests, deploy the site, or comment on issues.

## Events covered

- Pull request opened/reopened/updated/marked ready/converted to draft/closed
- Pull request reviews and inline review comments
- Issue/PR conversation comments (only event metadata is forwarded; comment text is excluded)
- Pushes to `main`
- Completed `Regression tests` and `Live Guardian` workflows
- Deployment status changes
- Manual workflow dispatch

The workflow uses `pull_request_target` only for a metadata-only notification job. It explicitly checks out the trusted default branch, never checks out or executes pull-request code, and sends only a small allow-list of metadata. The workflow has `contents: read` permissions.

## Local tests

No third-party Python packages are needed:

```sh
python3 -m unittest discover -s tools/agent-bridge -p 'test_*.py' -v
```

The tests cover HTTPS URL validation, event-specific commit selection, exclusion of comment/body text, stable event IDs, and bounded retries.

## Receiver contract

Configure these repository Actions secrets only after a real HTTPS receiver is ready:

- `CHESSPSYCHE_AGENT_WEBHOOK_URL` — receiver URL using HTTPS on port 443
- `CHESSPSYCHE_AGENT_WEBHOOK_TOKEN` — bearer token expected by the receiver

The sender validates the URL before constructing or sending an Authorization header, rejects URL user/password credentials and redirects, uses TLS verification, sends an idempotency key, retries only a bounded number of times, and never prints the token, URL, or receiver response body.

The receiver should:
1. Require the bearer token and compare it safely.
2. Enforce a request-size limit and validate the schema.
3. Deduplicate on `event_id`.
4. Return 2xx only after durable acceptance; do not claim the agent has completed a review.
5. Keep a minimal delivery record and avoid storing comment text or other unnecessary personal data.

## Honest status reporting

- Missing URL or token: `NOT CONFIGURED`; no event is sent.
- Receiver returns 2xx: `EVENT FORWARDED`; this proves only that the receiver accepted the request.
- URL validation, authentication, or delivery failure: the workflow fails with a generic message that does not disclose secrets.

**Not yet online:** no receiver or independent agent endpoint is provisioned in this repository. Do not add secrets until a receiver has been deployed and tested. The bridge cannot independently start an AI review until the receiver is connected to an agent with an authorized credential.
