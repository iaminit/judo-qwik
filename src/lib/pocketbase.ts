import PocketBase from 'pocketbase';

// Use environment variable if available, fallback to local
const isServer = import.meta.env.SSR;
const isProd = import.meta.env.PROD;
const url = import.meta.env.VITE_PB_URL || (isServer ? 'http://127.0.0.1:8090' : (isProd ? '/' : 'http://127.0.0.1:8090'));
export const pb = new PocketBase(url);

// Log for debugging
if (typeof console !== 'undefined') {
  console.log('[PocketBase] Initialized with URL:', url);
}
