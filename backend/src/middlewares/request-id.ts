import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestId() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const incoming = req.header(REQUEST_ID_HEADER);
    const id = incoming && /^[\w-]{8,128}$/.test(incoming) ? incoming : randomUUID();
    req.headers[REQUEST_ID_HEADER] = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
  };
}
