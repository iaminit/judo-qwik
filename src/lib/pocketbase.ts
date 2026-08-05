import PocketBase from 'pocketbase';

// Force production mode if we are in search-modal/browser environment with Capacitor
const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;
const isProd = import.meta.env.PROD || isCapacitor;

// FORCED URL for APK/production - always use remote server
const FORCED_URL = 'https://judo.1ms.it';
const LOCAL_URL = 'http://127.0.0.1:8090';

const getBrowserPocketBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  if (isCapacitor) return FORCED_URL;

  const isLocalDevelopment =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  return isLocalDevelopment
    ? import.meta.env.VITE_PB_URL || LOCAL_URL
    : window.location.origin;
};

// A local VITE_PB_URL may be embedded at build time, but it must never send a
// visitor's browser to localhost. Public web builds use their own origin.
export const PB_BASE_URL = import.meta.env.VITE_PB_PUBLIC_URL ||
  getBrowserPocketBaseUrl() ||
  import.meta.env.VITE_PB_URL ||
  (isProd ? FORCED_URL : LOCAL_URL);

export const pb = new PocketBase(PB_BASE_URL);

// Log for debugging
if (typeof console !== 'undefined') {
  console.log('[PocketBase] Initialized with URL:', PB_BASE_URL);
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
  const pbUrl = import.meta.env.VITE_PB_URL || LOCAL_URL;
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
