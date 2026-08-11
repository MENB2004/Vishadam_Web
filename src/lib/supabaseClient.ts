import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    'Supabase environment variables are missing. Running in local-fallback mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env.local file to enable the backend.'
  );
}

/**
 * Creates a no-op client that mimics the Supabase query/channel builder chains.
 * Any method call returns a callable that resolves to `{ data: null, error: null }`,
 * so existing `await supabase.from(...)...` call sites never throw and callers
 * can fall back to mock data.
 */
function createNoopSupabase(): unknown {
  const proxy: any = new Proxy(
    () => proxy,
    {
      get(_target, prop) {
        // Make the chain awaitable: `await supabase.from(...)...` resolves cleanly.
        if (prop === 'then') {
          return (resolve: (value: unknown) => void) => resolve({ data: null, error: null });
        }
        return proxy;
      },
      apply() {
        return proxy;
      },
    }
  );

  return proxy;
}

export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (createNoopSupabase() as unknown as SupabaseClient);

export { isConfigured };
