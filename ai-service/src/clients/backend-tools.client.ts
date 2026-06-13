/**
 * Cliente ai-service → backend para executar tools de domínio (HMAC).
 * O backend impõe multi-tenancy: o orgId vai no body e é validado lá.
 */
import { signedHeaders } from '../security/hmac.js';

export interface BackendToolsClient {
  callTool(orgId: string, name: string, input: unknown): Promise<unknown>;
}

export function makeBackendToolsClient(backendUrl: string, secret: string): BackendToolsClient {
  return {
    async callTool(orgId: string, name: string, input: unknown): Promise<unknown> {
      const body = JSON.stringify({ orgId, input });
      const res = await fetch(`${backendUrl}/internal/tools/${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: signedHeaders(secret, body),
        body,
      });
      const text = await res.text();
      const parsed: unknown = text ? JSON.parse(text) : null;
      if (!res.ok) {
        const message =
          (parsed as { message?: string } | null)?.message ?? `tool ${name} falhou (${res.status})`;
        throw new Error(message);
      }
      return parsed;
    },
  };
}
