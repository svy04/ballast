---
name: researcher
description: Delegate research collection to a configured second model — never the judgment. Use when .claude/ballast.researcher.json exists and facts must be gathered from outside the session, when a terrain scan is large, or before building something a standard method may already solve.
---

# Researcher — collection delegated, judgment kept

Two different jobs hide inside "research": going out to gather, and deciding what to believe. This skill delegates the first and forbids delegating the second. The failure mode this prevents: a second model's fluent summary walking straight into your files as fact.

## Setup (optional, sibling of the verifier)

If the project has `.claude/ballast.researcher.json` (this skill reads it — the rules hook does not; a copy-ready example ships in the ballast repo at `rules/ballast.researcher.example.json`):

```json
{ "command": "your-researcher-cli --search" }
```

run that command with the research question as its final argument. Any CLI that takes a question and returns findings works — a different vendor's model is fine here too.

The config is a bare object — no `version`/`rules` wrapper (that wrapper belongs to rule catalogs). A file that is missing, unreadable, or empty behaves the same way: you collect directly, as always. A file that parses but has no usable `command` (wrapped, wrong shape) gets the same fallback — plus one sentence telling the user their config isn't the expected shape. The user can also invoke this skill directly as `/ballast:researcher`.

## Health check — once per session, out loud

Before the first delegation of a session, run the command once on a throwaway question (or `--version` if the CLI has one) — don't spend a real query to discover the tool is dead. If it fails or hangs, **say so once** — "researcher CLI isn't responding; collecting directly" — then proceed yourself.

A configured researcher that silently never ran is worse than none, and retrying a dead tool burns the session. One check, one sentence, move on.

## Everything returned is hearsay

- The researcher's output arrives as `hearsay`, with the researcher named as the source — never as fact, however fluent it reads.
- Promotion to `confirmed` goes through the verify gate like any claim: refute first, primary sources you actually opened, sample, limits, date.
- `hearsay` lives in working notes and session logs — `memory/knowledge/` stays gate-passed only (the knowledge-base skill owns that door).
- Delegation splits the work, not the responsibility. The collecting was outsourced; the believing was not.

## Write the brief like an order

The brief *is* the question: everything below travels inside that final argument, as one string — there is no side channel.

- **Name the search language.** Ask where the answer lives: facts about a market in that market's language, platform and research originals usually in English. Don't leave the language to the tool.
- **Before building anything standard-shaped**, ask for the established methods *and their known failure axes*. Your approach working on your sample proves little — the literature usually already knows where it breaks.
- **Set the verification budget up front**: rank sources (your own measurements > observed behavior > primary documents > practitioner accounts > public advice) and verify only the claims that steer decisions or spending — the rest stay labeled instead.
- **Rules don't travel.** The rules hook fires on your prompts only; an external CLI — or a subagent — never sees your catalog. Whatever constraint matters, write it into the brief itself.

## One warning about synthesis

When several collected sources start merging into one clean conclusion, that forming headline is the signal to stop: are these even the same kind of evidence? Different layers — experiments, market observation, one project's logs — sit side by side; they don't fuse into one claim.
