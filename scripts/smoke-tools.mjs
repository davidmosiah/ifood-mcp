import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const expected = [
  "ifood_add_to_cart",
  "ifood_benefits",
  "ifood_capabilities",
  "ifood_categories",
  "ifood_checkout",
  "ifood_connection_status",
  "ifood_contact_methods",
  "ifood_create_address",
  "ifood_create_cart",
  "ifood_customer_me",
  "ifood_filter_options",
  "ifood_get_cart",
  "ifood_get_order",
  "ifood_get_order_eta",
  "ifood_get_order_invoice",
  "ifood_get_order_receipt",
  "ifood_home",
  "ifood_identities",
  "ifood_list_active_orders",
  "ifood_list_addresses",
  "ifood_list_orders",
  "ifood_list_payment_methods",
  "ifood_logout",
  "ifood_loyalty_cards",
  "ifood_merchant_catalog",
  "ifood_merchant_info",
  "ifood_merchant_payment_methods",
  "ifood_previous_items",
  "ifood_privacy_audit",
  "ifood_reviews",
  "ifood_search",
  "ifood_set_delivery_method",
  "ifood_set_payment_method",
  "ifood_track_order"
];

const homeDir = mkdtempSync(join(tmpdir(), "ifood-mcp-smoke-"));
const env = { ...process.env, HOME: homeDir };
delete env.IFOOD_ACCESS_TOKEN;
delete env.IFOOD_ALLOW_MUTATIONS;
delete env.IFOOD_TOKEN_PATH;

const client = new Client({ name: "ifood-mcp-smoke", version: "0.0.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env
});
await client.connect(transport);
try {
  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name).sort();
  assert.deepEqual(names, expected.sort());
  const checkout = await client.callTool({
    name: "ifood_checkout",
    arguments: { cart_id: "c1", checkout_payload: { x: 1 }, response_format: "json" }
  });
  const text = JSON.stringify(checkout.structuredContent ?? {}) + (checkout.content?.map((c) => c.text || "").join("") || "");
  assert.match(text, /USER_ACTION_REQUIRED|IFOOD_ALLOW_MUTATIONS|explicit_user_intent/i);
  assert.equal(checkout.isError, true);
  const status = await client.callTool({ name: "ifood_connection_status", arguments: { response_format: "json" } });
  assert.equal(status.structuredContent?.unofficial, true);
  assert.equal(status.structuredContent?.mutations_enabled, false);
  assert.equal(status.structuredContent?.never_pays_by_default, true);
  console.log(JSON.stringify({ ok: true, tools: names.length, gated_checkout: true }, null, 2));
} finally {
  await client.close();
}
