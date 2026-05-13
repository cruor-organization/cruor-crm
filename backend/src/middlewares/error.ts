import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError, isAppError } from '../shared/errors.js';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export function errorHandler() {
  return (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const requestId = res.getHeader('x-request-id');
    const reqIdStr = typeof requestId === 'string' ? requestId : undefined;

    if (isAppError(err)) {
      const body: ErrorBody = { ...err.toJSON(), ...(reqIdStr ? { requestId: reqIdStr } : {}) };
      req.log?.warn({ err }, 'app error');
      res.status(err.httpStatus).json(body);
      return;
    }

    if (err instanceof ZodError) {
      const body: ErrorBody = {
        code: 'VALIDATION_ERROR',
        message: 'Pedido inválido.',
        details: err.flatten(),
        ...(reqIdStr ? { requestId: reqIdStr } : {}),
      };
      res.status(400).json(body);
      return;
    }

    const message = err instanceof Error ? err.message : String(err);
    req.log?.error({ err }, 'unhandled error');
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Erro interno.' : message,
      ...(reqIdStr ? { requestId: reqIdStr } : {}),
    } satisfies ErrorBody);
  };
}

// Re-export tipo para conveniência
export { AppError };
