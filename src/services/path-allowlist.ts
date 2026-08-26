import { PATHS } from "../constants.js";

const PREFIXES = Object.values(PATHS);

export function isAllowedConsumerPath(path: string): boolean {
  if (typeof path !== "string" || !path.startsWith("/")) return false;
  if (path.includes("://") || path.includes("..") || path.includes("\\") || path.includes("?")) return false;
  return PREFIXES.some((base) => path === base || path.startsWith(`${base}/`));
}

export function assertAllowedConsumerPath(path: string): void {
  if (!isAllowedConsumerPath(path)) {
    throw new Error(`PATH_NOT_ALLOWED: refusing unofficial iFood path ${path}`);
  }
}

const HOST_SUFFIXES = ["marketplace.ifood.com.br", "cw-marketplace.ifood.com.br", "wsloja.ifood.com.br"];

export function isAllowedIfoodHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return HOST_SUFFIXES.includes(host);
  } catch {
    return false;
  }
}
