import PocketBase from 'pocketbase';

// Use environment variable if available, fallback to local
const isServer = import.meta.env.SSR;
const isProd = import.meta.env.PROD;

// FORCED URL for APK/production - always use remote server
const FORCED_URL = 'https://judo.1ms.it';

// Prioritize PUBLIC_URL for static builds, then forced URL for production
const url = import.meta.env.VITE_PB_PUBLIC_URL ||
  import.meta.env.VITE_PB_URL ||
  (isProd ? FORCED_URL : 'http://127.0.0.1:8090');

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
  if (fileName.startsWith('/media')) return isProd ? `${FORCED_URL}${fileName}` : fileName;

  // Always use absolute URL for APK/production builds
  if (isProd) {
    return `${FORCED_URL}/api/files/${collectionId}/${recordId}/${fileName}`;
  }

  // Development / Localhost
  const pbUrl = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';
  return `${pbUrl}/api/files/${collectionId}/${recordId}/${fileName}`;
};

/**
 * Utility to convert local /media paths to absolute URLs for APK
 */
export const getMediaUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (isProd) {
    return path.startsWith('/') ? `${FORCED_URL}${path}` : `${FORCED_URL}/${path}`;
  }
  return path;
};
