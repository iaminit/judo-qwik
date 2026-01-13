import PocketBase from 'pocketbase';

// Use environment variable if available, fallback to local
const isServer = import.meta.env.SSR;
// Force production mode if we are in search-modal/browser environment with Capacitor
const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;
const isProd = import.meta.env.PROD || isCapacitor;

// FORCED URL for APK/production - always use remote server
const FORCED_URL = 'https://judo.1ms.it';

// Base URL for API
const url = import.meta.env.VITE_PB_PUBLIC_URL ||
  import.meta.env.VITE_PB_URL ||
  (isProd ? FORCED_URL : 'http://127.0.0.1:8090');

export const pb = new PocketBase(url);

// Log for debugging
if (typeof console !== 'undefined') {
  console.log('[PocketBase] Initialized with URL:', url);
}

// Utility to get correct URL for PocketBase files
export const getPBFileUrl = (collectionId: string, recordId: string, fileName: string) => {
  if (!fileName) return '';
  if (fileName.startsWith('http')) return fileName;

  // Local static assets should remain local path
  if (fileName.startsWith('/media') || fileName.startsWith('media/')) return fileName;

  // Always use absolute URL for APK/production builds for DATA content
  if (isProd) {
    return `${FORCED_URL}/api/files/${collectionId}/${recordId}/${fileName}`;
  }

  // Development / Localhost
  const pbUrl = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';
  return `${pbUrl}/api/files/${collectionId}/${recordId}/${fileName}`;
};

/**
 * Utility to convert paths. 
 * For APK: standardizes local paths. 
 * Returns relative path so Capacitor loads from local bundle.
 */
export const getMediaUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  // APK/PROD: Keep local paths relative (e.g. /media/...) so they load from assets
  if (path.startsWith('/') || path.startsWith('media/')) return path;

  return path;
};
