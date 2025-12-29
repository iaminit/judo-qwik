import PocketBase from 'pocketbase';

// Use hardcoded URL for SSR compatibility
const url = 'http://127.0.0.1:8090';
export const pb = new PocketBase(url);

// Log for debugging
if (typeof console !== 'undefined') {
  console.log('[PocketBase] Initialized with URL:', url);
}
