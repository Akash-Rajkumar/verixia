import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

export function getDbClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
      try {
        supabaseClient = createClient(supabaseUrl, serviceKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
      } catch (err) {
        console.warn('Failed to initialize Supabase service client:', err.message);
      }
    }
  }

  return supabaseClient;
}

export function getDbStatus() {
  const urlConfigured = Boolean(process.env.SUPABASE_URL);
  const keyConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  return {
    configured: urlConfigured && keyConfigured,
    status: (urlConfigured && keyConfigured) ? 'configured' : 'not_configured'
  };
}
