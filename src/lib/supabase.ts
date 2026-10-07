import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/^[=\s]+|[=\s]+$/g, '').trim();
const supabasePublishableKey = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').replace(/^[=\s]+|[=\s]+$/g, '').trim();

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Supabase mobile environment variables are missing.');
}

const storage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve<string | null>(null);
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

function isTechnicalError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('module not found') ||
    lower.includes('esm.sh') ||
    lower.includes('non-2xx status code') ||
    lower.includes('functionshttperror') ||
    lower.includes('deno') ||
    lower.includes('import(') ||
    lower.includes('internal server error') ||
    lower.includes('referenceerror') ||
    lower.includes('syntaxerror')
  );
}

export async function extractFunctionError(error: unknown, fallback = 'Operation failed. Please try again.'): Promise<string> {
  if (!error) return fallback;
  const anyErr = error as any;
  const context = anyErr?.context;
  if (context) {
    try {
      let payload: any = null;
      if (typeof context.json === 'function') {
        try {
          payload = typeof context.clone === 'function'
            ? await context.clone().json()
            : await context.json();
        } catch {
          payload = await context.json().catch(() => null);
        }
      }
      if (payload) {
        const msg = payload.message || payload.error;
        if (typeof msg === 'string' && msg.trim() && !isTechnicalError(msg)) {
          return msg;
        }
      }
    } catch {}

    try {
      if (typeof context.text === 'function') {
        let text: string | null = null;
        try {
          text = typeof context.clone === 'function'
            ? await context.clone().text()
            : await context.text();
        } catch {
          text = await context.text().catch(() => null);
        }
        if (text && typeof text === 'string' && !isTechnicalError(text)) {
          try {
            const parsed = JSON.parse(text);
            const msg = parsed?.message || parsed?.error;
            if (typeof msg === 'string' && !isTechnicalError(msg)) return msg;
          } catch {}
          return text;
        }
      }
    } catch {}
  }
  if (typeof anyErr.message === 'string' && !isTechnicalError(anyErr.message)) {
    return anyErr.message;
  }
  return fallback;
}
