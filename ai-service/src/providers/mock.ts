/**
 * Providers mock — determinísticos, sem API keys nem custo. Usados em CI/E2E.
 * Embeddings: vetor 1536 derivado por hash do texto (estável → similaridade
 * reproduzível). Chat: script que chama searchProducts uma vez e responde.
 */
import { createHash } from 'node:crypto';

import { isToolName, toolInputSchemas } from '../agents/tools.js';

import type {
  AgentEvent,
  ChatProvider,
  ChatTurnInput,
  EmbeddingsProvider,
  ToolExecutor,
  ToolSpec,
} from './types.js';

const DIM = 1536;

/** Vetor unitário determinístico a partir do texto. */
function hashVector(text: string): number[] {
  const seed = createHash('sha256').update(text).digest();
  const v = new Array<number>(DIM);
  let norm = 0;
  for (let i = 0; i < DIM; i++) {
    // mistura o byte do digest com o índice → componente em [-1, 1]
    const byte = seed[i % seed.length] ?? 0;
    const x = Math.sin((byte + 1) * (i + 1) * 0.0001) ;
    v[i] = x;
    norm += x * x;
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < DIM; i++) v[i] = (v[i]!) / norm;
  return v;
}

export const mockEmbeddings: EmbeddingsProvider = {
  name: 'mock',
  embed(texts: string[]): Promise<number[][]> {
    return Promise.resolve(texts.map(hashVector));
  },
};

export const mockChat: ChatProvider = {
  name: 'mock',
  async streamTurn(
    input: ChatTurnInput,
    _tools: ToolSpec[],
    exec: ToolExecutor,
    emit: (e: AgentEvent) => void,
  ): Promise<void> {
    // Script determinístico: chama searchProducts com a mensagem do utilizador.
    const toolName = 'searchProducts';
    const rawInput = { query: input.userMessage, limit: 8 };
    if (!isToolName(toolName)) {
      emit({ type: 'error', message: 'Tool desconhecida no mock.' });
      return;
    }
    const parsed = toolInputSchemas[toolName].safeParse(rawInput);
    if (!parsed.success) {
      emit({ type: 'error', message: 'Input de tool inválido no mock.' });
      return;
    }

    const callId = 'mock-call-1';
    emit({ type: 'tool_call', id: callId, name: toolName, input: parsed.data });

    let output: unknown;
    try {
      output = await exec(toolName, parsed.data);
    } catch (err) {
      emit({ type: 'error', message: err instanceof Error ? err.message : 'Falha na tool.' });
      return;
    }
    emit({ type: 'tool_result', id: callId, name: toolName, output });

    // Se houver produtos, emite um product_card (structured event) do primeiro.
    const items = Array.isArray((output as { items?: unknown[] })?.items)
      ? (output as { items: unknown[] }).items
      : [];
    if (items.length > 0) {
      emit({ type: 'product_card', product: items[0] });
    }

    // Resposta scriptada em "tokens" (palavras) — exercita o caminho de streaming.
    const answer =
      items.length > 0
        ? `Encontrei ${items.length} produto(s) para "${input.userMessage}". Vê o cartão acima para detalhes de stock e PVP.`
        : `Não encontrei produtos para "${input.userMessage}". Queres que procure por outra designação?`;
    for (const word of answer.split(' ')) {
      emit({ type: 'token', text: word + ' ' });
    }
    emit({ type: 'done' });
  },
};
