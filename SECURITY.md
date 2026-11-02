# Security Policy

## Reporting

Report vulnerabilities privately. Never paste iFood JWTs, OTP codes, addresses, phones, or card last-four in public issues.

## Fail-closed money rules

- Default is read-only. Checkout does **not** run.
- `ifood_checkout` requires both `IFOOD_ALLOW_MUTATIONS` enabled and `explicit_user_intent`.
- Cart writes require the same two gates.
- Logout requires `explicit_user_intent` only.
- Default privacy mode redacts street, phone, email, and last-four.

## Local hardening

- Tokens live in `~/.ifood-mcp/tokens.json` (0600).
- Prefer `auth start --email` / `auth complete --code` over pasting JWTs into shell history.
- Do not put `IFOOD_ACCESS_TOKEN` in a committed MCP config.
- Keep `IFOOD_ALLOW_MUTATIONS` unset unless you intentionally want an agent to charge you.

## Optional HTTP

`--http` listens on `127.0.0.1` by default. Requests with an `Origin` header must match `IFOOD_MCP_ALLOWED_ORIGIN` or `http://127.0.0.1:<port>`.

The HTTP client only calls allowlisted unofficial consumer paths on `marketplace.ifood.com.br`, `cw-marketplace.ifood.com.br`, and `wsloja.ifood.com.br`. Arbitrary URLs are rejected in-process.

## Unofficial surface

iFood does not publish a consumer cart API. This package talks to the same undocumented web endpoints. They can change without notice. This is **not** `merchant-api.ifood.com.br` (Partners).

## Consumer transport restrictions

API-base overrides must be bare HTTPS origins (except the shipped `https://wsloja.ifood.com.br/ifood-ws-v3` checkout prefix) on the provider allowlist and default port 443, without URL credentials, query, or fragment. Redirects fail closed rather than forwarding requests outside the reviewed origin/path. For the 99 passenger connector specifically, this also protects ticket/token body credentials on 307/308 redirects. Overrides are local configuration, not agent input.

CLI tool calls validate the shared field/type/default schemas before handlers. CLI unknown fields are now rejected (the MCP SDK may strip them), so error behavior is intentionally stricter, with a 10,000-element argument budget and 1 MiB JSON text cap. Provider responses are limited to 4 MiB of decoded bytes, including streams without trustworthy Content-Length; over-limit or aborted readers are cancelled.
