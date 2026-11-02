import { assertToolInputBudget } from "../services/tool-input-budget.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AddToCartInputSchema,
  AddressCreateInputSchema,
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
  handleAddToCart,
  handleBenefits,
  handleCapabilities,
  handleCategories,
  handleCheckout,
  handleConnectionStatus,
  handleContactMethods,
  handleCreateAddress,
  handleCreateCart,
  handleFilterOptions,
  handleGetCart,
  handleGetOrder,
  handleGetOrderEta,
  handleGetOrderInvoice,
  handleGetOrderReceipt,
  handleHome,
  handleIdentities,
  handleListActiveOrders,
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
  handleSetPaymentMethod,
  handleTrackOrder
} from "../services/handlers.js";
import type { ToolResponse } from "../types.js";

type CallFn = (args: Record<string, unknown>) => Promise<ToolResponse>;
const call =
  <T,>(schema: { safeParse(input: unknown): { success: true; data: T } | { success: false } }, fn: (input: T) => Promise<ToolResponse>): CallFn =>
  async (args) => {
    assertToolInputBudget(args);
    const parsed = schema.safeParse(args);
    if (!parsed.success) throw new Error("INVALID_INPUT: arguments do not match the tool schema");
    return fn(parsed.data);
  };

/** Same handlers as MCP tools — CLI `call` uses this so skill-only clients hit the identical gates. */
export const TOOL_CALLS: Record<string, CallFn> = {
  ifood_connection_status: call(ResponseOnlyInputSchema, handleConnectionStatus),
  ifood_capabilities: call(ResponseOnlyInputSchema, handleCapabilities),
  ifood_privacy_audit: call(ResponseOnlyInputSchema, handlePrivacyAudit),
  ifood_customer_me: call(ReadInputSchema, handleMe),
  ifood_list_addresses: call(ReadInputSchema, handleListAddresses),
  ifood_contact_methods: call(ReadInputSchema, handleContactMethods),
  ifood_identities: call(ReadInputSchema, handleIdentities),
  ifood_list_orders: call(OrdersListInputSchema, handleListOrders),
  ifood_list_active_orders: call(OrdersListInputSchema, handleListActiveOrders),
  ifood_get_order: call(OrderIdInputSchema, handleGetOrder),
  ifood_track_order: call(OrderIdInputSchema, handleTrackOrder),
  ifood_get_order_eta: call(OrderIdInputSchema, handleGetOrderEta),
  ifood_get_order_receipt: call(OrderIdInputSchema, handleGetOrderReceipt),
  ifood_get_order_invoice: call(OrderIdInputSchema, handleGetOrderInvoice),
  ifood_loyalty_cards: call(ReadInputSchema, handleLoyalty),
  ifood_benefits: call(ReadInputSchema, handleBenefits),
  ifood_list_payment_methods: call(ReadInputSchema, handleListPaymentMethods),
  ifood_filter_options: call(ReadInputSchema, handleFilterOptions),
  ifood_reviews: call(MerchantIdInputSchema, handleReviews),
  ifood_previous_items: call(MerchantIdInputSchema, handlePreviousItems),
  ifood_get_cart: call(CartIdInputSchema, handleGetCart),
  ifood_merchant_payment_methods: call(MerchantIdInputSchema, handleMerchantPayments),
  ifood_search: call(GeoSearchInputSchema, handleSearch),
  ifood_home: call(GeoInputSchema, handleHome),
  ifood_categories: call(GeoInputSchema, handleCategories),
  ifood_merchant_info: call(MerchantIdInputSchema, handleMerchantInfo),
  ifood_create_cart: call(CreateCartInputSchema, handleCreateCart),
  ifood_add_to_cart: call(AddToCartInputSchema, handleAddToCart),
  ifood_create_address: call(AddressCreateInputSchema, handleCreateAddress),
  ifood_set_delivery_method: call(DeliveryMethodInputSchema, handleSetDeliveryMethod),
  ifood_set_payment_method: call(CartPaymentInputSchema, handleSetPaymentMethod),
  ifood_checkout: call(CheckoutInputSchema, handleCheckout),
  ifood_logout: call(LogoutInputSchema, handleLogout)
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

  server.registerTool("ifood_identities", {
    title: "iFood external identities",
    description: "Allowlisted GET /v1/customers/me/external-identities. Identity redacted. Read-only.",
    inputSchema: ReadInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleIdentities(args));

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

  server.registerTool("ifood_list_active_orders", {
    title: "List active iFood orders",
    description: "GET /v4/customers/me/orders?status=ONGOING (401 JSON without jwt). Read-only.",
    inputSchema: OrdersListInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleListActiveOrders(args));

  server.registerTool("ifood_track_order", {
    title: "Track iFood order",
    description:
      "Dedicated /tracking URLs 404. Reads the live GET /v3/customers/me/orders/:id payload instead. Read-only.",
    inputSchema: OrderIdInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleTrackOrder(args));

  server.registerTool("ifood_get_order_eta", {
    title: "iFood order ETA",
    description: "Dedicated /eta URL 404. Reads the live order payload. Read-only.",
    inputSchema: OrderIdInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleGetOrderEta(args));

  server.registerTool("ifood_get_order_receipt", {
    title: "iFood order receipt",
    description: "Dedicated /receipt URL 404. Reads the live order payload. Read-only.",
    inputSchema: OrderIdInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleGetOrderReceipt(args));

  server.registerTool("ifood_get_order_invoice", {
    title: "iFood order invoice",
    description: "Dedicated /invoice /nfe URLs 404. Reads the live order payload. Read-only.",
    inputSchema: OrderIdInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleGetOrderInvoice(args));

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
    description: "Fees, hours, rating via unofficial GraphQL. Read-only. May WAF from datacenter IPs.",
    inputSchema: MerchantIdInputSchema.shape,
    annotations: readOnly
  }, async (args) => handleMerchantInfo(args));

  server.registerTool("ifood_create_cart", {
    title: "Create iFood cart",
    description: "Gated write on cw-marketplace. Requires IFOOD_ALLOW_MUTATIONS and explicit_user_intent. Does not checkout.",
    inputSchema: CreateCartInputSchema.shape,
    annotations: gatedWrite
  }, async (args) => handleCreateCart(args));

  server.registerTool("ifood_add_to_cart", {
    title: "Add items to iFood cart",
    description:
      "POST /v1/carts on cw-marketplace (401 JSON no-jwt). Item subpaths 404. Dual-gated. Does not checkout.",
    inputSchema: AddToCartInputSchema.shape,
    annotations: gatedWrite
  }, async (args) => handleAddToCart(args));

  server.registerTool("ifood_create_address", {
    title: "Create iFood address",
    description: "POST /v1/customers/me/addresses (401 JSON no-jwt). Requires explicit_user_intent. PUT/DELETE :id 404.",
    inputSchema: AddressCreateInputSchema.shape,
    annotations: gatedWrite
  }, async (args) => handleCreateAddress(args));

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
