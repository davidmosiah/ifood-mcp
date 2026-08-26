## 0.1.0 - 2026-08-26

### Added

- Unofficial local-first iFood MCP (stdio, optional loopback HTTP).
- OTP CLI: `auth start --email` then `auth complete --code` (marketplace identity-providers, live 400/401).
- Fallback `auth --token` / `auth --from-header` from DevTools.
- Read tools: profile, addresses, orders, payments, loyalty, benefits, filters, reviews, previous items, cart inspect.
- Browse tools: search, home, categories, merchant GraphQL (web routes; Akamai may WAF datacenter IPs).
- Cart writes on `cw-marketplace` (POST /v1/carts is 401 no-jwt). Checkout on `wsloja` fail-closed.
- Path + host allowlist; Origin check on optional HTTP.

### Probe notes

- `www.ifood.com.br/site-api` is Cloudflare-blocked from Node. Canonical host is `marketplace.ifood.com.br`.
- Marketplace `POST /v1/carts` is 404; cart lives on `cw-marketplace.ifood.com.br`.
