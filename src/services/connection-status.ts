import { existsSync } from "node:fs";
import { peekConfig } from "./config.js";
import { TokenStore } from "./token-store.js";
import { SERVER_VERSION } from "../constants.js";

export async function buildConnectionStatus() {
  const config = peekConfig();
  const tokens = new TokenStore(config.tokenPath);
  const token = await tokens.read();
  const envToken = Boolean(process.env.IFOOD_ACCESS_TOKEN?.trim());
  const ok = Boolean(token?.access_token || envToken);
  const next: string[] = [];
  if (!ok) {
    next.push("ifood-mcp-unofficial auth start --email you@email.com");
    next.push("ifood-mcp-unofficial auth complete --code <6-digit> --email you@email.com");
    next.push("Or paste a JWT: ifood-mcp-unofficial auth --from-header \"Bearer …\" / auth --token <jwt>");
  }
  if (!config.allowMutations) next.push("Reads only. Checkout stays blocked until IFOOD_ALLOW_MUTATIONS is enabled AND explicit_user_intent.");
  return {
    ok,
    unofficial: true as const,
    version: SERVER_VERSION,
    mutations_enabled: config.allowMutations,
    never_pays_by_default: true,
    auth_methods: ["otp", "token", "from-header"] as const,
    privacy_mode: config.privacyMode,
    api_base: config.apiBase,
    token: {
      path: config.tokenPath,
      exists: existsSync(config.tokenPath),
      source: token?.source ?? (envToken ? "env" : null)
    },
    missing_env: ok ? [] : ["IFOOD_ACCESS_TOKEN or ~/.ifood-mcp/tokens.json"],
    next_steps: next
  };
}
