import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeAccessToken } from "../dist/services/auth-token.js";

assert.equal(normalizeAccessToken("Bearer abc.def"), "abc.def");
assert.equal(normalizeAccessToken("  xyz  "), "xyz");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "dist/index.js");
const home = mkdtempSync(join(tmpdir(), "ifood-cli-"));

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, ...args], {
      env: { ...process.env, HOME: home, IFOOD_ACCESS_TOKEN: "", IFOOD_ALLOW_MUTATIONS: "" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => {
      stdout += c;
    });
    child.stderr.on("data", (c) => {
      stderr += c;
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

const missingOtp = await run(["auth", "complete", "--code", "123456", "--email", "a@b.c"]);
assert.equal(missingOtp.code, 1);
assert.match(missingOtp.stderr + missingOtp.stdout, /pending OTP|auth start/i);

const empty = await run(["auth", "--from-header", "Bearer   "]);
assert.equal(empty.code, 1);

const auth = await run(["auth", "--from-header", "Bearer ifood-fixture-jwt"]);
assert.equal(auth.code, 0, auth.stderr);
const tokenPath = join(home, ".ifood-mcp", "tokens.json");
const stored = JSON.parse(readFileSync(tokenPath, "utf8"));
assert.equal(stored.access_token, "ifood-fixture-jwt");
assert.equal(statSync(tokenPath).mode & 0o777, 0o600);

const doctor = await run(["doctor", "--json"]);
assert.equal(doctor.code, 0, doctor.stderr);
const status = JSON.parse(doctor.stdout);
assert.equal(status.unofficial, true);
assert.equal(status.never_pays_by_default, true);
assert.equal(status.mutations_enabled, false);
assert.deepEqual(status.auth_methods, ["otp", "token", "from-header"]);
assert.doesNotMatch(JSON.stringify(status), /IFOOD_ALLOW_MUTATIONS\s*=\s*true/);

const caps = await run(["call", "ifood_capabilities", "--json", "{}"]);
assert.equal(caps.code, 0, caps.stderr);
const cap = JSON.parse(caps.stdout);
assert.equal(cap.unofficial, true);
assert.equal(cap.never_pays_by_default, true);
assert.equal(cap.mutations_enabled, false);
assert.ok(Array.isArray(cap.read_tools) && cap.read_tools.includes("ifood_track_order"));
assert.ok(Array.isArray(cap.gated_cart_writes) && cap.gated_cart_writes.includes("ifood_add_to_cart"));
assert.ok(Array.isArray(cap.honest_gaps) && cap.honest_gaps.length >= 4);
assert.equal(cap.read_tools.includes("ifood_merchant_catalog"), false);
assert.ok(JSON.stringify(cap.honest_gaps).includes("ifood_merchant_catalog"));

const unknown = await run(["call", "ifood_not_a_tool"]);
assert.equal(unknown.code, 1);

console.log(
  JSON.stringify(
    {
      ok: true,
      suite: "cli",
      from_header: true,
      token_0600: true,
      doctor: true,
      otp_complete_without_start: true,
      call: true
    },
    null,
    2
  )
);
