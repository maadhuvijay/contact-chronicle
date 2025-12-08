import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// Export a Proxy that lazily initializes the Supabase client
// This allows the module to be imported during build without throwing errors
// The client is only created when actually accessed at runtime
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, _receiver) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
  has(_target, prop) {
    const client = getSupabaseClient();
    return prop in client;
  },
  ownKeys(_target) {
    const client = getSupabaseClient();
    return Object.keys(client);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const client = getSupabaseClient();
    const descriptor = Object.getOwnPropertyDescriptor(client, prop);
    return descriptor;
  },
});

