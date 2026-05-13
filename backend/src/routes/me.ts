import { fromNodeHeaders } from 'better-auth/node';
import { Router } from 'express';

import type { Auth } from '../auth/index.js';
import { UnauthorizedError } from '../shared/errors.js';

export function meRouter(auth: Auth): Router {
  const router = Router();

  router.get('/me', async (req, res, next) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      if (!session) throw new UnauthorizedError();
      res.json({
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
        session: { expiresAt: session.session.expiresAt },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
