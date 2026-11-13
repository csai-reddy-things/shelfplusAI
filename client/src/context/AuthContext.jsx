import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, signInStoreOwner, signUpStoreOwner, signOutStoreOwner } from '../lib/supabaseClient.js';
import { apiClient } from '../lib/apiClient.js';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [storeProfile, setStoreProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick live stage demo target number (so judges can plug in their number in 5 seconds)
  const [stageDemoNumber, setStageDemoNumberState] = useState(() => {
    return localStorage.getItem('shelfpulse_stage_number') || '+919876543210';
  });

  const setStageDemoNumber = (newNumber) => {
    let clean = String(newNumber).replace(/[\s\-\(\)]/g, '');
    if (!clean.startsWith('+')) clean = '+' + clean;
    localStorage.setItem('shelfpulse_stage_number', clean);
    setStageDemoNumberState(clean);
  };

  const fetchProfile = async (userId) => {
    try {
      if (isSupabaseConfigured && userId) {
        const { data, error } = await supabase
          .from('store_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (data && !error) {
          setStoreProfile(data);
          return;
        }
      }
    } catch (e) {
      console.warn('Profile fetch warning:', e);
    }

    // Default fallback profile
    setStoreProfile({
      store_name: 'Apna Supermart & Kirana',
      owner_name: 'Rajesh Kumar',
      phone_number: stageDemoNumber,
      city: 'Bengaluru',
      auto_whatsapp_enabled: true
    });
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (mounted && currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            await fetchProfile(currentSession.user.id);
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (mounted) {
              setSession(newSession);
              setUser(newSession?.user || null);
              if (newSession?.user) {
                await fetchProfile(newSession.user.id);
              } else {
                setStoreProfile(null);
              }
            }
          });

          return () => {
            subscription?.unsubscribe();
          };
        } else {
          // Check local demo session
          const stored = localStorage.getItem('shelfpulse_demo_session');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setSession(parsed);
              setUser(parsed.user);
              await fetchProfile(parsed.user.id);
            } catch (err) {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await signInStoreOwner({ email, password });
    if (res.error) throw res.error;
    if (res.data?.user) {
      setUser(res.data.user);
      setSession(res.data.session);
      await fetchProfile(res.data.user.id);
    }
    return res;
  };

  const signup = async (details) => {
    const res = await signUpStoreOwner(details);
    if (res.error) throw res.error;
    if (res.data?.user) {
      setUser(res.data.user);
      setSession(res.data.session);
      await fetchProfile(res.data.user.id);
    }
    return res;
  };

  const logout = async () => {
    await signOutStoreOwner();
    setUser(null);
    setSession(null);
    setStoreProfile(null);
    toast.success('Signed out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        storeProfile,
        stageDemoNumber,
        setStageDemoNumber,
        loading,
        login,
        signup,
        logout,
        refreshProfile: () => fetchProfile(user?.id)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
