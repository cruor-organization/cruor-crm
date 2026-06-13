/**
 * Repositório de embeddings (pgvector). Escritas/leituras de vetor em SQL cru
 * (template tags auto-parametrizadas, §9 "zero $queryRawUnsafe") porque a coluna
 * `embedding` é Unsupported no Prisma. Multi-tenant: organizationId em tudo.
 */
import { prisma } from '../../db/index.js';

export type EmbeddingSourceType = 'PRODUCT' | 'PRODUCT_VISUAL' | 'MEETING' | 'KB_ARTICLE' | 'COMPETITOR';

export interface SimilarChunk {
  sourceId: string;
  content: string;
  similarity: number;
}

/** Serializa um vetor para o literal pgvector (`[a,b,c]`). */
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export const embeddingsRepository = {
  /** Upsert por (organizationId, sourceType, sourceId, chunkIndex). */
  async upsert(params: {
    organizationId: string;
    sourceType: EmbeddingSourceType;
    sourceId: string;
    chunkIndex: number;
    content: string;
    embedding: number[];
    metadata?: unknown;
  }): Promise<void> {
    const vec = toVectorLiteral(params.embedding);
    const meta = params.metadata == null ? null : JSON.stringify(params.metadata);
    await prisma.$executeRaw`
      INSERT INTO "embedding" ("id", "organizationId", "sourceType", "sourceId", "chunkIndex", "content", "embedding", "metadata", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${params.organizationId}, ${params.sourceType}::"EmbeddingSourceType", ${params.sourceId}, ${params.chunkIndex}, ${params.content}, ${vec}::vector, ${meta}::jsonb, now(), now())
      ON CONFLICT ("organizationId", "sourceType", "sourceId", "chunkIndex")
      DO UPDATE SET "content" = EXCLUDED."content", "embedding" = EXCLUDED."embedding", "metadata" = EXCLUDED."metadata", "updatedAt" = now()
    `;
  },

  /** Similarity search por cosseno (HNSW). Devolve top-N escopado à org + tipo. */
  similaritySearch(params: {
    organizationId: string;
    sourceType: EmbeddingSourceType;
    queryEmbedding: number[];
    limit: number;
  }): Promise<SimilarChunk[]> {
    const vec = toVectorLiteral(params.queryEmbedding);
    return prisma.$queryRaw<SimilarChunk[]>`
      SELECT "sourceId", "content", 1 - ("embedding" <=> ${vec}::vector) AS "similarity"
      FROM "embedding"
      WHERE "organizationId" = ${params.organizationId}
        AND "sourceType" = ${params.sourceType}::"EmbeddingSourceType"
        AND "embedding" IS NOT NULL
      ORDER BY "embedding" <=> ${vec}::vector
      LIMIT ${params.limit}
    `;
  },
};
