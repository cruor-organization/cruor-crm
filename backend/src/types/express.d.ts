/**
 * Augmentação do tipo Express.Request com o AuthContext.
 * Não usa `import type` para que esta declaração seja tratada como ambient
 * (carregada pelo `include` do tsconfig sem precisar de side-effect import).
 */
import type { AppRole } from '../shared/rbac';

export {};

declare global {
  namespace Express {
    interface Request {
      ctx?: {
        actorId: string;
        email: string;
        orgId: string;
        role: AppRole;
      };
    }
  }
}
