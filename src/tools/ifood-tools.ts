import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CartIdInputSchema,
  CartPaymentInputSchema,
  CheckoutInputSchema,
  CreateCartInputSchema,
  DeliveryMethodInputSchema,
  GeoInputSchema,
  GeoSearchInputSchema,
  LogoutInputSchema,
  MerchantIdInputSchema,
  OrderIdInputSchema,
  OrdersListInputSchema,
  ReadInputSchema,
  ResponseOnlyInputSchema
} from "../schemas/common.js";
import {
  handleBenefits,
  handleCapabilities,
  handleCategories,
  handleCheckout,
  handleConnectionStatus,
  handleContactMethods,
  handleCreateCart,
  handleFilterOptions,
  handleGetCart,
  handleGetOrder,
  handleHome,
  handleListAddresses,
  handleListOrders,
  handleListPaymentMethods,
  handleLogout,
  handleLoyalty,
  handleMe,
  handleMerchantInfo,
  handleMerchantPayments,
  handlePreviousItems,
  handlePrivacyAudit,
  handleReviews,
  handleSearch,
  handleSetDeliveryMethod,
  handleSetPaymentMethod
} from "../services/handlers.js";
import type { ToolResponse } from "../types.js";

type CallFn = (args: Record<string, unknown>) => Promise<ToolResponse>;
const call =
  <T,>(fn: (input: T) => Promise<ToolResponse>): CallFn =>
  (args) =>
    fn(args as T);

/** Same handlers as MCP tools — CLI `call` uses this so skill-only clients hit the identical gates. */
export const TOOL_CALLS: Record<string, CallFn> = {
  ifood_connection_status: call(handleConnectionStatus),
  ifood_capabilities: call(handleCapabilities),
  ifood_privacy_audit: call(handlePrivacyAudit),
  ifood_customer_me: call(handleMe),
  ifood_list_addresses: call(handleListAddresses),
  ifood_contact_methods: call(handleContactMethods),
  ifood_list_orders: call(handleListOrders),
  ifood_get_order: call(handleGetOrder),
  ifood_loyalty_cards: call(handleLoyalty),
  ifood_benefits: call(handleBenefits),
  ifood_list_payment_methods: call(handleListPaymentMethods),
  ifood_filter_options: call(handleFilterOptions),
  ifood_reviews: call(handleReviews),
  ifood_previous_items: call(handlePreviousItems),
  ifood_get_cart: call(handleGetCart),
  ifood_merchant_payment_methods: call(handleMerchantPayments),
  ifood_search: call(handleSearch),
  ifood_home: call(handleHome),
  ifood_categories: call(handleCategories),
  ifood_merchant_info: call(handleMerchantInfo),
  ifood_create_cart: call(handleCreateCart),
  ifood_set_delivery_method: call(handleSetDeliveryMethod),
  ifood_set_payment_method: call(handleSetPaymentMethod),
  ifood_checkout: call(handleCheckout),
  ifood_logout: call(handleLogout)
};

const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const;
const gatedWrite = { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true } as const;

