import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(new URL(".", import.meta.url)));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
for (const banned of ["fixtures", ".ifood-mcp", ".env", "tokens.json", "src"]) {
  assert.equal(pkg.files.includes(banned), false, `package files must not include ${banned}`);
}
assert.ok(pkg.files.includes("dist"));
assert.ok(pkg.files.includes("skill"), "package files must include skill/");
assert.equal(existsSync(join(root, "src/services/handlers.ts")), true);
const handlers = readFileSync(join(root, "src/services/handlers.ts"), "utf8");
assert.match(handlers, /assertCheckoutAllowed/);

for (const rel of [
  "examples/claude-desktop.json",
  "examples/grok-bot.md",
  "README.md",
  "llms.txt",
  "SECURITY.md",
  "skill/SKILL.md"
]) {
  const text = readFileSync(join(root, rel), "utf8");
  assert.doesNotMatch(text, /IFOOD_ALLOW_MUTATIONS\s*=\s*true/);
}
assert.match(readFileSync(join(root, "skill/SKILL.md"), "utf8"), /call ifood_/);

console.log(JSON.stringify({ ok: true, suite: "secret-scan", files: pkg.files }, null, 2));
