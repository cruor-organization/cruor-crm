/**
 * Better Auth — config do servidor.
 * §5 do prompt fixa Better Auth com organizations + admin + 2FA.
 * Em Fase 0 ligamos email+password + organization. 2FA TOTP entra em Fase 1
 * juntamente com RBAC (§8) e admin plugin propriamente integrado.
 */
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, organization } from 'better-auth/plugins';

import { prisma } from '../db/index.js';

import { signupGateAfter, signupGateBefore } from './signup-gate.js';

export interface AuthEnv {
  betterAuthSecret: string;
  betterAuthUrl: string;
  frontendUrl: string;
  trustedOrigins?: string[];
}

export function createAuth(env: AuthEnv) {
  return betterAuth({
    appName: 'CRM Florista B2B',
    secret: env.betterAuthSecret,
    baseURL: env.betterAuthUrl,
    trustedOrigins: env.trustedOrigins ?? [env.frontendUrl],

    database: prismaAdapter(prisma, { provider: 'postgresql' }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7d
      updateAge: 60 * 60 * 24, // refresh 1x/dia
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },

    plugins: [
      organization({
        allowUserToCreateOrganization: false,
      }),
      admin(),
    ],

    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            await signupGateBefore();
            return { data: user };
          },
          after: async (user) => {
            await signupGateAfter(user);
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
