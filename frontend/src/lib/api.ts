/**
 * Cliente HTTP minimal para o backend.
 * Inclui credentials (cookie Better Auth) e parseia erros AppError.
 */
const BASE = import.meta.env.VITE_API_URL ?? '';

export interface ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  requestId?: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(
      (body as { message?: string } | null)?.message ?? res.statusText,
    ) as ApiError;
    err.code = (body as { code?: string } | null)?.code ?? 'HTTP_ERROR';
    err.status = res.status;
    err.details = (body as { details?: unknown } | null)?.details;
    err.requestId = (body as { requestId?: string } | null)?.requestId;
    throw err;
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
