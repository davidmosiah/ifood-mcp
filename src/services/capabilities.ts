import { PATHS, SERVER_VERSION } from "../constants.js";
import { peekConfig } from "./config.js";

export function buildCapabilities() {
  const config = peekConfig();
  return {
    unofficial: true as const,
    version: SERVER_VERSION,
    surface: "iFood consumer marketplace / cw-marketplace / wsloja — not merchant-api Partners",
    api_base: config.apiBase,
    cart_base: config.cartBase,
    checkout_base: config.checkoutBase,
    documented_paths: PATHS,
    mutations_enabled: config.allowMutations,
    never_pays_by_default: true,
    read_tools: [
      "ifood_customer_me",
      "ifood_list_addresses",
      "ifood_contact_methods",
      "ifood_identities",
      "ifood_list_orders",
      "ifood_list_active_orders",
      "ifood_get_order",
      "ifood_track_order",
      "ifood_get_order_eta",
      "ifood_get_order_receipt",
      "ifood_get_order_invoice",
      "ifood_loyalty_cards",
      "ifood_benefits",
      "ifood_list_payment_methods",
      "ifood_filter_options",
      "ifood_reviews",
      "ifood_previous_items",
      "ifood_get_cart",
      "ifood_merchant_payment_methods",
      "ifood_search",
      "ifood_home",
      "ifood_categories",
      "ifood_merchant_info",
      "ifood_merchant_catalog"
    ],
    gated_cart_writes: [
      "ifood_create_cart",
      "ifood_add_to_cart",
      "ifood_set_delivery_method",
      "ifood_set_payment_method"
    ],
    gated_pay: ["ifood_checkout"],
    gated_intent_only: ["ifood_logout", "ifood_create_address"],
    honest_gaps: [
      {
        wanted: "ifood_update_address / ifood_delete_address / ifood_set_active_address",
        probe: "PUT/PATCH/DELETE /v1/customers/me/addresses/:id → HTTP 404 JSON"
      },
      {
        wanted: "ifood_update_cart_item / ifood_clear_cart / ifood_apply_coupon / ifood_tip_order",
        probe: "PUT/PATCH/DELETE /v1/carts/:id and /coupon /tip → HTTP 404 JSON on cw-marketplace"
      },
      {
        wanted: "ifood_reorder / ifood_cancel_order",
        probe: "POST/PUT /v3/customers/me/orders/:id(/reorder|/cancel) → HTTP 404 JSON"
      },
      {
        wanted: "ifood_geocode_address",
        probe: "GET/POST /v1/geocode and /v1/addresses/geocode → HTTP 404 JSON"
      },
      {
        wanted: "ifood_rate_order write / ifood_favorites / ifood_item_details",
        probe: "POST /v1/review/evaluations, GET favorites, GET catalog/items → HTTP 404 JSON; item GraphQL WAF HTML 403 from this IP"
      }
    ]
  };
}
