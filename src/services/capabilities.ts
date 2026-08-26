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
      "ifood_list_orders",
      "ifood_get_order",
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
      "ifood_merchant_info"
    ],
    gated_cart_writes: ["ifood_create_cart", "ifood_set_delivery_method", "ifood_set_payment_method"],
    gated_pay: ["ifood_checkout"],
    gated_intent_only: ["ifood_logout"]
  };
}
