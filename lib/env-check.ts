/**
 * Utility to check if Supabase environment variables are properly configured
 * This can be used for debugging environment variable issues
 */
export function checkSupabaseEnv(): {
  isValid: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  message: string;
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  const hasUrl = !!supabaseUrl;
  const hasKey = !!supabaseAnonKey;
  const isValid = hasUrl && hasKey;

  let message = '';
  if (!isValid) {
    const missing: string[] = [];
    if (!hasUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!hasKey) missing.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
    message = `Missing environment variables: ${missing.join(', ')}. `;
    message += 'Please set these in your deployment platform (Vercel, etc.) and rebuild the application.';
  } else {
    message = 'Supabase environment variables are configured correctly.';
  }

  return {
    isValid,
    hasUrl,
    hasKey,
    message,
  };
}

