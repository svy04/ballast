# ⚓ ballast

**A goal engine for Claude Code that doesn't trust itself.**

Hand it a goal — a campaign, a codebase, a field you've never touched. ballast structures Claude to *earn* the result instead of asserting it: scan the terrain before writing answers, build the full skeleton, break the foundations into atomic pieces, verify every piece before believing it, and build from bedrock to a verified done.

Ten seconds of the philosophy in action:

> **You:** "that cheaper model looks fine — just switch to it"
> **ballast** *(rule injected before Claude answers)*: "Never swap what the user fixed. Propose; the user decides."
> **Claude:** "You pinned this model on Aug 13 (ledger D-012). Here's the comparison — your call."

Claude didn't remember to be careful. The system made carefulness arrive.

## What's in the box

| Piece | Kind | What it does |
|---|---|---|
| **goal** | skill | The engine. Terrain scan (questions before answers) → full skeleton → atomic leaves, each verified before it's load-bearing → re-check loop → done means verified, not declared. |
| **rules hook** | hook | Your standing rules, auto-injected into every message they apply to — full text, before the work starts. Danger patterns hard-blocked. Tell Claude once. |
| **pin** | skill | Turns a correction you just made into a permanent rule, in one step. |
| **verify-gate** | skill | Research and model knowledge stay drafts until gated: refute-first, ≥2 primary sources, sample size, stated limits, labels. |
| **decision-ledger** | skill | Append-only `DECISIONS.md` — changed minds get supersede links, not silent edits. |
| **proof-standard** | skill | No external claim about your product without evidence in a truth file. Four code states, never blended. |
| **brain-init** | skill | Scaffolds the memory structure: index, ledger, open questions, session log, product truth. |

Distilled from a real system: a non-developer ran their entire job through Claude Code for months, new fields included. These are the pieces that made the results hold up, with the company-specific parts removed.

## Install

```
/plugin marketplace add svy04/ballast
/plugin install ballast@ballast
```

The rules hook is a single zero-dependency script; it needs `node` (≥ 18) on your PATH. Everything else is plain markdown.

## Quick start

1. `/ballast:goal <something big>` — run a goal through the full pipeline. For an unfamiliar field it will collect the field's questions, traps, and standard tools *before* producing answers.
2. Or start small: `/ballast:brain-init` scaffolds the memory structure in your project.
3. Correct Claude about anything once → it offers to **pin** the correction as a rule → that rule now arrives automatically with every future message it applies to.

## The rules hook

Claude Code loads your `CLAUDE.md` once — but long sessions drift away from it, and standing rules cost context whether relevant or not. The hook flips the direction: rules live in a catalog, and each incoming message gets **only the rules that match it**, injected at full text.

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

- `keywords` — case-insensitive substring match; `patterns` — regex; `always: true` — every message (1–2 rules max)
- `action: "block"` — stop the prompt outright and show `body` as the reason
- Injection is capped (12 rules / ~6,000 chars) — hitting the cap means your catalog needs pruning
- Escape hatches: `BALLAST_DISABLE=1` turns the hook off; `BALLAST_DEBUG=1` prints diagnostics to stderr. A broken catalog never breaks your session — the hook fails silent by design.

Start from [`rules/ballast.rules.example.json`](rules/ballast.rules.example.json), or just let **pin** write the catalog for you.

## Hygiene — read before you publish anything

A Claude-operated workspace accumulates secrets and private facts in places you stopped looking at: `settings.local.json`, session transcripts, memory files. In 2026 alone, public reports include hundreds of npm packages that accidentally shipped `.claude/settings.local.json` (some with live credentials) and a major vendor shipping internal `CLAUDE.md` files inside a signed mobile app. Scanners like [claudleak](https://github.com/hazcod/claudleak) exist because this keeps happening.

Before your first push from any Claude-operated repo, walk [docs/PUBLISH-CHECKLIST.md](docs/PUBLISH-CHECKLIST.md). ballast's own `.gitignore` follows it.

## Prior art & an honesty note

This README practices its own verify-gate labels: as of **August 2026** we searched for and could not find public projects doing per-message **rule-body** injection (closest: hooks that suggest skill *names*), a single append-only decision ledger with two-way supersede links, or a product-truth file with a no-unproven-claims standard. `could not find` ≠ `does not exist` — if you know prior art, open an issue and we'll link it here.

## License

MIT · 한국어 문서: [README.ko.md](README.ko.md)
