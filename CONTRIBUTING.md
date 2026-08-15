# Contributing

Issues and pull requests are welcome.

## Issues

- Bug reports: include your Claude Code version, OS, and the smallest reproduction you can — for hook bugs, the catalog entry plus the prompt that misbehaved is ideal.
- Prior art for the README's honesty note is especially welcome: open an issue and we'll link it.

## Pull requests

- The rules hook stays zero-dependency and fail-silent: any internal error must exit 0 and never break a session.
- Docs must match behavior. If you change what the engine reads (`hooks/scripts/ballast-rules.mjs`), update the skills and README that describe it — and vice versa.
- Skills are plain markdown (`SKILL.md` with `name`/`description` frontmatter); no build step.
- Add your change to `CHANGELOG.md`.
- English docs are the source of truth; mirror user-facing changes in `README.ko.md`.
