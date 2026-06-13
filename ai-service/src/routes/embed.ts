/**
 * POST /embed (HMAC) — gera embeddings para 1..N textos.
 * Usado pelo backend na ingestão de produtos e na codificação da query (RAG).
 */
import { Router } from 'express';
import { z } from 'zod';

import type { AiProviders } from '../providers/types.js';

const bodySchema = z
  .object({
    texts: z.array(z.string().min(1)).min(1).max(200),
  })
  .strict();

export function embedRouter(providers: AiProviders): Router {
  const router = Router();

  router.post('/embed', (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'VALIDATION', message: 'Body inválido para /embed.' });
      return;
    }
    providers.embeddings
      .embed(parsed.data.texts)
      .then((vectors) => res.json({ vectors, model: providers.embeddings.name }))
      .catch((err: unknown) => {
        res
          .status(502)
          .json({ code: 'EMBED_FAILED', message: err instanceof Error ? err.message : 'embed falhou' });
      });
  });

  return router;
}
