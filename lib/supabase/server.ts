import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

// Service-role client for server-side operations (bypasses RLS)
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Safe query helper — returns empty array instead of throwing
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>
): Promise<T | null> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.warn('[Supabase] Query error (check .env.local):', error);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('[Supabase] Connection error (check .env.local):', e);
    return null;
  }
}
