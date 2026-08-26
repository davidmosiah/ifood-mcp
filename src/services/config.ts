import { homedir } from "node:os";
import { join } from "node:path";
import {
  DEFAULT_API_BASE,
  DEFAULT_CART_BASE,
  DEFAULT_CHECKOUT_BASE,
  TOKEN_DIR_NAME
} from "../constants.js";
import type { IfoodConfig, PrivacyMode } from "../types.js";

type Env = Record<string, string | undefined>;

function env(name: string, source: Env = process.env): string | undefined {
  const value = source[name];
  return value && value.trim() ? value.trim() : undefined;
}

function parseBool(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parsePrivacyMode(value: string | undefined): PrivacyMode {
  if (value === "summary" || value === "structured" || value === "raw") return value;
  return "structured";
}

function parseCoord(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function tokenDir(homeDir = homedir()): string {
  return join(homeDir, TOKEN_DIR_NAME);
}

export function peekConfig(source: Env = process.env, homeDir = homedir()): IfoodConfig {
  const dir = tokenDir(homeDir);
  return {
    apiBase: (env("IFOOD_API_BASE", source) ?? DEFAULT_API_BASE).replace(/\/$/, ""),
    cartBase: (env("IFOOD_CART_BASE", source) ?? DEFAULT_CART_BASE).replace(/\/$/, ""),
    checkoutBase: (env("IFOOD_CHECKOUT_BASE", source) ?? DEFAULT_CHECKOUT_BASE).replace(/\/$/, ""),
    tokenPath: env("IFOOD_TOKEN_PATH", source) ?? join(dir, "tokens.json"),
    configPath: env("IFOOD_CONFIG_PATH", source) ?? join(dir, "config.json"),
    deviceIdPath: env("IFOOD_DEVICE_ID_PATH", source) ?? join(dir, "device-id"),
    privacyMode: parsePrivacyMode(env("IFOOD_PRIVACY_MODE", source)),
    allowMutations: parseBool(env("IFOOD_ALLOW_MUTATIONS", source), false),
    latitude: parseCoord(env("IFOOD_LAT", source)),
    longitude: parseCoord(env("IFOOD_LNG", source))
  };
}
