# Contributing

1. Keep the default read-only. Money tools stay behind `IFOOD_ALLOW_MUTATIONS` **and** `explicit_user_intent`.
2. Probe live hosts before adding a path. Cloudflare HTML 403 on `www.ifood.com.br/site-api` is not a route map — use `marketplace.ifood.com.br`.
3. `npm test` is the canonical gate. No GitHub Actions-only checks.
