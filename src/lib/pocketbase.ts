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

/**
 * Utility to get correct URL for PocketBase files
 */
export const getPBFileUrl = (collectionId: string, recordId: string, fileName: string) => {
  if (!fileName) return '';
  if (fileName.startsWith('http')) return fileName;
  if (fileName.startsWith('/media')) return fileName;

  // Always prefer absolute URL in development/preview to avoid proxy 404s
  const isLocal = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    : true; // Default to true in SSR unless we have a clear production env

  const pbUrl = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';

  // If we are on localhost, or the PB URL is localhost, use the absolute IP/Port
  if (isLocal || pbUrl.includes('localhost') || pbUrl.includes('127.0.0.1')) {
    // Ensure we use the full address
    const absoluteBase = pbUrl.startsWith('http') ? pbUrl : 'http://127.0.0.1:8090';
    return `${absoluteBase}/api/files/${collectionId}/${recordId}/${fileName}`;
  }

  // Production: use relative path for the proxy (Express handles it)
  return `/api/files/${collectionId}/${recordId}/${fileName}`;
};
