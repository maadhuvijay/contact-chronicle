import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Check if Supabase environment variables are configured
 * This can be called before using Supabase to provide better error messages
 */
export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Get a user-friendly error message if Supabase is not configured
 */
export function getSupabaseConfigError(): string | null {
  if (isSupabaseConfigured()) {
    return null;
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  
  const missing: string[] = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
  
  return `Missing Supabase environment variables: ${missing.join(', ')}. Please ensure these are set in your deployment platform (Vercel, Netlify, etc.) and rebuild the application.`;
}

function getSupabaseClient(): SupabaseClient {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient;
  }

  // In Next.js, NEXT_PUBLIC_ variables are embedded at build time
  // They should be available both on server and client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // If env vars are missing, throw a clear error with helpful instructions
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorDetails = {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl || 'NOT SET',
      keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'NOT SET',
      allEnvVars: typeof window !== 'undefined' 
        ? 'Client-side: Check browser console for env vars'
        : 'Server-side: Check build-time environment variables'
    };
    
    console.error('Supabase initialization error - Environment variables missing:', errorDetails);
    console.error('Required variables:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
    console.error('');
    console.error('To fix this:');
    console.error('  1. Set these variables in your deployment platform (Vercel, etc.)');
    console.error('  2. Rebuild and redeploy your application');
    console.error('  3. For local development, create a .env.local file with these variables');
    
    const errorMessage = `Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY are set in your deployment platform and rebuild the application.`;
    throw new Error(errorMessage);
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully');
    return supabaseClient;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw new Error(`Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
