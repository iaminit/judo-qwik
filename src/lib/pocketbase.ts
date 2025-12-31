import PocketBase from 'pocketbase';

// Use environment variable if available, fallback to local
const url = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';
export const pb = new PocketBase(url);

// Log for debugging
if (typeof console !== 'undefined') {
  console.log('[PocketBase] Initialized with URL:', url);
}
