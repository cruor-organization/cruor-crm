/**
 * Script one-off — redefine a password de um user pelo email.
 * Reutiliza o hasher do Better Auth (auth.$context) para garantir que o
 * formato scrypt bate certo com o que o login usa na verificação.
 *
 * Uso: tsx scripts/reset-owner-password.ts <email> <nova-password>
 */
import 'dotenv/config';

import { createAuth } from '../src/auth/server.js';

async function main(): Promise<void> {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    throw new Error('Uso: tsx scripts/reset-owner-password.ts <email> <password>');
  }

  const auth = createAuth({
    betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? '',
    betterAuthUrl: process.env.BETTER_AUTH_URL ?? '',
    frontendUrl: process.env.FRONTEND_URL ?? '',
  });

  const ctx = await auth.$context;

  const user = await ctx.internalAdapter.findUserByEmail(email);
  if (!user) {
    throw new Error(`User não encontrado: ${email}`);
  }

  const hash = await ctx.password.hash(password);
  await ctx.internalAdapter.updatePassword(user.user.id, hash);

  console.log(`Password redefinida para ${email} (id ${user.user.id}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
