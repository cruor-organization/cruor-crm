import { z } from 'zod';

export const listAuditQuerySchema = z
  .object({
    entityType: z.string().min(1).max(80),
    entityId: z.string().min(1).max(100),
    take: z.coerce.number().int().min(1).max(200).default(50),
    skip: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>;
