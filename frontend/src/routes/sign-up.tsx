// frontend/src/routes/sign-up.tsx
//
// Ecrã de criação da primeira conta — usa a moldura escura partilhada
// (AuthLayout). Só uma conta pode ser criada por aqui; fica como OWNER da
// organização. Corre fora do AppShell.
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ACCENT, AuthLayout, inputCls } from '@/components/auth/auth-layout';
import { signUp } from '@/lib/auth-client';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres.').max(80),
  email: z.string().email('Email inválido.'),
  password: z.string().min(12, 'Password mínimo 12 caracteres.').max(128),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute('/sign-up')({
  component: SignUp,
});

const FRIENDLY_MESSAGES: Record<string, string> = {
  SIGNUP_DISABLED:
    'O signup está desativado. Pede um convite a um administrador (disponível a partir da Fase 1).',
};

function SignUp() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const res = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (res.error) {
      const code = res.error.code ?? '';
      setServerError(FRIENDLY_MESSAGES[code] ?? res.error.message ?? 'Erro inesperado.');
      return;
    }
    void navigate({ to: '/' });
  });

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-white/[0.07] bg-[#141416] p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Primeiro acesso
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Criar primeira conta
        </h1>
        <p className="mt-1 text-sm text-white/45">
          Só uma conta pode ser criada por este formulário.
        </p>

        {/* Nota — esta conta fica como OWNER da organização */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[13px] leading-relaxed text-white/45">
          Esta conta fica como{' '}
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/70">
            Owner
          </span>{' '}
          da organização. Membros adicionais entram por convite.
        </div>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="name"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40"
            >
              Nome
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="O teu nome"
              className={inputCls}
              {...register('name')}
            />
            {formState.errors.name && (
              <span className="text-xs" style={{ color: ACCENT }}>
                {formState.errors.name.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nome@exemplo.pt"
              className={inputCls}
              {...register('email')}
            />
            {formState.errors.email && (
              <span className="text-xs" style={{ color: ACCENT }}>
                {formState.errors.email.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40"
            >
              Password
              <span className="ml-2 normal-case tracking-normal text-white/25">
                mín. 12 caracteres
              </span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••••••"
                className={`${inputCls} pr-11`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Esconder password' : 'Mostrar password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70"
              >
                {showPassword ? (
                  <EyeOff className="size-[18px]" />
                ) : (
                  <Eye className="size-[18px]" />
                )}
              </button>
            </div>
            {formState.errors.password && (
              <span className="text-xs" style={{ color: ACCENT }}>
                {formState.errors.password.message}
              </span>
            )}
          </div>

          {serverError && (
            <div
              className="rounded-xl border px-3.5 py-2.5 text-sm"
              style={{
                color: ACCENT,
                borderColor: `${ACCENT}40`,
                backgroundColor: `${ACCENT}14`,
              }}
            >
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={formState.isSubmitting}
            className="group mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
            style={{ backgroundColor: ACCENT }}
          >
            {formState.isSubmitting ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                A criar...
              </>
            ) : (
              <>
                Criar conta
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-white/40">
        Já tens conta?{' '}
        <Link
          to="/sign-in"
          className="font-medium text-white transition-colors hover:text-[color:var(--accent)]"
        >
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
