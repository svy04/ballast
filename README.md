# ⚓ ballast

**A discipline layer for Claude Code — so your AI second brain doesn't drift.**

If you run Claude as your external memory — decisions, research, product facts, ongoing work — the failure mode isn't forgetting. It's **drift**: unverified claims harden into "facts", past decisions get quietly rewritten, and confident copy ships about features that don't exist.

ballast is the counterweight (the heavy stuff low in a ship's hull that keeps it upright). One plugin, five pieces:

| Piece | Kind | What it does |
|---|---|---|
| **rules hook** | hook | Matches every user message against your rule catalog and injects the **full text** of the rules that apply — before the work starts. Can hard-block configured danger patterns. |
| **decision-ledger** | skill | Append-only `DECISIONS.md`: decisions are never edited or deleted, only superseded — with links both ways. |
| **verify-gate** | skill | Research and model knowledge are drafts until gated: refute-first, ≥2 primary sources, sample size, stated limits, 90-day freshness. Optional second-model verification. |
| **proof-standard** | skill | No external claim about your product without evidence in a truth file. Four code states — implemented / wired / operational / verified — never blended. |
| **brain-init** | skill | Scaffolds the memory structure (index, ledger, open questions, session log, product truth) in any project. |

Distilled from a real system: a non-developer ran their entire job through Claude Code for months. These are the pieces that kept that system honest, with the company-specific parts removed.

## Install

```
/plugin marketplace add svy04/ballast
/plugin install ballast@ballast
```

The rules hook is a single zero-dependency script; it needs `node` (≥ 18) on your PATH. Everything else is plain markdown.

## Quick start

1. `/ballast:brain-init` — scaffold `memory/` and the session-start rules in your current project.
2. Copy [`rules/ballast.rules.example.json`](rules/ballast.rules.example.json) to `<project>/.claude/ballast.rules.json` and prune it to the rules you actually mean.
3. Work normally. Confirm a decision → it lands in the ledger. Research something → claims get labels. Write product copy → it cites the truth file. Type something that matches a danger pattern → the hook stops it before the agent sees it.

## The rules hook

Claude Code loads your `CLAUDE.md` once — but long sessions drift away from it, and 40 standing rules cost context on every request whether relevant or not. The hook flips this: rules live in a catalog, and each user message gets **only the rules that match it**, injected as context at full text.

Catalogs, merged in this order (project wins on duplicate `id`):

1. `~/.claude/ballast.rules.json` — your personal rules, every project
2. `<project>/.claude/ballast.rules.json` — this project's rules

Rule format:

```json
{
  "id": "cost-gate",
  "title": "Estimate before spending",
  "when": { "keywords": ["generate", "credits"], "patterns": ["\\bbatch\\b"], "always": false },
  "action": "inject",
  "body": "Anything that spends money: estimate first, explicit approval, then execute."
}
```

- `keywords` — case-insensitive substring match against the message
- `patterns` — regular expressions (case-insensitive)
- `always: true` — inject on every message (use for 1–2 rules at most)
- `action: "block"` — instead of injecting, stop the prompt and show `body` as the reason
- Injection is capped (12 rules / ~6,000 chars) — if you hit the cap, your catalog needs pruning, not a bigger cap

Escape hatches: `BALLAST_DISABLE=1` turns the hook off; `BALLAST_DEBUG=1` prints diagnostics to stderr. A broken catalog never breaks your session — the hook fails silent by design.

## Hygiene — read before you publish anything

A Claude-operated workspace accumulates secrets and private facts in places you stopped looking at: `settings.local.json`, session transcripts, memory files. In 2026 alone, public reports include hundreds of npm packages that accidentally shipped `.claude/settings.local.json` (some with live credentials) and a major vendor shipping internal `CLAUDE.md` files inside a signed mobile app. Scanners like [claudleak](https://github.com/hazcod/claudleak) exist because this keeps happening.

Before your first push from any Claude-operated repo, walk [docs/PUBLISH-CHECKLIST.md](docs/PUBLISH-CHECKLIST.md). ballast's own repo `.gitignore` follows it.

## Prior art & an honesty note

This README practices its own verify-gate labels: as of **August 2026** we searched for and could not find public projects doing per-message **rule-body** injection (closest: hooks that suggest skill *names*), a single append-only decision ledger with two-way supersede links (closest: decision-record-per-file conventions), or a product-truth file with a no-unproven-claims standard. `could not find` ≠ `does not exist` — if you know prior art, open an issue and we'll link it here.

## License

MIT · 한국어 문서: [README.ko.md](README.ko.md)
