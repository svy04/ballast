# ballast

**ballast is a Claude Code plugin that keeps long sessions from drifting: each standing rule you set arrives with every message it matches, and every decision locks into an append-only ledger.**

Plain markdown skills plus one zero-dependency script; two commands to install, `node` ≥ 18 the only requirement. It ships empty: the hook stays silent until rules enter your catalog, and Quick start below is how they get there.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE) · [Changelog](CHANGELOG.md)

[Install](#install) · [Why](#why-ballast) · [What changes](#what-changes) · [Pieces](#the-pieces) · [Quick start](#quick-start) · [Philosophy](#philosophy)

What that looks like in a session:

> **You:** "that cheaper model looks fine — just switch to it"
> **rules hook** *(delivered with your message, before Claude answers)*: "Never swap what the user fixed. Check `memory/DECISIONS.md` first; propose, the user decides."
> **Claude:** "You pinned this model on Aug 13 — entry D-012 in your ledger. Here's the comparison; your call."

The middle line is the part ballast guarantees: "switch" matched a rule, so the full rule text arrived with the message — Claude never has to remember it. The last line is Claude following the rule it was handed: it opens the ledger because the rule tells it to, not because it recalled D-012 on its own.

## Install

```
/plugin marketplace add svy04/ballast
/plugin install ballast@ballast
```

The hook runs on the `node` (≥ 18) already on your PATH. Everything else is markdown.

## Why ballast

| Problem | What you see | The fix |
|---|---|---|
| `CLAUDE.md` is read once; long sessions drift away from it | The same correction, repeated every session | **rules hook** *(code)* delivers the full text of matching rules with each message |
| Decisions live in old chats | Settled questions get relitigated, or quietly rewritten | **decision ledger** *(convention)* is append-only; changes happen by supersede |
| Plausible statements harden into facts | Confident answers built on unverified claims | **verify gate** *(convention)*: every claim carries a label, `confirmed` must be earned |
| Copy describes the roadmap, not the product | "We do X" about features that don't exist | **proof standard** *(convention)*: external claims come only from a truth file — a record of what the product verifiably does, with evidence attached |
| "Done" means Claude said so | Declared success, quiet failure | **goal** *(convention)*: done means a check passed — file exists, test passes, output inspected |

One row is enforced by code: the rules hook is a script that fires on every prompt, whether Claude cooperates or not. The other four are conventions — markdown instructions Claude follows, which can therefore drift like any prompt. ballast does not pretend otherwise. Its route from convention to enforcement is **pin**: when a convention slips, you correct it once, pin writes the correction into the rule catalog, and the hook delivers it from then on.

## What changes

| Before | After |
|---|---|
| You repeat the same correction every week | **pin** writes it once; it arrives with every matching message |
| Standing rules cost context whether relevant or not | Only matching rules are delivered, capped at 12 rules / ~6,000 chars (fixed in the hook source) |
| Prompts you'd rather have stopped go straight through | `action: "block"` refuses matching prompts and shows your rule as the reason — a guardrail, not a sandbox (fail-open; see Quick start) |
| Memory resets with every session | `memory/` files persist: index, ledger, open questions, session log |

## The pieces

| Piece | Kind | Role |
|---|---|---|
| **rules hook** | code — script on every prompt | Delivers the full text of every matching rule with the message, before the work starts. Rules marked `action: "block"` stop the prompt instead. |
| **decision-ledger** | convention — markdown skill | Append-only `DECISIONS.md`; changed minds get supersede links, never silent edits. |
| **verify-gate** | convention — markdown skill | Research and model knowledge stay drafts until they survive an attempt to refute them, cite named sources, and carry a label (`confirmed` / `observed` / `assumed` / `hearsay` / `unknown`). |
| **proof-standard** | convention — markdown skill | No external claim about your product without evidence in a truth file. Code is tracked in four states (implemented, wired, operational, verified) and copy may not blur them. |
| **brain-init** | convention — markdown skill | Scaffolds the memory structure: index, ledger, open questions, session log, product truth. |
| **goal** | convention — markdown skill | Takes a goal too big or unfamiliar to trust your instincts on: maps the field's open questions and beginner traps first, breaks the goal into pieces small enough to verify one by one, and calls nothing done until a check passes. |
| **pin** | convention — writes rules the hook enforces | Turns the correction you just made into a permanent rule, in one step. |

## Quick start

1. Correct Claude about anything once. A correction is the **pin** skill's cue: Claude drafts the rule entry, shows it to you, and writes it to the catalog on your OK — from then on it arrives with every message it matches.
2. `/ballast:brain-init` scaffolds the memory files in your project.
3. `/ballast:goal <something big>` runs the full pipeline. In an unfamiliar field it starts by mapping what the field argues about, what is settled, and where beginners get burned — before it produces a single answer.

Rules live in `<project>/.claude/ballast.rules.json` and `~/.claude/ballast.rules.json` (project wins on duplicate `id`):

```json
{
  "id": "cost-gate",
  "title": "Estimate before spending",
  "when": { "keywords": ["generate", "credits"], "patterns": ["\\bbatch\\b"] },
  "action": "inject",
  "body": "Anything that spends money: estimate first, explicit approval, then execute."
}
```

`keywords` match as case-insensitive substrings, `patterns` as regex, `always: true` fires on every message (keep to 1–2 rules). `action: "block"` stops the prompt and shows `body` as the reason. `BALLAST_DISABLE=1` turns the hook off.

Two design facts to know before you lean on it. The hook fails silently: a broken catalog, a bad regex, or an internal error never breaks your session. The same choice makes it fail-open: if the hook cannot run at all — `node` missing from PATH, catalog unreadable — `block` rules do not fire either. Treat blocks as a guardrail, not a sandbox.

Start from [`rules/ballast.rules.example.json`](rules/ballast.rules.example.json), or let **pin** write entries for you. To put a second model on verification duty, copy [`rules/ballast.verifier.example.json`](rules/ballast.verifier.example.json) to `.claude/ballast.verifier.json` and point `command` at any CLI that will argue against a claim — the verify-gate skill runs it and weighs the refutation before labeling anything `confirmed`.

Before your first push from any Claude-operated repo, walk [docs/PUBLISH-CHECKLIST.md](docs/PUBLISH-CHECKLIST.md) — these workspaces accumulate secrets in files you stopped looking at.

## Philosophy

ballast assumes that when a long Claude session goes wrong, the usual cause is memory or overconfidence, not capability. So rules live in files and arrive with the message that needs them. Decisions live in a ledger that cannot be quietly rewritten. Claims carry labels until they earn `confirmed`.

By those labels, this README owes you two disclosures. The track record is `hearsay`: ballast exists because one person with no development background runs an entire job through Claude Code and has to be able to trust the results — but those months of daily use happened in a private company workspace, and this public repo dates from August 2026, so there is no history here you can open. What you can check is the mechanism: the hook, the six skills, and the rule format are all in this repo, readable in an afternoon. The novelty claim is `unknown`: injecting context on prompt submit is a documented Claude Code hook pattern and append-only records long predate software; "we have not seen the whole loop elsewhere" is the most ballast can say. If you know prior art for the loop, open an issue and we'll link it.

---

MIT · 한국어 문서: [README.ko.md](README.ko.md)
