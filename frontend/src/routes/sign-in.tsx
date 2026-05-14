// frontend/src/routes/sign-in.tsx
//
// Ecrã de login — usa a moldura partilhada (AuthLayout), alinhada com o hub do
// ecossistema ('/'). Segue o tema global claro/escuro. Corre fora do AppShell.
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowUpRight, Check, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ACCENT, AuthLayout, inputCls } from '@/components/auth/auth-layout';
import { signIn } from '@/lib/auth-client';

const schema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'Password obrigatória.'),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute('/sign-in')({
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const res = await signIn.email({ email: values.email, password: values.password });
    if (res.error) {
      setServerError(res.error.message ?? 'Credenciais inválidas.');
      return;
    }
    void navigate({ to: '/' });
  });

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-neutral-200 bg-surface p-8 shadow-card">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Acesso</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
          Bem-vindo de volta
        </h1>
        <p className="mt-1 text-sm text-neutral-600">Introduz as tuas credenciais para entrar.</p>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500"
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
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${inputCls} pr-11`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Esconder password' : 'Mostrar password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
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

          <div className="flex items-center justify-between">
            <label className="group flex cursor-pointer select-none items-center gap-2.5">
              <input type="checkbox" name="remember" className="peer sr-only" />
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-md border border-neutral-300 bg-neutral-100 transition-colors peer-checked:border-[color:var(--accent)] peer-checked:bg-[color:var(--accent)] peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--accent)]/40">
                <Check className="size-3 text-white opacity-0 transition-opacity" strokeWidth={3} />
              </span>
              <span className="text-[13px] text-neutral-600 transition-colors group-hover:text-neutral-800">
                Manter sessão iniciada
              </span>
            </label>
            {/* TODO(auth): rota de recuperação de password */}
            <a
              href="#"
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-neutral-800"
            >
              Recuperar
            </a>
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
                A entrar...
              </>
            ) : (
              <>
                Entrar
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Ainda não tens conta?{' '}
        <Link
          to="/sign-up"
          className="font-medium text-neutral-900 transition-colors hover:text-[color:var(--accent)]"
        >
          Criar primeira conta
        </Link>
      </p>
    </AuthLayout>
  );
}
