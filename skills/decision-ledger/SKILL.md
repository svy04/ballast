---
name: decision-ledger
description: Maintain an append-only decision ledger (DECISIONS.md). Use when the user confirms a decision, reverses or changes a past decision, asks what was decided and why, or at session start to load standing decisions.
---

# Decision ledger

One file holds every confirmed decision: `memory/DECISIONS.md` (run brain-init if it doesn't exist yet). The ledger is **append-only** — nothing is ever edited or deleted. Changed minds are recorded as new entries that supersede old ones.

## Entry format

```markdown
## D-021 · <short title> — <YYYY-MM-DD> (<source: who confirmed, in what context>)

<What was decided, in the decider's own terms. Include the reason if one was given.>
```

## Rules

1. **Append-only.** Never rewrite, reorder, or remove an existing entry. The ledger is trustworthy precisely because it cannot be quietly rewritten.
2. **User-confirmed only.** Record what the user actually decided, not what you proposed. If your proposal was adopted, say so: `(AI-proposed, user-confirmed)`. Never promote your own suggestion to a decision.
3. **Supersede, don't edit.** When a decision changes: write a new entry stating what changed and `supersedes D-xxx`, then add exactly one line to the old entry: `→ superseded by D-yyy (YYYY-MM-DD)`. That backlink is the only permitted touch to an old entry.
4. **Record in-session.** The moment a decision is confirmed, write it — not at the end of the conversation. Topic changes destroy unwritten decisions.
5. **Sequential ids.** `D-001, D-002, …` Never reuse a number, even after supersede.
6. **Surface conflicts.** If a new decision contradicts a standing entry and the user hasn't acknowledged that, point it out *before* recording — then record whichever the user confirms, with the supersede link.

## Reading the ledger

At session start (or when context resets), read the ledger before substantive work. Standing decisions are followed **without relitigating** — if you believe a decision is wrong, say so once, with reasons, and let the user decide whether to supersede it.

## Why this works

An LLM session forgets; a file does not. But a file that can be silently edited is worse than no file — it *feels* authoritative while drifting. Append-only + supersede gives you both: current truth at a glance, and the full history of how you got there.
