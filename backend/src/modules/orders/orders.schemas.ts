// backend/src/modules/orders/orders.schemas.ts
import { z } from 'zod';

export const OrderStatusEnum = z.enum([
  'DRAFT',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'PICKING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURN_RECEIVED',
  'REFUNDED',
  'REPLACED',
]);

/** Linha de input: variant + qty, com override de preço opcional (validado contra floor). */
export const orderLineInputSchema = z
  .object({
    variantId: z.string().min(1),
    qty: z.number().int().positive(),
    override: z.coerce.number().positive().optional(),
  })
  .strict();

export const createOrderSchema = z
  .object({
    customerId: z.string().min(1),
    notes: z.string().max(2000).optional(),
    requestedDeliveryDate: z.coerce.date().optional(),
    shippingAddress: z.record(z.unknown()).optional(),
    lines: z.array(orderLineInputSchema).max(200).optional(),
  })
  .strict();

export const updateOrderSchema = z
  .object({
    notes: z.string().max(2000).nullable().optional(),
    requestedDeliveryDate: z.coerce.date().nullable().optional(),
    shippingAddress: z.record(z.unknown()).nullable().optional(),
  })
  .strict();

export const addOrderLineSchema = orderLineInputSchema;

export const updateOrderLineSchema = z
  .object({
    qty: z.number().int().positive().optional(),
    override: z.coerce.number().positive().nullable().optional(),
  })
  .strict()
  .refine((v) => v.qty !== undefined || v.override !== undefined, {
    message: 'Indique qty e/ou override.',
  });

export const listOrdersQuerySchema = z
  .object({
    status: OrderStatusEnum.optional(),
    customerId: z.string().min(1).optional(),
    take: z.coerce.number().int().min(1).max(100).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type OrderLineInput = z.infer<typeof orderLineInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type AddOrderLineInput = z.infer<typeof addOrderLineSchema>;
export type UpdateOrderLineInput = z.infer<typeof updateOrderLineSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
