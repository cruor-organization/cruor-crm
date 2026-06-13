/**
 * Serviço de embeddings (§10.6/§10.8). Ingestão síncrona de produtos (sem fila
 * nesta fase — ver plano slice 1) + retrieval para o RAG. O ai-service gera os
 * vetores (OpenAI text-embedding-3-small); o backend é dono do vector store.
 */
import type { Product } from '@prisma/client';

import type { AiServiceClient } from '../../clients/ai-service.client.js';
import { prisma } from '../../db/index.js';
import type { AuthContext } from '../../middlewares/auth-context.js';

import { embeddingsRepository, type SimilarChunk } from './embeddings.repository.js';

const EMBED_BATCH = 100;

/** Texto a embedar para um produto (campos pesquisáveis, sem PII). */
export function productEmbeddingText(p: Product): string {
  const parts = [
    p.name,
    `Categoria: ${p.category}${p.subcategory ? ` / ${p.subcategory}` : ''}`,
    p.shortDescription ?? p.description ?? '',
    p.materialPrimary ? `Material: ${p.materialPrimary}` : '',
    p.botanicalName ? `Nome botânico: ${p.botanicalName}` : '',
    p.dominantColor ? `Cor: ${p.dominantColor}` : '',
    p.seasonality.length ? `Sazonalidade: ${p.seasonality.join(', ')}` : '',
  ];
  return parts.filter(Boolean).join('. ');
}

export interface EmbeddingsService {
  ingestProduct(organizationId: string, product: Product): Promise<void>;
  backfillProducts(ctx: AuthContext): Promise<{ count: number }>;
  retrieveProductChunks(organizationId: string, query: string, limit: number): Promise<SimilarChunk[]>;
}

export function makeEmbeddingsService(ai: AiServiceClient): EmbeddingsService {
  return {
    async ingestProduct(organizationId: string, product: Product): Promise<void> {
      const text = productEmbeddingText(product);
      const [embedding] = await ai.embed([text]);
      if (!embedding) return;
      await embeddingsRepository.upsert({
        organizationId,
        sourceType: 'PRODUCT',
        sourceId: product.id,
        chunkIndex: 0,
        content: text,
        embedding,
        metadata: { sku: product.sku },
      });
    },

    async backfillProducts(ctx: AuthContext): Promise<{ count: number }> {
      const products = await prisma.product.findMany({
        where: { organizationId: ctx.orgId, status: 'ACTIVE', deletedAt: null },
      });
      let count = 0;
      for (let i = 0; i < products.length; i += EMBED_BATCH) {
        const batch = products.slice(i, i + EMBED_BATCH);
        const texts = batch.map(productEmbeddingText);
        const vectors = await ai.embed(texts);
        for (let j = 0; j < batch.length; j++) {
          const product = batch[j];
          const embedding = vectors[j];
          if (!product || !embedding) continue;
          await embeddingsRepository.upsert({
            organizationId: ctx.orgId,
            sourceType: 'PRODUCT',
            sourceId: product.id,
            chunkIndex: 0,
            content: texts[j] ?? '',
            embedding,
            metadata: { sku: product.sku },
          });
          count++;
        }
      }
      return { count };
    },

    async retrieveProductChunks(
      organizationId: string,
      query: string,
      limit: number,
    ): Promise<SimilarChunk[]> {
      const [queryEmbedding] = await ai.embed([query]);
      if (!queryEmbedding) return [];
      return embeddingsRepository.similaritySearch({
        organizationId,
        sourceType: 'PRODUCT',
        queryEmbedding,
        limit,
      });
    },
  };
}
