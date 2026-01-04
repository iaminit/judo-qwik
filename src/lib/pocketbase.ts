import PocketBase from 'pocketbase';

// Use environment variable if available, fallback to local
const isServer = import.meta.env.SSR;
const isProd = import.meta.env.PROD;

// Prioritize PUBLIC_URL for static builds (Cloudflare), then standard env, then auto-detection
const url = import.meta.env.VITE_PB_PUBLIC_URL ||
  import.meta.env.VITE_PB_URL ||
  (isServer ? 'http://127.0.0.1:8090' : (isProd ? '/' : 'http://127.0.0.1:8090'));
export const pb = new PocketBase(url);

// Log for debugging
if (typeof console !== 'undefined') {
  console.log('[PocketBase] Initialized with URL:', url);
}

/**
 * Utility to get correct URL for PocketBase files
 */
export const getPBFileUrl = (collectionId: string, recordId: string, fileName: string) => {
  if (!fileName) return '';
  if (fileName.startsWith('http')) return fileName;
  if (fileName.startsWith('/media')) return fileName;

  // 1. External Static Hosting (e.g. Cloudflare Pages)
  // Check this FIRST. If set, we want absolute URLs pointing to the live API.
  if (import.meta.env.VITE_PB_PUBLIC_URL) {
    return `${import.meta.env.VITE_PB_PUBLIC_URL}/api/files/${collectionId}/${recordId}/${fileName}`;
  }

  // 2. Production Cloud Run (Client and SSR)
  // Use relative path because Express proxies /api to PocketBase internally
  if (import.meta.env.PROD) {
    return `/api/files/${collectionId}/${recordId}/${fileName}`;
  }

  // 3. Development / Localhost
  const pbUrl = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';
  const absoluteBase = pbUrl.startsWith('http') ? pbUrl : 'http://127.0.0.1:8090';
  return `${absoluteBase}/api/files/${collectionId}/${recordId}/${fileName}`;
};
