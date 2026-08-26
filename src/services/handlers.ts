import type { PrivacyMode, ResponseFormat } from "../types.js";
import { peekConfig } from "./config.js";
import { IfoodClient, IfoodClientError } from "./ifood-client.js";
import { TokenStore } from "./token-store.js";
import { applyPrivacy } from "./privacy.js";
import { bulletList, makeError, makeResponse } from "./format.js";
import {
  MutationGateError,
  assertCartWriteAllowed,
  assertCheckoutAllowed,
  assertLogoutAllowed
} from "./mutation-gate.js";
import { buildConnectionStatus } from "./connection-status.js";
import { buildCapabilities } from "./capabilities.js";
import { buildPrivacyAudit } from "./audit.js";

export interface HandlerDeps {
  client?: IfoodClient;
  tokens?: TokenStore;
  allowMutations?: boolean;
  fetchImpl?: typeof fetch;
}

function deps(extra: HandlerDeps = {}) {
  const config = peekConfig();
  const tokens = extra.tokens ?? new TokenStore(config.tokenPath);
  const client = extra.client ?? new IfoodClient(config, tokens, extra.fetchImpl);
  const allowMutations = extra.allowMutations ?? config.allowMutations;
  return { config, tokens, client, allowMutations };
}

function gateError(error: unknown) {
  if (error instanceof MutationGateError || error instanceof IfoodClientError) {
    return makeError(error.message);
  }
  return makeError((error as Error).message);
}

function wrap<T>(payload: T, format: ResponseFormat, title: string, fields: Record<string, unknown>) {
  return makeResponse(payload, format, bulletList(title, fields));
}

export async function handleConnectionStatus(input: { response_format?: ResponseFormat } = {}) {
  const status = await buildConnectionStatus();
  return wrap(status, input.response_format ?? "markdown", "iFood MCP · connection", {
    ok: status.ok,
    mutations_enabled: status.mutations_enabled,
    never_pays_by_default: status.never_pays_by_default
  });
}

export async function handleCapabilities(input: { response_format?: ResponseFormat } = {}) {
  return wrap(buildCapabilities(), input.response_format ?? "markdown", "iFood capabilities", {
    unofficial: true,
    never_pays_by_default: true
  });
}

export async function handlePrivacyAudit(input: { response_format?: ResponseFormat } = {}) {
  return wrap(buildPrivacyAudit(), input.response_format ?? "markdown", "iFood privacy", { redacted: true });
}

async function readWrap(
  extra: HandlerDeps,
  input: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  title: string,
  fn: (client: IfoodClient) => Promise<unknown>
) {
  const { config, client } = deps(extra);
  try {
    const raw = await fn(client);
    const payload = applyPrivacy({ unofficial: true, data: raw }, input.privacy_mode ?? config.privacyMode);
    return wrap(payload, input.response_format ?? "markdown", title, { unofficial: true });
  } catch (error) {
    return gateError(error);
  }
}

export const handleMe = (i: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {}, e: HandlerDeps = {}) =>
  readWrap(e, i, "iFood profile", (c) => c.me());
export const handleListAddresses = (i: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {}, e: HandlerDeps = {}) =>
  readWrap(e, i, "iFood addresses", (c) => c.listAddresses());
export const handleContactMethods = (i: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {}, e: HandlerDeps = {}) =>
  readWrap(e, i, "iFood contacts", (c) => c.contactMethods());
export const handleLoyalty = (i: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {}, e: HandlerDeps = {}) =>
  readWrap(e, i, "iFood loyalty", (c) => c.loyaltyCards());
export const handleBenefits = (i: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {}, e: HandlerDeps = {}) =>
  readWrap(e, i, "iFood benefits", (c) => c.benefits());
export const handleListPaymentMethods = (i: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {}, e: HandlerDeps = {}) =>
  readWrap(e, i, "iFood payment methods", (c) => c.listPaymentMethods());
