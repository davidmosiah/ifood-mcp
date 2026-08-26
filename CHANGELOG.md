## 0.1.1 - 2026-08-26

Ten named OSS improvement rounds (Rappi + iFood):

1. **Rappi** — `auth --from-header` strips DevTools `Authorization: Bearer`.
2. **iFood** — `doctor --json` reports `unofficial`, `never_pays_by_default`, `auth_methods`.
3. **Rappi** — host allowlist on `consumerRequestUrl` (country Rappi hosts only).
4. **iFood** — empty/Bearer-only paste is rejected; token file stays 0600.
5. **Rappi** — token file mode 0600 asserted after shipped `auth`.
6. **iFood** — shipped CLI `auth --from-header` stores the raw JWT (no Bearer prefix).
7. **Rappi** — doctor next steps document DevTools capture; no copyable `RAPPI_ALLOW_MUTATIONS=true`.
8. **iFood** — `auth complete` without `auth start` fails closed (no pending OTP).
9. **Rappi** — `doctor --json` via `dist/index.js` asserts unofficial + never-pays.
10. **iFood** — README first screen: OTP 60s setup + WAF honesty (site-api Cloudflare / search Akamai).

### Added

- `normalizeAccessToken`; doctor `auth_methods`; CLI tests on `dist/index.js`.

### Changed

- Empty Bearer paste rejected. README states Cloudflare/Akamai WAF limits.

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
