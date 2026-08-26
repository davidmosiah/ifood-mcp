export const SERVER_NAME = "ifood-mcp-server";
export const SERVER_VERSION = "0.1.1";
export const NPM_PACKAGE_NAME = "ifood-mcp-unofficial";
export const PINNED_NPM_PACKAGE = `${NPM_PACKAGE_NAME}@${SERVER_VERSION}`;

/** Consumer marketplace (Akamai). www.ifood.com.br/site-api is Cloudflare-blocked from Node. */
export const DEFAULT_API_BASE = "https://marketplace.ifood.com.br";
/** Cart writes live here (POST /v1/carts is 401 no-jwt, not 404). */
export const DEFAULT_CART_BASE = "https://cw-marketplace.ifood.com.br";
/** Checkout (POST /v1/carts/:id/checkout → 401 no-jwt). */
export const DEFAULT_CHECKOUT_BASE = "https://wsloja.ifood.com.br/ifood-ws-v3";

export const WEB_ORIGIN = "https://www.ifood.com.br";
export const WEB_CLIENT_KEY = "41a266ee-51b7-4c37-9e9d-5cd331f280d5";
export const WEB_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
export const APP_VERSION = "9.141.4";

/**
 * Unofficial consumer paths probed 2026-08-26 against marketplace / cw-marketplace / wsloja.
 * KEEP: HTTP 200/400/401 JSON. Search/home/graphql are Akamai-WAF from this IP (Access Denied HTML)
 * but are the live web routes; the client still allowlists them.
 */
export const PATHS = {
  me: "/v1/customers/me",
  addresses: "/v1/customers/me/addresses",
  contactMethods: "/v1/customers/me/contact-methods",
  identities: "/v1/customers/me/external-identities",
  orders: "/v4/customers/me/orders",
  ordersAlt: "/v2/customers/me/orders",
  order: "/v3/customers/me/orders",
  previousItems: "/v1/customers/me/merchants",
  loyalty: "/v1/customers/me/loyalty-cards",
  benefits: "/v3/customers/me/wallet/benefits",
  paymentMethods: "/v1/payments/br/wallet/payment-methods",
  filterOptions: "/v6/filter-options/IFOOD/BR",
  reviews: "/v1/review/evaluations",
  search: "/v2/cardstack/search/results",
  home: "/v2/bm/home",
  categories: "/v2/categories",
  merchantGraphql: "/v1/merchant-info/graphql",
  merchantPayments: "/v1/merchants",
  carts: "/v1/carts",
  otpCodes: "/v2/identity-providers/OTP/authorization-codes",
  otpTokens: "/v2/identity-providers/OTP/access-tokens",
  otpChallenges: "/v1/identity-providers/OTP/challenges",
  otpAuth: "/v3/identity-providers/OTP/authentications",
  identityProviders: "/v4/identity-providers"
} as const;

export const SEARCH_BODY = {
  "supported-headers": ["OPERATION_HEADER"],
  "supported-cards": [
    "MERCHANT_LIST",
    "CATALOG_ITEM_LIST",
    "CATALOG_ITEM_LIST_V2",
    "FEATURED_MERCHANT_LIST",
    "MERCHANT_CAROUSEL",
    "INFO_CARD"
  ],
  "supported-actions": ["catalog-item", "item-details", "merchant", "page", "search"]
};

export const MERCHANT_INFO_QUERY = `query ($merchantId: String!) { merchant (merchantId: $merchantId, required: true) { id name available userRating deliveryFee { value } deliveryMethods { id title type value minTime maxTime } minimumOrderValue mainCategory { name } } }`;

export const REQUEST_TIMEOUT_MS = 20_000;
export const TOKEN_DIR_NAME = ".ifood-mcp";
