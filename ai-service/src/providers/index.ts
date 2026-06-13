/**
 * Fábrica de providers de IA — seleciona mock|live por env. Espelha
 * createInvoiceProvider / createAlibabaApi (injeção por composição, sem container).
 */
import type { AiEnv } from '../config/env.js';

import { mockChat, mockEmbeddings } from './mock.js';
import { makeOpenAiProviders } from './openai.js';
import type { AiProviders } from './types.js';

export function createAiProviders(env: AiEnv): AiProviders {
  if (env.AI_PROVIDER === 'live') {
    // env.ts já garante OPENAI_API_KEY presente quando live.
    const { embeddings, chat } = makeOpenAiProviders({
      apiKey: env.OPENAI_API_KEY!,
      chatModel: env.OPENAI_CHAT_MODEL,
      embeddingModel: env.OPENAI_EMBEDDING_MODEL,
    });
    return { mode: 'live', embeddings, chat };
  }
  return { mode: 'mock', embeddings: mockEmbeddings, chat: mockChat };
}
