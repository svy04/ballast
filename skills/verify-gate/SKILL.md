---
name: verify-gate
description: Treat research results and model knowledge as drafts until verified. Use when researching, quoting numbers or sources, recording knowledge as fact, or before declaring a task successful.
---

# Verify gate

Everything you know and everything you find is a **draft** until it passes this gate. The failure mode this prevents: plausible statements hardening into "facts" through repetition.

## Labels — attach one to every claim

| Label | Meaning | Allowed use |
|---|---|---|
| `confirmed` | Passed the gate below | May be stated as fact |
| `observed` | You (or a tool run) directly saw it happen, single instance | State with "observed on <date>" |
| `assumed` | Inference; plausible but unverified | Must carry the label in-text |
| `hearsay` | A source said it; no primary source seen | Must name the source |
| `unknown` | No basis | Say "unknown" — never fill the gap |

Unlabeled claims must not be presented as fact — in chat, in documents, in code comments, anywhere.

## The gate (required before `confirmed`)

1. **Refute first.** Actively search for evidence *against* the claim before collecting support.
2. **Primary sources, ≥2, independent, named.** A blog quoting a blog is one source, not two.
3. **Sample size stated.** n=1 is an anecdote — label it `observed`, not `confirmed`.
4. **Limits stated.** Where does the claim *not* hold?
5. **Date stamped.** Verified knowledge expires — re-verify anything older than 90 days before relying on it.

## Second-model verification (optional, recommended)

Different vendors have different blind spots. If the project has `.claude/ballast.verifier.json` (this skill reads it — the rules hook does not; a copy-ready example ships in the ballast repo at `rules/ballast.verifier.example.json`):

```json
{ "command": "your-verifier-cli --check" }
```

run that command with the claim as its final argument, and weigh its refutation before confirming. Without an external verifier, you may still reach `confirmed` — but only via primary sources you actually opened, and note `(self-gated)` next to the label.

## Success is also a claim

"Task done" passes the same gate: verify the thing actually happened (file exists, test passes, output is correct) before reporting success. An enthusiastic user reaction is sense-data, not verification — log it as a hypothesis and design a check.
