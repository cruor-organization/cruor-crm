/**
 * Hook de ingestão de embeddings para produtos (§10.8). Injetado no boot
 * (app.ts) à semelhança de setInvoiceProvider. Best-effort: embeddings são um
 * índice derivado — uma falha aqui não pode bloquear o CRUD de produtos. O
 * wrapper instalado em app.ts faz o log (não há falha silenciosa).
 */
import type { Product } from '@prisma/client';

type ProductEmbeddingHook = (organizationId: string, product: Product) => Promise<void>;

let hook: ProductEmbeddingHook | null = null;

export function setProductEmbeddingHook(fn: ProductEmbeddingHook): void {
  hook = fn;
}

/** Dispara a ingestão sem bloquear nem propagar (fire-and-forget). */
export function onProductUpserted(organizationId: string, product: Product): void {
  if (!hook) return;
  void hook(organizationId, product);
}
