/**
 * Express 4 não propaga promise rejections automaticamente. Sem este wrapper
 * uma exceção num controller async causa "unhandledRejection" e o middleware
 * de erro não corre.
 *
 * Express 5 (ainda RC) elimina isto. Quando migramos podemos remover este file.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(handler: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
