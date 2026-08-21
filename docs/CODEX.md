# Using ballast with Codex

ballast takes a goal in a field you have no expertise in and builds up to it: it splits the goal into the foundations it actually needs, mobilizes the ones you already hold, learns the ones you are missing, and leaves every path it solves behind — as a rule, a verified note, or a skill the next goal starts from. Nothing is called done until a check passes.

It is packaged as a Claude Code plugin, and since 0.9.0 it installs on Codex CLI too: the same twelve markdown skills, and the same rules hook. Codex runs `UserPromptSubmit` hooks in the JSON shape ballast already speaks, so the engine did not change — only the wiring. This guide covers the ways to wire it in, what is enforced on each, and what was actually observed.

| Path | What you get | Enforced? |
|---|---|---|
| **Plugin** — `codex plugin …` | the twelve skills + the rules hook | hook: yes, after a one-time trust review in `/hooks` |
| **Project hook** — `<project>/.codex/hooks.json` | the rules hook (skills via the AGENTS.md block) | yes, after project trust + `/hooks` review |
| **User hook** — `~/.codex/hooks.json` | the rules hook in every project | yes, after `/hooks` review |
| **AGENTS.md block** | skills + catalog as instructions | no — convention |
| **`codex exec` wrapper** | matching rules prepended to one prompt | yes, for that call |

One rule catalog serves both tools: the hook reads `<project>/.claude/ballast.rules.json` and `~/.claude/ballast.rules.json` on Codex exactly as on Claude Code. Rule format: README, [Write the catalog by hand](../README.md#write-the-catalog-by-hand).

## Install as a plugin

```
codex plugin marketplace add svy04/ballast
codex plugin add ballast@ballast
```

Codex reads the repository's marketplace file and `.codex-plugin/plugin.json`, copies the plugin into its cache, and loads `skills/` and `hooks/hooks.json`. Then, in a Codex session, run `/hooks` and trust the ballast hooks: Codex records trust against each hook's hash and skips untrusted hooks without a word, so until that step the skills are loaded and the hooks are not. Edit a hook command later and the review comes back — that is the hash doing its job.

Once trusted, every session opens with one line — `[ballast] hook live — N rules loaded (…)` — so a hook that is not running is visible as the absence of that line.

Observed 2026-08-21, codex-cli 0.147.0, Windows — twice: from a local clone path before publishing, and from GitHub after it (`codex plugin marketplace add svy04/ballast`, then `codex plugin add ballast@ballast`). Both times `codex plugin list` read `installed, enabled` (0.9.0 the second time); on the first prompt both hooks ran (`hook: SessionStart`, `hook: UserPromptSubmit` in the exec log) and a probe rule from the project catalog arrived as developer context.

Seed the catalog the same way as on Claude Code: copy `rules/ballast.rules.example.json` to `<project>/.claude/ballast.rules.json` and prune it. The optional second-model configs (`.claude/ballast.verifier.json`, `.claude/ballast.researcher.json`) are read by the verify-gate and researcher skills, not by any hook — format in the README's [Know the limits](../README.md#know-the-limits). `memory/` appears once brain-init runs (on Codex, its session-start block goes to `AGENTS.md`).

## Or a project hook, no plugin

Copy [`rules/ballast.codex-hooks.example.json`](../rules/ballast.codex-hooks.example.json) to `<project>/.codex/hooks.json` and replace `<BALLAST>` with your clone path:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"<BALLAST>/hooks/scripts/ballast-rules.mjs\" --status",
            "timeout": 10,
            "statusMessage": "ballast status"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"<BALLAST>/hooks/scripts/ballast-rules.mjs\"",
            "timeout": 10,
            "statusMessage": "ballast rules"
          }
        ]
      }
    ]
  }
}
```

Two trust steps, both one-time: project-local hooks load only when Codex trusts the project's `.codex` layer (it asks when you open the folder), and the hook itself waits for review in `/hooks`. The same file at `~/.codex/hooks.json` runs in every project. `commandWindows` is an optional Windows-only override.

Observed 2026-08-21, codex-cli 0.147.0, Windows: a project hook in a trusted folder delivered a probe rule on the first prompt (`hook: UserPromptSubmit … Completed` in the exec log). The engine behind it is the one the 10-case harness covers.

## Automation: `codex exec`

Hooks run under `codex exec` too. A non-interactive run cannot answer the trust prompt, so Codex offers `codex exec --dangerously-bypass-hook-trust …`: enabled hooks run without persisted trust for that one invocation. Codex's own wording for the flag — automation that already vets its hook sources — is the right bar.

For builds without hooks, the bundled wrapper from 0.8.0 still works: `hooks/scripts/ballast-codex.mjs` runs the same engine, prepends every matching rule to the prompt, honors `block` (refuses with the rule as the reason, exit 2), then hands off to `codex exec`:

```
node <BALLAST>/hooks/scripts/ballast-codex.mjs "generate 40 images" -- -C /path/to/project
```

Everything after `--` goes to `codex exec` unchanged; set `CODEX_BIN` if `codex` is not on your PATH.

## Skills without the plugin: the AGENTS.md block

Clone the repo somewhere stable, then append this to your project's `AGENTS.md`, replacing `<BALLAST>` with the clone path. (AGENTS.md gets committed — if your clone path is personal, put the block in `~/.codex/AGENTS.md` instead; Codex reads both.)

```markdown
## ballast conventions

