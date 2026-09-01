import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TokenStore } from "../dist/services/token-store.js";
import { IfoodClient } from "../dist/services/ifood-client.js";
import { peekConfig } from "../dist/services/config.js";
import {
  handleAddToCart,
  handleCheckout,
  handleCreateAddress,
  handleCreateCart,
  handleLogout
} from "../dist/services/handlers.js";

let fetches = 0;
const fetchImpl = async () => {
  fetches += 1;
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
};

const home = mkdtempSync(join(tmpdir(), "ifood-handlers-"));
const tokenPath = join(home, ".ifood-mcp", "tokens.json");
mkdirSync(join(home, ".ifood-mcp"), { recursive: true, mode: 0o700 });
writeFileSync(tokenPath, JSON.stringify({ access_token: "fixture-token", source: "user" }), { mode: 0o600 });
process.env.HOME = home;
process.env.IFOOD_TOKEN_PATH = tokenPath;
delete process.env.IFOOD_ALLOW_MUTATIONS;
delete process.env.IFOOD_ACCESS_TOKEN;

const tokens = new TokenStore(tokenPath);
const config = peekConfig(process.env, home);
const client = new IfoodClient(config, tokens, fetchImpl);

fetches = 0;
const deniedCheckout = await handleCheckout(
  { cart_id: "c1", checkout_payload: { x: 1 }, explicit_user_intent: true, response_format: "json" },
  { client, tokens, allowMutations: false, fetchImpl }
);
assert.equal(deniedCheckout.isError, true);
assert.match(JSON.stringify(deniedCheckout.structuredContent), /USER_ACTION_REQUIRED|IFOOD_ALLOW_MUTATIONS/);
assert.equal(fetches, 0);

fetches = 0;
const deniedIntent = await handleCheckout(
  { cart_id: "c1", checkout_payload: { x: 1 }, explicit_user_intent: false, response_format: "json" },
  { client, tokens, allowMutations: true, fetchImpl }
);
assert.equal(deniedIntent.isError, true);
assert.equal(fetches, 0);

fetches = 0;
const deniedCart = await handleCreateCart(
  { merchant_id: "m1", items: [{ id: "i1" }], response_format: "json" },
  { client, tokens, allowMutations: false, fetchImpl }
);
assert.equal(deniedCart.isError, true);
assert.equal(fetches, 0);

fetches = 0;
const deniedAdd = await handleAddToCart(
  { merchant_id: "m1", items: [{ id: "i1" }], explicit_user_intent: true, response_format: "json" },
  { client, tokens, allowMutations: false, fetchImpl }
);
assert.equal(deniedAdd.isError, true);
assert.equal(fetches, 0);

fetches = 0;
const deniedAddIntent = await handleAddToCart(
  { merchant_id: "m1", items: [{ id: "i1" }], explicit_user_intent: false, response_format: "json" },
  { client, tokens, allowMutations: true, fetchImpl }
);
assert.equal(deniedAddIntent.isError, true);
assert.equal(fetches, 0);

fetches = 0;
const deniedAddress = await handleCreateAddress(
  { latitude: -3.73, longitude: -38.52, street: "Rua Teste", response_format: "json" },
  { client, tokens, fetchImpl }
);
assert.equal(deniedAddress.isError, true);
assert.equal(fetches, 0);

const deniedLogout = await handleLogout({ response_format: "json" }, { tokens });
assert.equal(deniedLogout.isError, true);
assert.equal(existsSync(tokenPath), true);

console.log(JSON.stringify({ ok: true, suite: "handlers", fetches }, null, 2));
