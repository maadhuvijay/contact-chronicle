import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, return null to indicate client is not available
  // The Proxy will handle this gracefully by returning no-ops that provide error messages
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// Helper to create a no-op query builder when Supabase is not configured
function createNoOpQueryBuilder() {
  const errorMessage = 'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.';
  return new Proxy({}, {
    get: () => () => Promise.resolve({ 
      data: null, 
      error: { 
        message: errorMessage,
        code: 'ENV_VARS_MISSING'
      } 
    }),
  });
}

// Export a Proxy that lazily initializes the Supabase client
// This allows the module to be imported during build without throwing errors
// The client is only created when actually accessed at runtime
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, _receiver) {
    const client = getSupabaseClient();
    
    // If client is null (build time or missing env vars), return safe no-ops
    if (!client) {
      // Return a no-op query builder for 'from' method
      if (prop === 'from') {
        return createNoOpQueryBuilder;
      }
      // Return no-op for other methods
      const errorMessage = 'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.';
      return () => Promise.resolve({ 
        data: null, 
        error: { 
          message: errorMessage,
          code: 'ENV_VARS_MISSING'
        } 
      });
    }
    
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
  has(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      return true; // Return true during build to prevent errors
    }
    return prop in client;
  },
  ownKeys(_target) {
    const client = getSupabaseClient();
    if (!client) {
      return ['from']; // Return minimal keys during build
    }
    return Object.keys(client);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      // Return a descriptor that allows the property to exist during build
      const errorMessage = 'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.';
      return {
        enumerable: true,
        configurable: true,
        value: prop === 'from' ? createNoOpQueryBuilder : () => Promise.resolve({ 
          data: null, 
          error: { 
            message: errorMessage,
            code: 'ENV_VARS_MISSING'
          } 
        }),
      };
    }
    return Object.getOwnPropertyDescriptor(client, prop);
  },
});

