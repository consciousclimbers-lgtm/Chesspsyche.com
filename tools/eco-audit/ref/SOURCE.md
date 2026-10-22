# Reference data: lichess-org/chess-openings

The five files `a.tsv` to `e.tsv` are copied unchanged from
[lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) at commit `a6189a3`
(fetched 2026-10-20, 3,865 lines). The data set is in the public domain (CC0 1.0), as its README states.

`SOURCE.json` pins the sha256 of every file. `eco_audit.js` checks them before it runs and stops
("AUDIT NOT RUN") if any file is missing or different, so the audit always compares against the same reference.

| File | sha256 |
|---|---|
| a.tsv | `3282e4c9155289a29224f9a85fba0decb46efa35c2fa5e39662d2ac48fb0f793` |
| b.tsv | `1d5ed134ebbd87915ead5683416e37583bb3e5ae3582b4d8cb5cb4aa7ef4f623` |
| c.tsv | `45e843c7b7e79a0d04d5bda879c9bd23f5a10974488bd8615e4f4c5d0749986f` |
| d.tsv | `1cf4057a8aece94f27bb3f278ad410ee2844831a642364eeceaafa091dbcceda` |
| e.tsv | `48c6f6645b031a5937c8386839debab0e2e48837251687ba1afb6369677f8546` |

To update the reference, open a PR that changes only these files, `SOURCE.json` and this page, and
compare the audit report before and after.
