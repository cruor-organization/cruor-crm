/**
 * Rotas do chatbot RAG (§10.8). Conversations CRUD + endpoint SSE que orquestra:
 * persiste msg do user → retrieval (embeddings) → stream do ai-service → relay
 * para o frontend → persiste resposta. LLM read-only por default (sem mutações).
 */
import type { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import type { AiServiceClient } from '../../clients/ai-service.client.js';
import { prisma } from '../../db/index.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { getCtx, requireAuth } from '../../middlewares/auth-context.js';
import { NotFoundError } from '../../shared/errors.js';
import type { EmbeddingsService } from '../embeddings/embeddings.service.js';

import { chatbotRepository } from './chatbot.repository.js';

const createConversationSchema = z.object({ title: z.string().max(200).optional() }).strict();
const postMessageSchema = z.object({ content: z.string().min(1).max(4000) }).strict();

const HISTORY_LIMIT = 20;
const RETRIEVE_K = 6;

interface ChatbotDeps {
  embeddings: EmbeddingsService;
  ai: AiServiceClient;
}

/** Parser de eventos SSE (`data: <json>\n\n`) do stream do ai-service. */
async function* parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<Record<string, unknown>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const line = block.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      try {
        yield JSON.parse(json) as Record<string, unknown>;
      } catch {
        /* ignora frames malformados */
      }
    }
  }
}

export function chatbotRouter(deps: ChatbotDeps): Router {
  const router = Router();
  router.use(requireAuth());

  router.get(
    '/conversations',
    asyncHandler(async (req, res) => {
      const ctx = getCtx(req);
      res.json(await chatbotRepository.listConversations(ctx.orgId, ctx.actorId));
    }),
  );

  router.post(
    '/conversations',
    asyncHandler(async (req, res) => {
      const ctx = getCtx(req);
      const { title } = createConversationSchema.parse(req.body);
      res.status(201).json(await chatbotRepository.createConversation(ctx.orgId, ctx.actorId, title ?? null));
    }),
  );

  router.get(
    '/conversations/:id',
    asyncHandler(async (req, res) => {
      const ctx = getCtx(req);
      const conv = await chatbotRepository.getConversation(ctx.orgId, req.params.id ?? '');
      if (!conv) throw new NotFoundError('CONVERSATION_NOT_FOUND');
      const messages = await chatbotRepository.getMessages(conv.id);
      res.json({ ...conv, messages });
    }),
  );

  // SSE: envia uma mensagem e faz stream da resposta do agente.
  router.post(
    '/conversations/:id/messages',
    asyncHandler(async (req, res) => {
      const ctx = getCtx(req);
      const { content } = postMessageSchema.parse(req.body);

      const conv = await chatbotRepository.getConversation(ctx.orgId, req.params.id ?? '');
      if (!conv) throw new NotFoundError('CONVERSATION_NOT_FOUND');

      // 1. persiste a mensagem do utilizador (+ título se for a primeira).
      await chatbotRepository.addMessage({
        organizationId: ctx.orgId,
        conversationId: conv.id,
        role: 'user',
        content,
      });
      if (!conv.title) await chatbotRepository.touch(conv.id, content.slice(0, 80));

      // 2. histórico + retrieval (RAG) escopados à org.
      const priorMessages = await chatbotRepository.getMessages(conv.id);
      const history = priorMessages
        .slice(-HISTORY_LIMIT - 1, -1)
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const chunks = await deps.embeddings.retrieveProductChunks(ctx.orgId, content, RETRIEVE_K);

      const org = await prisma.organization.findUnique({
        where: { id: ctx.orgId },
        select: { name: true },
      });

      // 3. SSE para o cliente.
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      const send = (e: Record<string, unknown>): void => {
        res.write(`data: ${JSON.stringify(e)}\n\n`);
      };

      // 4. abre o stream do ai-service e faz relay + acumula a resposta.
      let assistantText = '';
      const toolCalls: { id: string; name: string; input: unknown; output?: unknown }[] = [];
      try {
        const upstream = await deps.ai.chatStream({
          orgId: ctx.orgId,
          orgName: org?.name ?? 'a empresa',
          currentMonth: new Date().getUTCMonth() + 1,
          retrievedChunks: chunks.map((c) => c.content),
          history,
          userMessage: content,
        });
        if (!upstream.ok || !upstream.body) {
          send({ type: 'error', message: `ai-service respondeu ${upstream.status}` });
          res.end();
          return;
        }

        for await (const event of parseSse(upstream.body)) {
          send(event);
          const type = event.type;
          if (type === 'token' && typeof event.text === 'string') {
            assistantText += event.text;
          } else if (type === 'tool_call') {
            toolCalls.push({
              id: String(event.id),
              name: String(event.name),
              input: event.input,
            });
          } else if (type === 'tool_result') {
            const tc = toolCalls.find((t) => t.id === String(event.id));
            if (tc) tc.output = event.output;
          }
        }
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'erro no agente' });
      }

      // 5. persiste a resposta do assistente.
      await chatbotRepository.addMessage({
        organizationId: ctx.orgId,
        conversationId: conv.id,
        role: 'assistant',
        content: assistantText,
        ...(toolCalls.length ? { toolCalls: toolCalls as unknown as Prisma.InputJsonValue } : {}),
      });
      await chatbotRepository.touch(conv.id);
      res.end();
    }),
  );

  return router;
}
