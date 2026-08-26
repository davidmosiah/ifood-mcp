<h1 align="center">iFood MCP</h1>

<h3 align="center">
  Give your AI agent your iFood orders, addresses, restaurants and cart.<br>
  Local-first MCP &mdash; <strong>credentials never leave your machine</strong>.<br>
  Checkout is <strong>fail-closed</strong> unless you opt in twice.
</h3>

> **Unofficial.** Not affiliated with, endorsed by, or supported by iFood. Not the merchant-api Partners portal. The consumer web surface can change without notice.

> **Never pays by default.** `ifood_checkout` does nothing unless `IFOOD_ALLOW_MUTATIONS` is enabled **and** `explicit_user_intent` is true.

## Setup in 60 seconds

```bash
npx -y ifood-mcp-unofficial setup
npx -y ifood-mcp-unofficial auth start --email you@email.com
npx -y ifood-mcp-unofficial auth complete --code 123456 --email you@email.com
npx -y ifood-mcp-unofficial doctor
```

Fallback (no OTP): open [ifood.com.br](https://www.ifood.com.br) logged in → DevTools → Network → any `marketplace.ifood.com.br` request → copy `Authorization`, then:

```bash
npx -y ifood-mcp-unofficial auth --from-header "Bearer eyJ…"
```

Stdio snippet. Do **not** set `IFOOD_ALLOW_MUTATIONS` here:

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

## Tools

| Kind | Tools |
| --- | --- |
| Read · me | `ifood_customer_me`, `ifood_list_addresses`, `ifood_contact_methods`, `ifood_list_payment_methods`, `ifood_loyalty_cards`, `ifood_benefits` |
| Read · orders | `ifood_list_orders`, `ifood_get_order`, `ifood_previous_items`, `ifood_get_cart` |
| Read · browse | `ifood_search`, `ifood_home`, `ifood_categories`, `ifood_merchant_info`, `ifood_filter_options`, `ifood_reviews`, `ifood_merchant_payment_methods` |
| Meta | `ifood_connection_status`, `ifood_capabilities`, `ifood_privacy_audit` |
| Gated cart | `ifood_create_cart`, `ifood_set_delivery_method`, `ifood_set_payment_method` |
| Gated pay | `ifood_checkout` |
| Intent only | `ifood_logout` |

## HTTP (optional, loopback)

```bash
npx -y ifood-mcp-unofficial --http
```

Binds `127.0.0.1` and checks `Origin`. DNS-rebinding mitigation, not a public server.

## Tests

```bash
npm test
```

No live iFood login required.
