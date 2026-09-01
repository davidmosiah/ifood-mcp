import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { promises as fs } from "node:fs";
import {
  APP_VERSION,
  MERCHANT_INFO_QUERY,
  PATHS,
  REQUEST_TIMEOUT_MS,
  SEARCH_BODY,
  WEB_CLIENT_KEY,
  WEB_ORIGIN,
  WEB_USER_AGENT
} from "../constants.js";
import type { FetchLike, IfoodConfig, IfoodHost, IfoodTokenSet } from "../types.js";
import { TokenStore } from "./token-store.js";
import { assertAllowedConsumerPath, isAllowedIfoodHost } from "./path-allowlist.js";

export class IfoodClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "IfoodClientError";
  }
}

export function consumerHeaders(deviceId: string, sessionId: string, accountId?: string): Record<string, string> {
  return {
    accept: "application/json, text/plain, */*",
    "accept-language": "pt-BR,pt;q=1",
    "content-type": "application/json",
    origin: WEB_ORIGIN,
    referer: `${WEB_ORIGIN}/`,
    "user-agent": WEB_USER_AGENT,
    app_version: APP_VERSION,
    browser: "Mac OS",
    platform: "Desktop",
    "x-client-application-key": process.env.IFOOD_CLIENT_KEY?.trim() || WEB_CLIENT_KEY,
    "x-device-model": "Macintosh Chrome",
    "x-ifood-device-id": deviceId,
    "x-ifood-session-id": sessionId,
    ...(accountId
      ? { account_id: accountId, "x-ifood-user-id": accountId }
      : {})
  };
}

