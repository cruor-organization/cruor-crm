// backend/src/modules/alibaba/alibaba.schemas.ts
import { z } from 'zod';

export const listAlibabaQuerySchema = z
  .object({
    status: z
      .enum(['PLACED', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'])
      .optional(),
    take: z.coerce.number().int().min(1).max(200).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type ListAlibabaQuery = z.infer<typeof listAlibabaQuerySchema>;
