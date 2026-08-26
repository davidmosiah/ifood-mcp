# Agent notes

Unofficial local-first iFood MCP. Personal food cart for David / Life / Grok Bot.

## Commands

- `npm ci`
- `npm test`
- `npx ifood-mcp-unofficial doctor`

## Rules

- Never commit tokens or `~/.ifood-mcp/`.
- Never enable `IFOOD_ALLOW_MUTATIONS` in default examples.
- `ifood_checkout` must stay fail-closed in tests without both gates.
- Do not add this connector to the Delx Wellness registry.
- Live iFood login is not required for CI.
- Do not invent consumer paths: probe marketplace / cw-marketplace / wsloja for 200/400/401 JSON.
