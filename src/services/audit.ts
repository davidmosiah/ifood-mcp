import { peekConfig } from "./config.js";

export function buildPrivacyAudit() {
  const config = peekConfig();
  return {
    unofficial: true,
    privacy_mode: config.privacyMode,
    redacts: ["street", "phone", "email", "last-four", "tokens"],
    token_path: config.tokenPath,
    mutations_enabled: config.allowMutations,
    never_pays_by_default: true,
    checkout_requires: ["IFOOD_ALLOW_MUTATIONS enabled", "explicit_user_intent true"]
  };
}
