/**
 * POST /chat/stream (HMAC, SSE) — corre um turno do agente RAG read-only (§10.8).
 * Emite eventos: token, tool_call, tool_result, product_card, customer_card, done, error.
 * As tools batem de volta no backend (HMAC) com o orgId fornecido.
 */
import { Router } from 'express';
import { z } from 'zod';

import { TOOL_SPECS } from '../agents/tools.js';
import type { BackendToolsClient } from '../clients/backend-tools.client.js';
import type { AgentEvent, AiProviders, ChatTurnInput } from '../providers/types.js';

const bodySchema = z
  .object({
    orgId: z.string().min(1),
    orgName: z.string().min(1),
    currentMonth: z.number().int().min(1).max(12),
    nextEvent: z.string().optional(),
    retrievedChunks: z.array(z.string()).max(50).default([]),
    history: z
      .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }).strict())
      .max(50)
      .default([]),
    userMessage: z.string().min(1),
  })
  .strict();

export function chatRouter(providers: AiProviders, tools: BackendToolsClient): Router {
  const router = Router();

  router.post('/chat/stream', (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'VALIDATION', message: 'Body inválido para /chat/stream.' });
      return;
    }
    const input: ChatTurnInput = parsed.data;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });

    const emit = (e: AgentEvent): void => {
      res.write(`data: ${JSON.stringify(e)}\n\n`);
    };
    const exec = (name: string, toolInput: unknown): Promise<unknown> =>
      tools.callTool(input.orgId, name, toolInput);

    providers.chat
      .streamTurn(input, TOOL_SPECS, exec, emit)
      .catch((err: unknown) => {
        emit({ type: 'error', message: err instanceof Error ? err.message : 'erro no agente' });
      })
      .finally(() => res.end());
  });

  return router;
}
