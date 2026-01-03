import { type RequestHandler } from '@builder.io/qwik-city';
import fs from 'fs';
import path from 'path';

export const onGet: RequestHandler = async ({ json }) => {
    try {
        const isProd = process.env.NODE_ENV === 'production';
        const mediaDir = isProd
            ? path.join(process.cwd(), 'dist', 'media')
            : path.join(process.cwd(), 'public', 'media');

        if (!fs.existsSync(mediaDir)) {
            json(200, []);
            return;
        }

        const files = fs.readdirSync(mediaDir);

        const mediaFiles = files.filter(file => {
            const filePath = path.join(mediaDir, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) return false;

            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm'].includes(ext);
        });

        json(200, mediaFiles);
    } catch (error) {
        console.error('[API Local Media] Error:', error);
        json(500, { error: 'Failed to read media directory' });
    }
};
