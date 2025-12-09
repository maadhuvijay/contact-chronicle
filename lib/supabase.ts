import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // If env vars are missing, throw a clear error
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = 'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in your environment variables.';
    console.error('Supabase initialization error:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl,
      keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'missing'
    });
    throw new Error(errorMessage);
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}

// Export the Supabase client
// Initialize it lazily on first access
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    
    // If it's a function, bind it to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  },
  has(_target, prop) {
    try {
      const client = getSupabaseClient();
      return prop in client;
    } catch {
      return false;
    }
  },
  ownKeys(_target) {
    try {
      const client = getSupabaseClient();
      return Object.keys(client);
    } catch {
      return [];
    }
  },
  getOwnPropertyDescriptor(_target, prop) {
    try {
      const client = getSupabaseClient();
      return Object.getOwnPropertyDescriptor(client, prop);
    } catch {
      return {
        enumerable: true,
        configurable: true,
        value: undefined,
      };
    }
  },
});