export function registerIfoodTools(server: McpServer): void {
  server.registerTool("ifood_connection_status", {
    title: "iFood connection status",
    description: "Local doctor: token present, mutations off by default, unofficial consumer surface.",
    inputSchema: ResponseOnlyInputSchema.shape,
    annotations: { ...readOnly, openWorldHint: false }
  }, async (args) => handleConnectionStatus(args));

  server.registerTool("ifood_capabilities", {
    title: "iFood capabilities",
    description: "What this unofficial MCP can read and which writes stay gated.",
    inputSchema: ResponseOnlyInputSchema.shape,
    annotations: { ...readOnly, openWorldHint: false }
  }, async (args) => handleCapabilities(args));

  server.registerTool("ifood_privacy_audit", {
    title: "iFood privacy audit",
    description: "Redaction defaults and fail-closed checkout.",
    inputSchema: ResponseOnlyInputSchema.shape,
    annotations: { ...readOnly, openWorldHint: false }
  }, async (args) => handlePrivacyAudit(args));

  server.registerTool("ifood_customer_me", {
    title: "iFood profile",
    description: "Authenticated customer profile. Identity redacted by default.",
    inputSchema: ReadInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleMe(args));

  server.registerTool("ifood_list_addresses", {
    title: "List iFood addresses",
    description: "Saved delivery addresses. Street/phone/email redacted by default.",
    inputSchema: ReadInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleListAddresses(args));

  server.registerTool("ifood_contact_methods", {
    title: "iFood contact methods",
    description: "Verified emails and phones. Redacted by default.",
    inputSchema: ReadInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleContactMethods(args));

  server.registerTool("ifood_list_orders", {
    title: "List iFood orders",
    description: "Past orders (v4). Read-only.",
    inputSchema: OrdersListInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleListOrders(args));

  server.registerTool("ifood_get_order", {
    title: "Get iFood order",
    description: "One order by id (v3). Read-only.",
    inputSchema: OrderIdInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleGetOrder(args));

  server.registerTool("ifood_loyalty_cards", {
    title: "iFood loyalty",
    description: "Club / stamps. Read-only.",
    inputSchema: ReadInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleLoyalty(args));

  server.registerTool("ifood_benefits", {
    title: "iFood benefits",
    description: "Wallet benefits and coupons. Read-only. Does not apply a coupon.",
    inputSchema: ReadInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleBenefits(args));

  server.registerTool("ifood_list_payment_methods", {
    title: "List iFood payment methods",
    description: "Saved wallet methods. Last-four redacted. Does not charge.",
    inputSchema: ReadInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleListPaymentMethods(args));

  server.registerTool("ifood_filter_options", {
    title: "iFood search filters",
    description: "Public filter catalog (200 without auth). Read-only.",
    inputSchema: ReadInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleFilterOptions(args));

  server.registerTool("ifood_reviews", {
    title: "iFood reviews",
    description: "Merchant reviews. Read-only.",
    inputSchema: MerchantIdInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleReviews(args));

  server.registerTool("ifood_previous_items", {
    title: "Previous items at merchant",
    description: "Items you ordered before at this merchant. Read-only.",
    inputSchema: MerchantIdInputSchema.shape,
    annotations: readOnly
  }, async (args) => handlePreviousItems(args));

  server.registerTool("ifood_get_cart", {
    title: "Get iFood cart",
    description: "Inspect a cart on cw-marketplace. Read-only.",
    inputSchema: CartIdInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleGetCart(args));

  server.registerTool("ifood_merchant_payment_methods", {
    title: "Merchant payment methods",
    description: "How a restaurant accepts payment. Read-only.",
    inputSchema: MerchantIdInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleMerchantPayments(args));

  server.registerTool("ifood_search", {
    title: "Search iFood",
    description: "Search restaurants/items near a point. Read-only. May WAF from datacenter IPs.",
    inputSchema: GeoSearchInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleSearch(args));

  server.registerTool("ifood_home", {
    title: "iFood home feed",
    description: "Localized home cards. Read-only. May WAF from datacenter IPs.",
    inputSchema: GeoInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleHome(args));

  server.registerTool("ifood_categories", {
    title: "iFood categories",
    description: "Top-level categories near a point. Read-only.",
    inputSchema: GeoInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleCategories(args));

  server.registerTool("ifood_merchant_info", {
    title: "iFood merchant info",
    description: "Fees, hours, rating via unofficial GraphQL. Read-only.",
    inputSchema: MerchantIdInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleMerchantInfo(args));

  server.registerTool("ifood_create_cart", {
    title: "Create iFood cart",
    description: "Gated write on cw-marketplace. Requires IFOOD_ALLOW_MUTATIONS and explicit_user_intent. Does not checkout.",
    inputSchema: CreateCartInputSchema.shape,
    annotations: gatedWrite
  }, async (args) => handleCreateCart(args));

  server.registerTool("ifood_set_delivery_method", {
    title: "Set iFood delivery method",
    description: "Gated cart write. DEFAULT / PRIORITY / TAKEOUT.",
    inputSchema: DeliveryMethodInputSchema.shape,
    annotations: gatedWrite
  }, async (args) => handleSetDeliveryMethod(args));

  server.registerTool("ifood_set_payment_method", {
    title: "Set iFood cart payment",
    description: "Gated cart write. Does not charge.",
    inputSchema: CartPaymentInputSchema.shape,
    annotations: gatedWrite
  }, async (args) => handleSetPaymentMethod(args));

  server.registerTool("ifood_checkout", {
    title: "Place iFood order",
    description:
      "FAIL-CLOSED. Charges money on wsloja checkout. Requires IFOOD_ALLOW_MUTATIONS and explicit_user_intent.",
    inputSchema: CheckoutInputSchema.shape,
    annotations: gatedWrite
  }, async (args) => handleCheckout(args));

  server.registerTool("ifood_logout", {
    title: "Logout iFood MCP",
    description: "Clears ~/.ifood-mcp/tokens.json. Requires explicit_user_intent.",
    inputSchema: LogoutInputSchema.shape,
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
  }, async (args) => handleLogout(args));
}
