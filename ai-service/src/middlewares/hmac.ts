/**
 * Middleware de verificação HMAC para rotas internas do ai-service.
 * Requer que o body raw esteja capturado em `req.rawBody` (ver express.json verify).
 */
import type { NextFunction, Request, Response } from 'express';

import { verify } from '../security/hmac.js';

export function requireHmac(secret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = verify(
      secret,
      req.header('x-ai-timestamp'),
      req.header('x-ai-signature'),
      req.rawBody ?? '',
    );
    if (!result.ok) {
      res.status(401).json({ code: 'INVALID_HMAC', message: `Assinatura inválida (${result.reason}).` });
      return;
    }
    next();
  };
}