Skills live at <BALLAST>/skills/ — one folder per skill, SKILL.md inside.
Before matching work, read the relevant SKILL.md and follow it exactly:
recall (sweep what is held before answering) · goal (big or unfamiliar goals)
· verify-gate (claims, labels) · knowledge-base (research reuse)
· decision-ledger (decisions) · proof-standard (external claims) · rehearsal
(before shipping a deliverable) · researcher (delegated collection)
· checkpoint (pause and return) · pin (corrections become rules) · brain-init
(memory setup) · skill-forge (repeated procedures). Folder names match these
skill names.

Standing rules: at the start of every task, read .claude/ballast.rules.json
(project) and ~/.claude/ballast.rules.json (user) if present. Honor every rule
whose keywords or patterns match the task. Treat action:"block" rules as a
refusal, quoting the rule as the reason. Without the hook, this delivery is a
convention — nothing enforces it here.
```

With the plugin or a hook in place, the second paragraph is belt and braces: the hook delivers matching rules per prompt whether or not Codex re-reads the catalog.

Codex custom prompts give slash-style invocation of a skill without the plugin — `~/.codex/prompts/ballast-goal.md` containing `Read <BALLAST>/skills/goal/SKILL.md and follow it exactly. Task: $ARGUMENTS` — one wrapper file per skill you call often.

## Know the limits

- **Trust is a manual step, and untrusted is silent.** Until the `/hooks` review, the hooks do not run and say nothing — not even the session-start line. If `[ballast] hook live` never appears on Codex, check `/hooks` before anything else.
- **ballast does not touch providers or routing.** The hook reads two JSON files and prints. Tools that switch model vendors or route requests (CC Switch, claude-code-router and the like) sit beside it, not under it — use both.
- **The evidence is `observed`, not a harness.** One machine (Windows, codex-cli 0.147.0, 2026-08-21), one probe per path — plugin hook and project hook. The 10-case harness exercises the engine, which is shared; there is no Codex-side harness. Whether the Codex IDE extension runs hooks: `unknown` — the hooks reference does not say.
- **Hooks can be turned off.** `[features] hooks = false` in `config.toml` (or a managed policy) disables them; Codex is then back to the conventions above.
- **Correction, kept on purpose.** Editions 0.5.1–0.8.0 of this guide said released Codex CLIs did not load user hook configs. That was our test's error, not Codex's gap: on 2026-08-17 we had written `~/.codex/hooks.toml`, a file Codex never reads — the real files are `hooks.json`, or a `[hooks]` table inside `config.toml`. Recorded here so nobody repeats it.
