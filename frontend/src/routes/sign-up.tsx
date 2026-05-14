import { zodResolver } from '@hookform/resolvers/zod';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <h1 className="text-2xl font-semibold">Criar primeira conta</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Só uma conta pode ser criada por este formulário. Esta conta fica como{' '}
        <strong>OWNER</strong> da organização. Membros adicionais entram por convite.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Nome</span>
          <input
            type="text"
            autoComplete="name"
            {...register('name')}
            className="rounded-control border border-neutral-200 px-3 py-2"
          />
          {formState.errors.name && (
            <span className="text-xs text-red-600">{formState.errors.name.message}</span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            className="rounded-control border border-neutral-200 px-3 py-2"
          />
          {formState.errors.email && (
            <span className="text-xs text-red-600">{formState.errors.email.message}</span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Password (mín. 12)</span>
          <input
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className="rounded-control border border-neutral-200 px-3 py-2"
          />
          {formState.errors.password && (
            <span className="text-xs text-red-600">{formState.errors.password.message}</span>
          )}
        </label>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {formState.isSubmitting ? 'A criar...' : 'Criar conta'}
        </button>
      </form>
      <p className="mt-4 text-sm text-neutral-600">
        Já tens conta?{' '}
        <Link to="/sign-in" className="underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
