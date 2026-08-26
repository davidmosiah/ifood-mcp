import assert from "node:assert/strict";
import { PATHS } from "../dist/constants.js";
import { isAllowedConsumerPath, isAllowedIfoodHost } from "../dist/services/path-allowlist.js";
import { consumerRequestUrl, IfoodClientError } from "../dist/services/ifood-client.js";

assert.equal(isAllowedConsumerPath(PATHS.me), true);
assert.equal(isAllowedConsumerPath(`${PATHS.carts}/abc/checkout`), true);
assert.equal(isAllowedConsumerPath("/v1/evil"), false);
assert.equal(isAllowedConsumerPath("https://evil.example/x"), false);
assert.equal(isAllowedIfoodHost("https://marketplace.ifood.com.br/v1/customers/me"), true);
assert.equal(isAllowedIfoodHost("https://evil.example/v1/customers/me"), false);

const base = "https://marketplace.ifood.com.br";
assert.equal(consumerRequestUrl(base, PATHS.me), `${base}${PATHS.me}`);
assert.throws(
  () => consumerRequestUrl(base, "https://evil.example/steal"),
  (err) => err instanceof IfoodClientError && err.code === "PATH_NOT_ALLOWED"
);
assert.throws(
  () => consumerRequestUrl("https://evil.example", PATHS.me),
  (err) => err instanceof IfoodClientError && err.code === "PATH_NOT_ALLOWED"
);

console.log(JSON.stringify({ ok: true, suite: "path-allowlist" }, null, 2));