export const handleFilterOptions = (i: { privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {}, e: HandlerDeps = {}) =>
  readWrap(e, i, "iFood filters", (c) => c.filterOptions());

export async function handleListOrders(
  input: { page?: number; size?: number; privacy_mode?: PrivacyMode; response_format?: ResponseFormat } = {},
  extra: HandlerDeps = {}
) {
  return readWrap(extra, input, "iFood orders", (c) => c.listOrders(input.page ?? 0, input.size ?? 10));
}

export async function handleGetOrder(
  input: { order_id: string; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  return readWrap(extra, input, "iFood order", (c) => c.getOrder(input.order_id));
}

export async function handlePreviousItems(
  input: { merchant_id: string; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  return readWrap(extra, input, "iFood previous items", (c) => c.previousMerchantItems(input.merchant_id));
}

export async function handleReviews(
  input: { merchant_id: string; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  return readWrap(extra, input, "iFood reviews", (c) => c.reviews(input.merchant_id));
}

export async function handleMerchantPayments(
  input: { merchant_id: string; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  return readWrap(extra, input, "iFood merchant payments", (c) => c.merchantPaymentMethods(input.merchant_id));
}

export async function handleGetCart(
  input: { cart_id: string; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  return readWrap(extra, input, "iFood cart", (c) => c.getCart(input.cart_id));
}

export async function handleSearch(
  input: {
    term: string;
    latitude: number;
    longitude: number;
    size?: number;
    privacy_mode?: PrivacyMode;
    response_format?: ResponseFormat;
  },
  extra: HandlerDeps = {}
) {
  return readWrap(extra, input, "iFood search", (c) => c.search(input.term, input.latitude, input.longitude, input.size));
}

export async function handleHome(
  input: { latitude: number; longitude: number; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  return readWrap(extra, input, "iFood home", (c) => c.home(input.latitude, input.longitude));
}

export async function handleCategories(
  input: { latitude: number; longitude: number; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  return readWrap(extra, input, "iFood categories", (c) => c.categories(input.latitude, input.longitude));
}

export async function handleMerchantInfo(
  input: { merchant_id: string; privacy_mode?: PrivacyMode; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  return readWrap(extra, input, "iFood merchant", (c) => c.merchantInfo(input.merchant_id));
}

export async function handleCreateCart(
  input: {
    merchant_id: string;
    items: Array<Record<string, unknown>>;
    address_id?: string;
    explicit_user_intent?: boolean;
    response_format?: ResponseFormat;
  },
  extra: HandlerDeps = {}
) {
  const { allowMutations, client } = deps(extra);
  try {
    assertCartWriteAllowed({ allowMutations, explicitUserIntent: input.explicit_user_intent });
    const raw = await client.createCart({
      merchant: { id: input.merchant_id },
      items: input.items,
      address: input.address_id ? { id: input.address_id } : undefined
    });
    return wrap({ ok: true, cart: raw }, input.response_format ?? "markdown", "iFood cart created", { ok: true });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleSetDeliveryMethod(
  input: {
    cart_id: string;
    method: "DEFAULT" | "PRIORITY" | "TAKEOUT";
    explicit_user_intent?: boolean;
    response_format?: ResponseFormat;
  },
  extra: HandlerDeps = {}
) {
  const { allowMutations, client } = deps(extra);
  try {
    assertCartWriteAllowed({ allowMutations, explicitUserIntent: input.explicit_user_intent });
    const raw = await client.setDeliveryMethod(input.cart_id, { id: input.method, now: true, deliveryBy: "IFOOD" });
    return wrap({ ok: true, cart: raw }, input.response_format ?? "markdown", "iFood delivery method", { ok: true });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleSetPaymentMethod(
  input: {
    cart_id: string;
    payment_method_ids: string[];
    explicit_user_intent?: boolean;
    response_format?: ResponseFormat;
  },
  extra: HandlerDeps = {}
) {
  const { allowMutations, client } = deps(extra);
  try {
    assertCartWriteAllowed({ allowMutations, explicitUserIntent: input.explicit_user_intent });
    const raw = await client.setPaymentMethod(input.cart_id, input.payment_method_ids);
    return wrap({ ok: true, cart: raw }, input.response_format ?? "markdown", "iFood cart payment", { ok: true });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleCheckout(
  input: {
    cart_id: string;
    checkout_payload: Record<string, unknown>;
    explicit_user_intent?: boolean;
    response_format?: ResponseFormat;
  },
  extra: HandlerDeps = {}
) {
  const { allowMutations, client } = deps(extra);
  try {
    assertCheckoutAllowed({ allowMutations, explicitUserIntent: input.explicit_user_intent });
    const raw = await client.checkout(input.cart_id, input.checkout_payload);
    return wrap({ ok: true, order: raw }, input.response_format ?? "markdown", "iFood checkout", { ok: true });
  } catch (error) {
    return gateError(error);
  }
}

export async function handleLogout(
  input: { explicit_user_intent?: boolean; response_format?: ResponseFormat },
  extra: HandlerDeps = {}
) {
  const { tokens } = deps(extra);
  try {
    assertLogoutAllowed(input.explicit_user_intent);
    await tokens.clear();
    return wrap({ ok: true, logged_out: true }, input.response_format ?? "markdown", "iFood logout", {
      ok: true,
      logged_out: true
    });
  } catch (error) {
    return gateError(error);
  }
}
