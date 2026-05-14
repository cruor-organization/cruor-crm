import { zodResolver } from '@hookform/resolvers/zod';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-8">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
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
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            autoComplete="current-password"
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
          {formState.isSubmitting ? 'A entrar...' : 'Entrar'}
        </button>
      </form>
      <p className="mt-4 text-sm text-neutral-600">
        Sem conta?{' '}
        <Link to="/sign-up" className="underline">
          Criar primeira conta
        </Link>
      </p>
    </main>
  );
}
