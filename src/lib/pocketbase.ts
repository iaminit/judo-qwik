import PocketBase from 'pocketbase';

// Use environment variable for URL, fallback to localhost
// PUBLIC_PB_URL is used for client-side access
const url = import.meta.env.PUBLIC_PB_URL || 'http://127.0.0.1:8090';
export const pb = new PocketBase(url);

// Log for debugging
if (typeof console !== 'undefined') {
  console.log('[PocketBase] Initialized with URL:', url);
}
