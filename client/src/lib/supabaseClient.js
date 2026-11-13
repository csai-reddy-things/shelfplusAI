import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your-supabase-anon-key')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Sign up a new store manager and provision store profile
 */
export async function signUpStoreOwner({ email, password, storeName, ownerName, phoneNumber, city }) {
  if (!isSupabaseConfigured) {
    // Stage Demo Local Mock Mode
    const demoUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email,
      user_metadata: {
        store_name: storeName || 'Apna Supermart',
        owner_name: ownerName || 'Rajesh Kumar',
        phone_number: phoneNumber || '+919876543210',
        city: city || 'Bengaluru'
      }
    };
    const mockSession = {
      access_token: 'demo-test-token',
      user: demoUser
    };
    localStorage.setItem('shelfpulse_demo_session', JSON.stringify(mockSession));
    return { data: { user: demoUser, session: mockSession }, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        store_name: storeName,
        owner_name: ownerName,
        phone_number: phoneNumber,
        city: city
      }
    }
  });

  if (error) return { data: null, error };

  // Create store profile record in public.store_profiles
  if (data?.user) {
    await supabase.from('store_profiles').upsert({
      id: data.user.id,
      store_name: storeName,
      owner_name: ownerName,
      phone_number: phoneNumber,
      city: city,
      auto_whatsapp_enabled: true
    }).catch(console.error);
  }

  return { data, error: null };
}

/**
 * Sign in existing store manager
 */
export async function signInStoreOwner({ email, password }) {
  if (!isSupabaseConfigured) {
    const demoUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email,
      user_metadata: {
        store_name: 'Apna Supermart',
        owner_name: 'Rajesh Kumar',
        phone_number: '+919876543210',
        city: 'Bengaluru'
      }
    };
    const mockSession = {
      access_token: 'demo-test-token',
      user: demoUser
    };
    localStorage.setItem('shelfpulse_demo_session', JSON.stringify(mockSession));
    return { data: { user: demoUser, session: mockSession }, error: null };
  }

  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign out store manager
 */
export async function signOutStoreOwner() {
  localStorage.removeItem('shelfpulse_demo_session');
  if (isSupabaseConfigured) {
    return await supabase.auth.signOut();
  }
  return { error: null };
}
