# ballast

**ballast is a Claude Code plugin that keeps long sessions from drifting: each standing rule you set arrives with every message it matches, and every decision locks into an append-only ledger.**

- **Zero dependencies** — one script; `node` ≥ 18 is the only requirement
- **Two commands to install** — the plugin marketplace, nothing else
- **One hook + six skills** — only the hook is code-enforced, and the docs label which is which
- **Ships empty** — the hook stays silent until rules enter your catalog; [Quick start](#quick-start) is how they get there
- **Hook verified on 5 cases** — keyword inject, silence on no match, block, legacy input fields, broken catalog stays harmless
- **MIT** — the whole mechanism is readable in an afternoon

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE) · [Changelog](CHANGELOG.md)

[Install](#install) · [Why](#why-ballast) · [What changes](#what-changes) · [Pieces](#the-pieces) · [Quick start](#quick-start) · [Philosophy](#philosophy) · [Maintenance](#maintenance)

What that looks like in a session:

> **You:** "that cheaper model looks fine — just switch to it"
> **rules hook** *(delivered with your message, before Claude answers)*: "Never swap what the user fixed. Check `memory/DECISIONS.md` first; propose, the user decides."
> **Claude:** "You pinned this model on Aug 13 — entry D-012 in your ledger. Here's the comparison; your call."

The middle line is the part ballast guarantees: "switch" matched a rule, so its full text arrived with the message — and the last line is Claude following what it was handed, not what it remembered.

## Install

```
/plugin marketplace add svy04/ballast
/plugin install ballast@ballast
```

The hook runs on the `node` (≥ 18) already on your PATH. Everything else is markdown.

## Why ballast

| Problem | What you see | The fix |
|---|---|---|
| `CLAUDE.md` is read once; long sessions drift | The same correction, every session | **rules hook** *(code)* — matching rules delivered with each message |
| Decisions live in old chats | Settled questions relitigated, or quietly rewritten | **decision ledger** *(convention)* — append-only; change by supersede |
| Plausible statements harden into facts | Confident answers on unverified claims | **verify gate** *(convention)* — every claim labeled; `confirmed` is earned |
| Copy describes the roadmap, not the product | "We do X" about missing features | **proof standard** *(convention)* — external claims only from a truth file |
| "Done" means Claude said so | Declared success, quiet failure | **goal** *(convention)* — done means a check passed |

A truth file is a record of what the product verifiably does, with evidence attached; a passed check is a file that exists, a test that runs, an output actually inspected.

One row is enforced by code: the rules hook is a script that fires on every prompt, whether Claude cooperates or not. The other four are conventions — markdown instructions Claude follows, which can therefore drift like any prompt.

ballast does not pretend otherwise. Its route from convention to enforcement is **pin**: when a convention slips, you correct it once, pin writes the correction into the rule catalog, and the hook delivers it from then on.

## What changes

| Before | After |
|---|---|
| The same correction, repeated every week | **pin** writes it once; it arrives with every matching message |
| Standing rules cost context, relevant or not | Only matching rules delivered — max 12 / ~6,000 chars |
| Prompts you'd rather have stopped go through | `action: "block"` refuses them, showing your rule as the reason |
| Memory resets with every session | `memory/` persists: index, ledger, open questions, session log |

The delivery cap is fixed in the hook source. Blocking is a guardrail, not a sandbox — the hook is fail-open (see [Quick start](#quick-start)).

## The pieces

| Piece | Kind | Role |
|---|---|---|
| **rules hook** | code — script on every prompt | Delivers every matching rule with the message; `block` rules stop the prompt instead |
| **decision-ledger** | convention — markdown skill | Append-only `DECISIONS.md`; changed minds get supersede links, never silent edits |
| **verify-gate** | convention — markdown skill | Research and model knowledge stay drafts until refuted-and-survived, sourced, and labeled |
| **proof-standard** | convention — markdown skill | No external claim without evidence in a truth file; copy may not blur code states |
| **brain-init** | convention — markdown skill | Scaffolds memory: index, ledger, open questions, session log, product truth |
| **goal** | convention — markdown skill | Maps a field's traps first, splits the goal into verifiable pieces, calls nothing done until a check passes |
| **pin** | convention — writes hook rules | Turns the correction you just made into a permanent rule, in one step |

verify-gate's labels: `confirmed` / `observed` / `assumed` / `hearsay` / `unknown`. proof-standard tracks code in four states — implemented, wired, operational, verified.

## Quick start

### Pin your first rule

1. Correct Claude about anything once. A correction is the **pin** skill's cue: Claude drafts the rule entry, shows it to you, and writes it to the catalog on your OK.
2. `/ballast:brain-init` scaffolds the memory files in your project.
3. `/ballast:goal <something big>` runs the full pipeline — in an unfamiliar field it maps what's argued, what's settled, and where beginners get burned before producing a single answer.

Before any rule exists, your message arrives alone. Once the `cost-gate` rule below is in the catalog, any message containing "generate" arrives like this:

```
> generate 40 images for the launch batch

[ballast] Standing rules that apply to this request:
- Estimate before spending: Anything that spends money: estimate first,
  explicit approval, then execute.
```

### Write the catalog by hand

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

- `keywords` — case-insensitive substring match
- `patterns` — regex match
- `always: true` — fires on every message; keep to 1–2 rules
- `action: "block"` — stops the prompt and shows `body` as the reason
- `BALLAST_DISABLE=1` — turns the hook off

Start from [`rules/ballast.rules.example.json`](rules/ballast.rules.example.json), or let **pin** write entries for you.

### Know the limits

Two design choices to keep in mind:

- **Fail-silent** — a broken catalog, a bad regex, or an internal error never breaks your session.
- **Fail-open** — if the hook cannot run at all (`node` missing from PATH, catalog unreadable), `block` rules do not fire either. Treat blocks as a guardrail, not a sandbox.

To put a second model on verification duty, copy [`rules/ballast.verifier.example.json`](rules/ballast.verifier.example.json) to `.claude/ballast.verifier.json`.

Point `command` at any CLI that will argue against a claim — the verify-gate skill runs it and weighs the refutation before labeling anything `confirmed`.

Before your first push from any Claude-operated repo, walk [docs/PUBLISH-CHECKLIST.md](docs/PUBLISH-CHECKLIST.md) — these workspaces accumulate secrets in files you stopped looking at.

## Philosophy

ballast assumes that when a long Claude session goes wrong, the usual cause is memory or overconfidence, not capability. So rules live in files and arrive with the message that needs them.

Decisions live in a ledger that cannot be quietly rewritten. Claims carry labels until they earn `confirmed`.

By those labels, this README owes you two disclosures:

- **The track record is `hearsay`.** ballast exists because one person with no development background runs an entire job through Claude Code and must be able to trust the results.
  But those months of daily use happened in a private company workspace, and this public repo dates from August 2026 — no history here opens.
- **The novelty claim is `unknown`.** Injecting context on prompt submit is a documented Claude Code hook pattern, and append-only records long predate software. "We have not seen the whole loop elsewhere" is the most ballast can say.

What you can check is the mechanism: the hook, the six skills, and the rule format are all in this repo, readable in an afternoon. If you know prior art for the loop, open an issue and we'll link it.

## Maintenance

Version history lives in [CHANGELOG.md](CHANGELOG.md) — each release records what changed and what was corrected. Ask anything in an issue; answers that belonged in this README get written into it.

---

MIT · 한국어 문서: [README.ko.md](README.ko.md)
