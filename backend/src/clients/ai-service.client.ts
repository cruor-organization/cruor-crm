/**
 * Cliente backend → ai-service (§10.8), HMAC. Dois usos:
 *  - embed(): vetores para ingestão de produtos e codificação da query (RAG).
 *  - chatStream(): abre o SSE do agente; o caller faz relay para o frontend.
 */
import { signedHeaders } from '../security/hmac.js';
import { IntegrationError } from '../shared/errors.js';

export interface ChatStreamInput {
  orgId: string;
  orgName: string;
  currentMonth: number;
  nextEvent?: string;
  retrievedChunks: string[];
  history: { role: 'user' | 'assistant'; content: string }[];
  userMessage: string;
}

export interface AiServiceClient {
  embed(texts: string[]): Promise<number[][]>;
  /** Devolve a Response SSE crua para relay (body é um ReadableStream). */
  chatStream(input: ChatStreamInput): Promise<Response>;
}

export function makeAiServiceClient(baseUrl: string, secret: string): AiServiceClient {
  async function post(path: string, payload: unknown): Promise<Response> {
    const body = JSON.stringify(payload);
    let res: Response;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: signedHeaders(secret, body),
        body,
      });
    } catch (err) {
      throw new IntegrationError(
        'AI_SERVICE_UNREACHABLE',
        err instanceof Error ? err.message : 'ai-service inacessível',
      );
    }
    return res;
  }

  return {
    async embed(texts: string[]): Promise<number[][]> {
      const res = await post('/embed', { texts });
      if (!res.ok) {
        throw new IntegrationError('AI_EMBED_FAILED', `embed falhou (${res.status})`);
      }
      const json = (await res.json()) as { vectors: number[][] };
      return json.vectors;
    },

    chatStream(input: ChatStreamInput): Promise<Response> {
      return post('/chat/stream', input);
    },
  };
}
