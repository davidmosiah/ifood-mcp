import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { SERVER_VERSION } from "../constants.js";
import { peekConfig } from "../services/config.js";
import { buildConnectionStatus } from "../services/connection-status.js";
import { TokenStore } from "../services/token-store.js";
import { IfoodClient } from "../services/ifood-client.js";
import { normalizeAccessToken } from "../services/auth-token.js";

export async function runCliCommand(args: string[]): Promise<number | undefined> {
  const [command, ...rest] = args;
  if (!command || command === "--http") return undefined;
  if (command === "setup") return runSetup(rest);
  if (command === "auth" || command === "login") return runAuth(rest);
  if (command === "doctor" || command === "status") return runDoctor(rest);
  if (command === "version" || command === "--version" || command === "-v") {
    console.log(SERVER_VERSION);
    return 0;
  }
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return 0;
  }
  if (!command.startsWith("--")) {
    console.error(`Unknown command: ${command}`);
    printHelp();
    return 1;
  }
  return undefined;
}

function runSetup(args: string[]): number {
  const allow = args.includes("--allow-mutations");
  const config = peekConfig();
  mkdirSync(dirname(config.configPath), { recursive: true, mode: 0o700 });
  writeFileSync(
    config.configPath,
    JSON.stringify(
      {
        unofficial: true,
        allow_mutations: allow,
        never_pays_by_default: !allow
      },
      null,
      2
    ),
    { mode: 0o600 }
  );
  console.log(`Wrote ${config.configPath} (0600). Mutations ${allow ? "ENABLED — you can be charged" : "disabled (default)"}.`);
  console.log("Next: ifood-mcp-unofficial auth start --email you@email.com");
  return 0;
}

async function runAuth(args: string[]): Promise<number> {
  if (args[0] === "start") return runAuthStart(args.slice(1));
  if (args[0] === "complete") return runAuthComplete(args.slice(1));
  const headerIdx = args.indexOf("--from-header");
  if (headerIdx >= 0) {
    const raw = args[headerIdx + 1] ?? "";
    return await storeToken(raw);
  }
  const idx = args.indexOf("--token");
  const token = idx >= 0 ? args[idx + 1] : process.env.IFOOD_ACCESS_TOKEN;
  if (!token || token.startsWith("--")) {
    console.error(`How to get a token (easiest first):
  1. OTP:  ifood-mcp-unofficial auth start --email you@email.com
           ifood-mcp-unofficial auth complete --code 123456 --email you@email.com
  2. DevTools: open https://www.ifood.com.br logged in → Network → any marketplace request
           copy Authorization (Bearer …) then:
           ifood-mcp-unofficial auth --from-header "Bearer eyJ…"
           or ifood-mcp-unofficial auth --token eyJ…`);
    return 1;
  }
  return await storeToken(token);
}

async function runAuthStart(args: string[]): Promise<number> {
  const email = flag(args, "--email") ?? process.env.IFOOD_EMAIL;
  if (!email) {
    console.error("auth start requires --email <you@email.com>");
    return 1;
  }
  const config = peekConfig();
  const client = new IfoodClient(config, new TokenStore(config.tokenPath));
  const pending = await client.requestOtp(email);
  const pendingPath = join(dirname(config.tokenPath), "otp-pending.json");
  mkdirSync(dirname(pendingPath), { recursive: true, mode: 0o700 });
  writeFileSync(pendingPath, JSON.stringify({ ...pending, email }, null, 2), { mode: 0o600 });
  console.log(`OTP requested for ${email}. Check SMS/WhatsApp/email.`);
  console.log(`Then: ifood-mcp-unofficial auth complete --code <6-digit> --email ${email}`);
  return 0;
}

async function runAuthComplete(args: string[]): Promise<number> {
  const email = flag(args, "--email") ?? process.env.IFOOD_EMAIL;
  const code = flag(args, "--code");
  if (!email || !code) {
    console.error("auth complete requires --email and --code <6-digit>");
    return 1;
  }
  const config = peekConfig();
  const pendingPath = join(dirname(config.tokenPath), "otp-pending.json");
  if (!existsSync(pendingPath)) {
    console.error("No pending OTP. Run auth start --email first.");
    return 1;
  }
  const pending = JSON.parse(readFileSync(pendingPath, "utf8")) as {
    key: string;
    deviceId: string;
    sessionId: string;
    email: string;
  };
  const client = new IfoodClient(config, new TokenStore(config.tokenPath));
  await client.completeOtp({
    key: pending.key,
    code,
    email,
    deviceId: pending.deviceId,
    sessionId: pending.sessionId
  });
  console.log(`Stored personal OTP token at ${config.tokenPath} (0600).`);
  return 0;
}

async function storeToken(token: string): Promise<number> {
  const access = normalizeAccessToken(token);
  if (!access || access.startsWith("--")) {
    console.error("Empty token after stripping Bearer. Paste the Authorization header or JWT.");
    return 1;
  }
  const config = peekConfig();
  const store = new TokenStore(config.tokenPath);
  await store.write({
    access_token: access,
    source: "user",
    token_type: "Bearer",
    account_id: process.env.IFOOD_ACCOUNT_ID
  });
  console.log(`Stored personal token at ${config.tokenPath} (0600).`);
  return 0;
}

async function runDoctor(args: string[]): Promise<number> {
  const status = await buildConnectionStatus();
  if (args.includes("--json")) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    console.log(`iFood MCP · Doctor  ${status.ok ? "READY" : "NEEDS AUTH"}`);
    console.log(`Unofficial: yes   Mutations: ${status.mutations_enabled}   Privacy: ${status.privacy_mode}`);
    console.log(`Token file: ${status.token.path} exists=${status.token.exists}`);
    if (status.missing_env.length) console.log(`Missing: ${status.missing_env.join(", ")}`);
    for (const step of status.next_steps) console.log(`- ${step}`);
  }
  return args.includes("--strict") && !status.ok ? 1 : 0;
}

function flag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx < 0) return undefined;
  const value = args[idx + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

function printHelp(): void {
  console.log(`ifood-mcp-unofficial ${SERVER_VERSION}
Unofficial local-first iFood MCP. Never pays unless IFOOD_ALLOW_MUTATIONS and explicit_user_intent.

Commands:
  setup [--allow-mutations]
  auth start --email <email>          request OTP (easiest token)
  auth complete --code <otp> --email <email>
  auth --token <jwt>                  paste DevTools Bearer
  auth --from-header "Bearer eyJ…"
  doctor [--json] [--strict]
  version

Token from browser (fallback):
  1. Open https://www.ifood.com.br and sign in
  2. DevTools → Network → any marketplace.ifood.com.br request
  3. Copy Authorization header

Default transport: stdio. Optional: --http (loopback only).`);
}
