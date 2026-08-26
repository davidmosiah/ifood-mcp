import { z } from "zod";

export const ResponseFormatSchema = z.enum(["markdown", "json"]).default("markdown");
export const PrivacyModeSchema = z.enum(["summary", "structured", "raw"]).optional();
const Intent = z.boolean().default(false).describe("Must be true after the user explicitly asked for this write.");

export const ResponseOnlyInputSchema = z.object({ response_format: ResponseFormatSchema }).strict();
export const ReadInputSchema = z.object({
  privacy_mode: PrivacyModeSchema,
  response_format: ResponseFormatSchema
}).strict();

export const GeoSearchInputSchema = z.object({
  term: z.string().min(1).max(200),
  latitude: z.number(),
  longitude: z.number(),
  size: z.number().int().min(1).max(50).optional(),
  privacy_mode: PrivacyModeSchema,
  response_format: ResponseFormatSchema
}).strict();

export const GeoInputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  privacy_mode: PrivacyModeSchema,
  response_format: ResponseFormatSchema
}).strict();

export const MerchantIdInputSchema = z.object({
  merchant_id: z.string().min(1),
  privacy_mode: PrivacyModeSchema,
  response_format: ResponseFormatSchema
}).strict();

export const OrderIdInputSchema = z.object({
  order_id: z.string().min(1),
  privacy_mode: PrivacyModeSchema,
  response_format: ResponseFormatSchema
}).strict();

export const OrdersListInputSchema = z.object({
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).max(50).optional(),
  privacy_mode: PrivacyModeSchema,
  response_format: ResponseFormatSchema
}).strict();

export const CartIdInputSchema = z.object({
  cart_id: z.string().min(1),
  privacy_mode: PrivacyModeSchema,
  response_format: ResponseFormatSchema
}).strict();

export const LogoutInputSchema = z.object({
  explicit_user_intent: Intent,
  response_format: ResponseFormatSchema
}).strict();

export const CreateCartInputSchema = z.object({
  merchant_id: z.string().min(1),
  items: z.array(z.record(z.string(), z.unknown())).min(1),
  address_id: z.string().optional(),
  explicit_user_intent: Intent,
  response_format: ResponseFormatSchema
}).strict();

export const DeliveryMethodInputSchema = z.object({
  cart_id: z.string().min(1),
  method: z.enum(["DEFAULT", "PRIORITY", "TAKEOUT"]),
  explicit_user_intent: Intent,
  response_format: ResponseFormatSchema
}).strict();

export const CartPaymentInputSchema = z.object({
  cart_id: z.string().min(1),
  payment_method_ids: z.array(z.string().min(1)).min(1),
  explicit_user_intent: Intent,
  response_format: ResponseFormatSchema
}).strict();

export const CheckoutInputSchema = z.object({
  cart_id: z.string().min(1),
  checkout_payload: z.record(z.string(), z.unknown()),
  explicit_user_intent: Intent,
  response_format: ResponseFormatSchema
}).strict();
