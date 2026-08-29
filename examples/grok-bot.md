# Grok Bot / local agent stdio

Read-only. Do **not** set `IFOOD_ALLOW_MUTATIONS` in the Bot environment.

```json
{
  "mcpServers": {
    "ifood": {
      "command": "npx",
      "args": ["-y", "ifood-mcp-unofficial"]
    }
  }
}
```

Token: `ifood-mcp-unofficial auth start --email …` then `auth complete --code …`, or paste JWT via Runtime Secret `IFOOD_ACCESS_TOKEN`. Never in the prompt, Drive, or git.

Checkout remains listed but returns `USER_ACTION_REQUIRED` until both gates are on.

Skill path (no MCP client): copy `skill/SKILL.md` into the Bot skills dir and use `ifood-mcp-unofficial call …`. Same gates. Do not set mutation flags in the Bot environment.
