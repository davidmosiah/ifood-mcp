import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PATHS } from "../dist/constants.js";
import { peekConfig } from "../dist/services/config.js";
import { IfoodClient } from "../dist/services/ifood-client.js";
import { TokenStore } from "../dist/services/token-store.js";

const home = mkdtempSync(join(tmpdir(), "ifood-client-paths-"));
const tokenPath = join(home, ".ifood-mcp", "tokens.json");
mkdirSync(join(home, ".ifood-mcp"), { recursive: true, mode: 0o700 });
writeFileSync(tokenPath, JSON.stringify({ access_token: "fixture-token", source: "user" }), { mode: 0o600 });
process.env.HOME = home;
process.env.IFOOD_TOKEN_PATH = tokenPath;
process.env.IFOOD_DEVICE_ID = "11111111-1111-1111-1111-111111111111";
process.env.IFOOD_SESSION_ID = "22222222-2222-2222-2222-222222222222";
delete process.env.IFOOD_ACCESS_TOKEN;
delete process.env.IFOOD_ALLOW_MUTATIONS;

const captured = [];
const fetchImpl = async (url, init = {}) => {
  captured.push({ url: String(url), method: String(init.method || "GET").toUpperCase() });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
};

const config = peekConfig(process.env, home);
const client = new IfoodClient(config, new TokenStore(tokenPath), fetchImpl);
await client.me();
await client.listAddresses();
await client.listOrders();
await client.getOrder("order-1");
await client.listPaymentMethods();
await client.filterOptions();
await client.getCart("cart-1");
await client.createCart({ merchant: { id: "m1" }, items: [] });
await client.checkout("cart-1", { signature: "x" });

function hit(base, suffix, method) {
  return captured.find((row) => row.url.split("?")[0] === `${base}${suffix}` && row.method === method);
}

assert.ok(hit(config.apiBase, PATHS.me, "GET"), "me");
assert.ok(hit(config.apiBase, PATHS.addresses, "GET"), "addresses");
assert.ok(hit(config.apiBase, PATHS.orders, "GET"), "orders v4");
assert.ok(hit(config.apiBase, `${PATHS.order}/order-1`, "GET"), "order v3");
assert.ok(hit(config.apiBase, PATHS.paymentMethods, "GET"), "payments");
assert.ok(hit(config.apiBase, PATHS.filterOptions, "GET"), "filters");
assert.ok(hit(config.cartBase, `${PATHS.carts}/cart-1`, "GET"), "cart GET on cw-marketplace");
assert.ok(hit(config.cartBase, PATHS.carts, "POST"), "cart POST on cw-marketplace");
assert.ok(hit(config.checkoutBase, `${PATHS.carts}/cart-1/checkout`, "POST"), "checkout on wsloja");
assert.equal(Boolean(hit(config.apiBase, PATHS.carts, "POST")), false, "cart create must not hit marketplace host");

console.log(JSON.stringify({ ok: true, suite: "client-paths", captured: captured.map((r) => `${r.method} ${r.url}`) }, null, 2));
