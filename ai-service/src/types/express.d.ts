/**
 * Augmentação ambient do Express.Request com o body raw capturado para HMAC.
 * Padrão global (namespace Express) — robusto sob moduleResolution Bundler,
 * ao contrário de `declare module 'express-serve-static-core'` (espelha o backend).
 */
export {};

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}
