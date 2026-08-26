import assert from "node:assert/strict";
import {
  MutationGateError,
  assertCartWriteAllowed,
  assertCheckoutAllowed,
  assertLogoutAllowed
} from "../dist/services/mutation-gate.js";

function throws(fn, re) {
  try {
    fn();
    assert.fail("expected MutationGateError");
  } catch (error) {
    assert.equal(error instanceof MutationGateError, true);
    assert.match(error.message, re);
  }
}

throws(() => assertCheckoutAllowed({ allowMutations: false, explicitUserIntent: true }), /IFOOD_ALLOW_MUTATIONS/);
throws(() => assertCheckoutAllowed({ allowMutations: true, explicitUserIntent: false }), /explicit_user_intent/);
assertCheckoutAllowed({ allowMutations: true, explicitUserIntent: true });
throws(() => assertCartWriteAllowed({ allowMutations: false, explicitUserIntent: true }), /IFOOD_ALLOW_MUTATIONS/);
throws(() => assertLogoutAllowed(false), /explicit_user_intent/);
assertLogoutAllowed(true);
console.log(JSON.stringify({ ok: true, suite: "mutation-gate" }, null, 2));
