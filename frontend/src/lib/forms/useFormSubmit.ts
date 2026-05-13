import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { UseFormReturn, FieldValues, FieldPath } from 'react-hook-form';

import type { ApiError } from '@/lib/api';

interface UseFormSubmitOptions<TOutput> {
  onSuccess?: (out: TOutput) => void;
  invalidateKeys?: unknown[][];
}

interface UseFormSubmitResult<TInput extends FieldValues> {
  submit: (data: TInput) => Promise<void>;
  isLoading: boolean;
  generalError: string | null;
}

export function useFormSubmit<TInput extends FieldValues, TOutput>(
  form: UseFormReturn<TInput>,
  mutationFn: (data: TInput) => Promise<TOutput>,
  options?: UseFormSubmitOptions<TOutput>,
): UseFormSubmitResult<TInput> {
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const submit = async (data: TInput) => {
    setIsLoading(true);
    setGeneralError(null);
    try {
      const out = await mutationFn(data);
      if (options?.invalidateKeys) {
        await Promise.all(
          options.invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
        );
      }
      options?.onSuccess?.(out);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.code === 'VALIDATION' && apiErr?.details && typeof apiErr.details === 'object') {
        const details = apiErr.details as Record<string, string>;
        let hasFieldErrors = false;
        for (const [field, msg] of Object.entries(details)) {
          form.setError(field as FieldPath<TInput>, { message: msg });
          hasFieldErrors = true;
        }
        if (!hasFieldErrors) {
          setGeneralError(apiErr.message ?? 'Erro de validação.');
        }
      } else {
        setGeneralError(apiErr?.message ?? 'Erro inesperado. Tenta novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { submit, isLoading, generalError };
}
