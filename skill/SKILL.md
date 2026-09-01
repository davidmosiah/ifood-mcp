---
name: ifood
description: >
  Unofficial iFood (Brazil) for personal restaurants, cart, addresses and
  orders. Use when the user wants iFood without opening the app. Prefer MCP
  tools if connected; otherwise the package CLI. Never pays unless both gates
  are already on and the user said to checkout.
---

# iFood — skill or MCP

Unofficial. Not the Partners merchant-api portal.

Same binary either way. Mutation gates live in the server, not in this file.

Search/home may WAF from datacenter IPs even with a home-browser JWT. That is not a 401 on a missing route.

## Choose a surface

**MCP** — tools appear natively:

```json
{ "mcpServers": { "ifood": { "command": "npx", "args": ["-y", "ifood-mcp-unofficial"] } } }
```

Do not put mutation flags in that snippet.

**Skill / CLI** — no MCP client required:

```bash
npx -y ifood-mcp-unofficial doctor --json
npx -y ifood-mcp-unofficial call ifood_capabilities --json '{}'
npx -y ifood-mcp-unofficial call ifood_list_orders --json '{}'
```

If MCP tools named `ifood_*` are already available, use them. Do not also shell out.

## Setup (once)

```bash
npx -y ifood-mcp-unofficial setup
npx -y ifood-mcp-unofficial auth start --email you@email.com
npx -y ifood-mcp-unofficial auth complete --code 123456 --email you@email.com
```

Fallback: DevTools `Authorization` from `marketplace.ifood.com.br`, then `auth --from-header`. Token at `~/.ifood-mcp/tokens.json` (0600).

## Loop

1. `ifood_connection_status` (or `doctor --json`). Expect `unofficial` and `never_pays_by_default`.
2. Profile / orders / search as asked. Street, phone, GPS stay redacted.
3. “O pedido saiu?” → `ifood_list_active_orders` then `ifood_track_order` / `ifood_get_order_eta`. Dedicated tracking URLs 404; these read the live order.
4. **Stop before checkout.** Do not call `ifood_checkout` unless the user clearly asked to place **this** order. If the tool returns `USER_ACTION_REQUIRED`, report that and stop. Do not invent env flags.

## Never

- Enable mutations from this skill
- Paste tokens into git, chat logs, or the prompt
- Treat WAF HTML as a missing tool
