# Using ballast with Codex

ballast ships as a native Codex plugin and a Claude Code plugin from the same repository. Both packages load the same twelve markdown skills and the same `UserPromptSubmit` rule hook; there is no separate Codex implementation to maintain.

## Install the Codex plugin

Prerequisites: a Codex release with plugin and hook support, plus `node` 18 or newer on `PATH`.

From GitHub:

```console
codex plugin marketplace add svy04/ballast
codex plugin add ballast@ballast
```

From a local clone while developing:

```console
codex plugin marketplace add /absolute/path/to/ballast
codex plugin add ballast@ballast
```

On Windows, the local path can be `C:\path\to\ballast`. Start a new Codex conversation after installation so the plugin skills and hook are loaded. Codex requires a separate trust review before running a new or changed command hook; approve the reviewed ballast hook if you want automatic rule delivery.

Confirm the installation:

```console
codex plugin list --json
```

The result should contain an installed, enabled `ballast@ballast` entry.

## What the plugin loads

- `.codex-plugin/plugin.json` exposes every folder under `skills/`. Codex presents them under the `ballast:` namespace; for example, ask for `$ballast:goal` when you want the full goal workflow.
- `hooks/hooks.json` is discovered automatically. It runs `hooks/scripts/ballast-rules.mjs` on every `UserPromptSubmit` event.
- The hook reads `.claude/ballast.rules.json` in the current project and `~/.claude/ballast.rules.json` in the user profile. Claude Code and Codex therefore share one rule catalog.
- Matching rules are injected as additional context. A matching `action: "block"` rule refuses the prompt and prints the rule body as the reason.

No `AGENTS.md` block or custom prompt wrapper is required when the plugin is active.

## Seed the rule catalog

Installation intentionally ships with no active rules. Copy `rules/ballast.rules.example.json` from the plugin to `<project>/.claude/ballast.rules.json`, then prune it to the rules you actually want. The catalog format is documented in the README under [Write the catalog by hand](../README.md#write-the-catalog-by-hand).

Optional verifier and researcher commands remain project configuration, not plugin installation state:

- `<project>/.claude/ballast.verifier.json`
- `<project>/.claude/ballast.researcher.json`

## Fallback when plugins or hooks are unavailable

Codex's IDE extension does not load plugins. Older Codex builds may also lack the plugin or hook feature. In those environments, append this block to the project's `AGENTS.md`, replacing `<BALLAST>` with the clone path:

```markdown
## ballast conventions

Skills live at <BALLAST>/skills/ — one folder per skill, SKILL.md inside.
Before matching work, read the relevant SKILL.md and follow it exactly:
goal (big or unfamiliar goals) · verify-gate (claims, labels) · knowledge-base
(research reuse) · decision-ledger (decisions) · proof-standard (external claims)
· rehearsal (before shipping a deliverable) · researcher (delegated collection)
· checkpoint (pause and return) · pin (corrections become rules) · recall
(read held knowledge before answering) · brain-init (memory setup) · skill-forge
(repeated procedures). Folder names match these skill names.

Standing rules: at the start of every task, read .claude/ballast.rules.json
(project) and ~/.claude/ballast.rules.json (user) if present. Honor every rule
whose keywords or patterns match the task. Treat action:"block" rules as a
refusal, quoting the rule as the reason. This delivery is a convention —
nothing enforces it here.
```

For non-interactive runs on a build without hooks, the bundled wrapper provides the same matching and block behavior before it starts `codex exec`:

```console
node <BALLAST>/hooks/scripts/ballast-codex.mjs "generate 40 images" -- -C /path/to/project
```

Everything after `--` is passed to `codex exec`. Set `CODEX_BIN` only when `codex` is not on `PATH`.

## Why the old guide used only AGENTS.md

The original Codex integration was written against CLI builds where ballast could not be installed as a native plugin and lifecycle hook loading was not available. `AGENTS.md` and the `codex exec` wrapper were the only portable paths then. Current Codex plugin and hook support removes that limitation, so they are now fallbacks rather than the primary installation.

## Verify from a clone

```console
node hooks/scripts/verify-hook.mjs
claude plugin validate .claude-plugin/plugin.json
```

The first command checks rule injection, silence, block behavior, legacy input, and broken-catalog handling. The second confirms that the shared hook declaration is also valid for Claude Code.

Official references: [Codex plugins](https://learn.chatgpt.com/docs/plugins), [plugin packaging](https://developers.openai.com/plugins/build/plugins), and [Codex hooks](https://learn.chatgpt.com/docs/hooks).
