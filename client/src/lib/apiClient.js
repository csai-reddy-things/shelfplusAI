import axios from 'axios';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach Supabase JWT Bearer token to all outgoing API requests
apiClient.interceptors.request.use(async (config) => {
  let token = null;

  if (isSupabaseConfigured) {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
  }

  // Fallback to local demo session if Supabase Cloud credentials not yet set
  if (!token) {
    const stored = localStorage.getItem('shelfpulse_demo_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        token = parsed.access_token;
      } catch (e) {
        // ignore
      }
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);
