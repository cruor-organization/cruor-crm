/**
 * Portas de IA (§10.8). Espelha o padrão invoice-provider: interface + impl
 * mock/live selecionada por env. O ai-service é stateless: não toca na DB.
 */

/** Eventos SSE do §10.8 few-shot 3. */
export type AgentEvent =
  | { type: 'token'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; name: string; output: unknown }
  | { type: 'product_card'; product: unknown }
  | { type: 'customer_card'; customer: unknown }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface ToolSpec {
  name: string;
  description: string;
  /** JSON Schema dos parâmetros (formato OpenAI function calling). */
  parameters: Record<string, unknown>;
}

/** Executa uma tool de domínio (chama o backend via HMAC). */
export type ToolExecutor = (name: string, input: unknown) => Promise<unknown>;

export interface ChatTurnInput {
  orgId: string;
  orgName: string;
  currentMonth: number;
  nextEvent?: string | undefined;
  /** Chunks recuperados por similaridade (RAG), já escopados à org. */
  retrievedChunks: string[];
  history: { role: 'user' | 'assistant'; content: string }[];
  userMessage: string;
}

export interface EmbeddingsProvider {
  readonly name: string;
  /** Devolve um vetor por texto (mesma ordem). Dim = 1536 (text-embedding-3-small). */
  embed(texts: string[]): Promise<number[][]>;
}

export interface ChatProvider {
  readonly name: string;
  /**
   * Corre um turno do agente, emitindo eventos via `emit`. Pode chamar tools
   * read-only via `exec`. Não persiste nada (o backend persiste).
   */
  streamTurn(
    input: ChatTurnInput,
    tools: ToolSpec[],
    exec: ToolExecutor,
    emit: (e: AgentEvent) => void,
  ): Promise<void>;
}

export interface AiProviders {
  readonly mode: 'mock' | 'live';
  embeddings: EmbeddingsProvider;
  chat: ChatProvider;
}
