import { adminClient, organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const baseURL =
  import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.host}`;

export const authClient = createAuthClient({
  baseURL,
  plugins: [organizationClient(), adminClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
