/**
 * Verificação HMAC para rotas internas (ai-service → backend). Máquina-a-máquina,
 * sem sessão Better Auth. Requer req.rawBody capturado no express.json verify.
 */
import type { NextFunction, Request, Response } from 'express';

import { verify } from '../security/hmac.js';

export function requireBackendHmac(secret: string) {
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
