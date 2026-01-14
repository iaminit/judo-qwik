import { type RequestHandler } from '@builder.io/qwik-city';
import fs from 'fs';
import path from 'path';

export const onGet: RequestHandler = async ({ json }) => {
    try {
        const isProd = process.env.NODE_ENV === 'production';
        const mediaDirs = [
            isProd ? path.join(process.cwd(), 'dist', 'media') : path.join(process.cwd(), 'public', 'media'),
            isProd ? '/app/pb_data' : null
        ].filter(Boolean);

        console.log('[API Local Media] Starting scan in:', mediaDirs);

        const allMedia: any[] = [];
        const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mp3', '.wav', '.m4a', '.ogg'];

        const scanDir = (dir: string, baseRelative: string = '') => {
            if (!fs.existsSync(dir)) {
                console.log(`[API Local Media] Dir not found skipping: ${dir}`);
                return;
            }

            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                console.log(`[API Local Media] Scanning ${dir} - found ${entries.length} entries`);

                for (const entry of entries) {
                    // Security: Ignore PocketBase internal folders and backups
                    if (entry.isDirectory() && ['storage', 'backups', 'pb_migrations', 'pb_data', 'media_uploads'].includes(entry.name)) {
                        continue;
                    }

                    const relativePath = baseRelative ? `${baseRelative}/${entry.name}` : entry.name;
                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        scanDir(fullPath, relativePath);
                    } else {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (extensions.includes(ext)) {
                            // Tag based on folder structure
                            const pathLower = relativePath.toLowerCase();
                            let tag = 'IMMAGINI';
                            if (pathLower.includes('audio/')) tag = 'AUDIO';
                            else if (pathLower.includes('video/')) tag = 'VIDEO';
                            else if (pathLower.includes('post/')) tag = 'POST';
                            else if (pathLower.includes('bacheca/')) tag = 'POST';
                            else if (pathLower.includes('home/')) tag = 'IMMAGINI';
                            else if (pathLower.includes('tecniche/')) tag = 'IMMAGINI';
                            else if (['.mp3', '.wav', '.m4a'].includes(ext)) tag = 'AUDIO';
                            else if (['.mp4', '.webm'].includes(ext)) tag = 'VIDEO';

                            // Cleaner URL: if path starts with media/, strip it because Express maps /media to it
                            const cleanPath = relativePath.startsWith('media/')
                                ? relativePath.substring(6)
                                : relativePath;

                            allMedia.push({
                                name: entry.name,
                                path: cleanPath,
                                url: `/media/${cleanPath}`,
                                tag: tag
                            });
                        }
                    }
                }
            } catch (e: any) {
                console.error(`[API Local Media] Error scanning ${dir}:`, e.message);
            }
        };

        mediaDirs.forEach(dir => scanDir(dir!));
        console.log(`[API Local Media] Scan finished. Total items found: ${allMedia.length}`);

        // Uniq by path
        const uniqueMedia = Array.from(new Map(allMedia.map(m => [m.path, m])).values());
        console.log(`[API Local Media] Returning ${uniqueMedia.length} unique items`);

        json(200, uniqueMedia);
    } catch (error) {
        console.error('[API Local Media] Error:', error);
        json(500, { error: 'Failed to read media directory' });
    }
};