export class IfoodClient {
  constructor(
    private readonly config: IfoodConfig,
    private readonly tokens: TokenStore,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  private hostUrl(host: IfoodHost): string {
    if (host === "cart") return this.config.cartBase;
    if (host === "checkout") return this.config.checkoutBase;
    return this.config.apiBase;
  }

  async deviceId(): Promise<string> {
    const fromEnv = process.env.IFOOD_DEVICE_ID?.trim();
    if (fromEnv) return fromEnv;
    try {
      const existing = (await fs.readFile(this.config.deviceIdPath, "utf8")).trim();
      if (existing) return existing;
    } catch {
      // create
    }
    const id = randomUUID();
    await fs.mkdir(dirname(this.config.deviceIdPath), { recursive: true, mode: 0o700 });
    await fs.writeFile(this.config.deviceIdPath, `${id}\n`, { mode: 0o600 });
    return id;
  }

  async sessionId(): Promise<string> {
    const fromEnv = process.env.IFOOD_SESSION_ID?.trim();
    if (fromEnv) return fromEnv;
    const token = await this.tokens.read();
    if (token?.session_id) return token.session_id;
    return randomUUID();
  }

  async me(): Promise<unknown> {
    return this.requestJson("GET", PATHS.me, { auth: true });
  }

  async listAddresses(): Promise<unknown> {
    return this.requestJson("GET", PATHS.addresses, { auth: true });
  }

  async contactMethods(): Promise<unknown> {
    return this.requestJson("GET", PATHS.contactMethods, { auth: true });
  }

  async listOrders(page = 0, size = 10): Promise<unknown> {
    return this.requestJson("GET", PATHS.orders, { auth: true, query: { page, size } });
  }

  async getOrder(orderId: string): Promise<unknown> {
    return this.requestJson("GET", `${PATHS.order}/${encodeURIComponent(orderId)}`, { auth: true });
  }

  async loyaltyCards(): Promise<unknown> {
    return this.requestJson("GET", PATHS.loyalty, { auth: true });
  }

  async benefits(): Promise<unknown> {
    return this.requestJson("GET", PATHS.benefits, { auth: true });
  }

  async listPaymentMethods(): Promise<unknown> {
    return this.requestJson("GET", PATHS.paymentMethods, { auth: true });
  }

  async previousMerchantItems(merchantId: string): Promise<unknown> {
    return this.requestJson("GET", `${PATHS.previousItems}/${encodeURIComponent(merchantId)}/items`, { auth: true });
  }

  async filterOptions(): Promise<unknown> {
    return this.requestJson("GET", PATHS.filterOptions, { auth: false });
  }

  async reviews(merchantId: string): Promise<unknown> {
    return this.requestJson("GET", PATHS.reviews, {
      auth: false,
      query: { filterJson: JSON.stringify({ merchantId }) }
    });
  }

  async search(term: string, latitude: number, longitude: number, size = 20): Promise<unknown> {
    return this.requestJson("POST", PATHS.search, {
      auth: "optional",
      query: { term, latitude, longitude, size },
      body: SEARCH_BODY
    });
  }

  async home(latitude: number, longitude: number): Promise<unknown> {
    return this.requestJson("GET", PATHS.home, {
      auth: "optional",
      query: { latitude, longitude, alias: "HOME_FOOD_DELIVERY_V3", size: 20 }
    });
  }

  async categories(latitude: number, longitude: number): Promise<unknown> {
    return this.requestJson("GET", PATHS.categories, {
      auth: "optional",
      query: { latitude, longitude }
    });
  }

  async merchantInfo(merchantId: string): Promise<unknown> {
    return this.requestJson("POST", PATHS.merchantGraphql, {
      auth: "optional",
      body: { query: MERCHANT_INFO_QUERY, variables: { merchantId } }
    });
  }

  async merchantPaymentMethods(merchantId: string): Promise<unknown> {
    return this.requestJson("GET", `${PATHS.merchantPayments}/${encodeURIComponent(merchantId)}/payment-methods`, {
      auth: false,
      host: "cart"
    });
  }

  async getCart(cartId: string): Promise<unknown> {
    return this.requestJson("GET", `${PATHS.carts}/${encodeURIComponent(cartId)}`, { auth: true, host: "cart" });
  }

  async identities(): Promise<unknown> {
    return this.requestJson("GET", PATHS.identities, { auth: true });
  }

  async listActiveOrders(page = 0, size = 10): Promise<unknown> {
    return this.requestJson("GET", PATHS.orders, {
      auth: true,
      query: { page, size, status: "ONGOING" }
    });
  }

  async createAddress(body: unknown): Promise<unknown> {
    return this.requestJson("POST", PATHS.addresses, { auth: true, body });
  }

  async createCart(body: unknown): Promise<unknown> {
    return this.requestJson("POST", PATHS.carts, { auth: true, host: "cart", body });
  }

  async setDeliveryMethod(cartId: string, body: unknown): Promise<unknown> {
    return this.requestJson("PUT", `${PATHS.carts}/${encodeURIComponent(cartId)}/deliveryMethod`, {
      auth: true,
      host: "cart",
      body
    });
  }

  async setPaymentMethod(cartId: string, paymentMethods: unknown): Promise<unknown> {
    return this.requestJson("PUT", `${PATHS.carts}/${encodeURIComponent(cartId)}/paymentMethod`, {
      auth: true,
      host: "cart",
      body: paymentMethods
    });
  }

  async checkout(cartId: string, payload: unknown): Promise<unknown> {
    return this.requestJson("POST", `${PATHS.carts}/${encodeURIComponent(cartId)}/checkout`, {
      auth: true,
      host: "checkout",
      body: payload
    });
  }

  async requestOtp(email: string): Promise<{ key: string; timeoutSec: number; deviceId: string; sessionId: string }> {
    const deviceId = await this.deviceId();
    const sessionId = await this.sessionId();
    const payload = (await this.requestJson("POST", PATHS.otpCodes, {
      auth: false,
      body: { tenant_id: "IFO", type: "EMAIL", email },
      deviceId,
      sessionId
    })) as Record<string, unknown>;
    return {
      key: String(payload.key ?? ""),
      timeoutSec: Number(payload.timeout_in_seconds ?? 60),
      deviceId,
      sessionId
    };
  }

  async completeOtp(opts: {
    key: string;
    code: string;
    email: string;
    deviceId: string;
    sessionId: string;
  }): Promise<IfoodTokenSet> {
    const exchanged = (await this.requestJson("POST", PATHS.otpTokens, {
      auth: false,
      body: { key: opts.key, auth_code: opts.code },
      deviceId: opts.deviceId,
      sessionId: opts.sessionId
    })) as Record<string, unknown>;
    const otpToken = String(exchanged.access_token ?? "");
    const minted = (await this.requestJson("POST", PATHS.otpAuth, {
      auth: false,
      body: {
        tenant_id: "IFO",
        token: otpToken,
        device_id: opts.deviceId,
        email: opts.email
      },
      deviceId: opts.deviceId,
      sessionId: opts.sessionId
    })) as Record<string, unknown>;
    const access = String(minted.access_token ?? minted.accessToken ?? "");
    if (!access) {
      throw new IfoodClientError("OTP authentication returned no access_token", undefined, "AUTH_REQUIRED");
    }
    const set: IfoodTokenSet = {
      access_token: access,
      refresh_token: typeof minted.refresh_token === "string" ? minted.refresh_token : undefined,
      token_type: "Bearer",
      source: "otp",
      account_id: typeof minted.account_id === "string" ? minted.account_id : accountIdFromJwt(access),
      device_id: opts.deviceId,
      session_id: opts.sessionId,
      expires_at: Date.now() + 50 * 60 * 1000
    };
    await this.tokens.write(set);
    return set;
  }

  async requestJson(
    method: string,
    path: string,
    options: {
      auth: boolean | "optional";
      host?: IfoodHost;
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      deviceId?: string;
      sessionId?: string;
    }
  ): Promise<unknown> {
    const url = consumerRequestUrl(this.hostUrl(options.host ?? "main"), path, options.query);
    const deviceId = options.deviceId ?? (await this.deviceId());
    const sessionId = options.sessionId ?? (await this.sessionId());
    const stored = await this.tokens.read();
    const headers: Record<string, string> = {
      ...consumerHeaders(deviceId, sessionId, stored?.account_id || process.env.IFOOD_ACCOUNT_ID)
    };
    if (options.auth) {
      const envToken = process.env.IFOOD_ACCESS_TOKEN?.trim();
      const access = stored?.access_token || envToken;
      if (!access) {
        if (options.auth === "optional") {
          // browse may still work
        } else {
          throw new IfoodClientError(
            "No iFood access token. Run `ifood-mcp-unofficial auth start --email you@x.com` then `auth complete --code <otp> --email you@x.com`, or `auth --token <jwt>`.",
            undefined,
            "AUTH_REQUIRED"
          );
        }
      } else {
        headers.authorization = `Bearer ${access}`;
      }
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await this.fetchImpl(url, {
        method,
        headers,
        body: options.body === undefined || method === "GET" || method === "DELETE" ? undefined : JSON.stringify(options.body),
        signal: controller.signal
      });
      const text = await response.text();
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = { raw: text.slice(0, 400) };
      }
      if (!response.ok) {
        throw new IfoodClientError(
          `Unofficial iFood surface returned HTTP ${response.status} for ${method} ${path}. The consumer API is undocumented and may change.`,
          response.status,
          "IFOOD_UPSTREAM_UNAVAILABLE"
        );
      }
      return parsed;
    } catch (error) {
      if (error instanceof IfoodClientError) throw error;
      throw new IfoodClientError(`iFood request failed: ${(error as Error).message}`, undefined, "IFOOD_UPSTREAM_UNAVAILABLE");
    } finally {
      clearTimeout(timer);
    }
  }
}

export function consumerRequestUrl(
  apiBase: string,
  path: string,
  query?: Record<string, string | number | undefined>
): string {
  try {
    assertAllowedConsumerPath(path);
  } catch (error) {
    throw new IfoodClientError((error as Error).message, undefined, "PATH_NOT_ALLOWED");
  }
  let url = apiBase.replace(/\/$/, "") + path;
  if (!isAllowedIfoodHost(url)) {
    throw new IfoodClientError(`HOST_NOT_ALLOWED: ${apiBase}`, undefined, "PATH_NOT_ALLOWED");
  }
  if (query) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") qs.set(key, String(value));
    }
    const encoded = qs.toString();
    if (encoded) url += `?${encoded}`;
  }
  return url;
}

function accountIdFromJwt(token: string): string | undefined {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());
    if (typeof payload.sub === "string") return payload.sub;
    if (typeof payload.account_id === "string") return payload.account_id;
  } catch {
    return undefined;
  }
  return undefined;
}
