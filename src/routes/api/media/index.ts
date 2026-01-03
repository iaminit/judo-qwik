import { type RequestHandler } from "@builder.io/qwik-city";
import fs from "fs";
import path from "path";

export const onGet: RequestHandler = async ({ json }) => {
    try {
        const isProd = process.env.NODE_ENV === 'production';
        const mediaDir = isProd
            ? path.join(process.cwd(), 'dist', 'media')
            : path.join(process.cwd(), 'public', 'media');
        const persistentDir = isProd ? '/app/pb_data' : null;

        const allFiles: any[] = [];
        const extensions = [".webp", ".jpg", ".jpeg", ".png", ".svg", ".mp3", ".wav", ".mp4", ".webm"];

        const scanDir = (dir: string, baseRelative: string = '') => {
            if (!fs.existsSync(dir)) return;
            const entries = fs.readdirSync(dir, { withFileTypes: true });

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
                        const pathLower = relativePath.toLowerCase();
                        let tag = 'IMMAGINI';
                        if (pathLower.includes('audio/')) tag = 'AUDIO';
                        else if (pathLower.includes('video/')) tag = 'VIDEO';
                        else if (pathLower.includes('post/')) tag = 'POST';
                        else if (pathLower.includes('bacheca/')) tag = 'POST';

                        allFiles.push({
                            name: entry.name,
                            path: relativePath,
                            url: `/media/${relativePath}`,
                            tag: tag
                        });
                    }
                }
            }
        };

        if (fs.existsSync(mediaDir)) scanDir(mediaDir);
        if (persistentDir && fs.existsSync(persistentDir)) scanDir(persistentDir);

        // Unique by path
        const uniqueMedia = Array.from(new Map(allFiles.map(m => [m.path, m])).values());

        json(200, uniqueMedia);
    } catch (err) {
        json(500, { error: "Failed to read media directory" });
    }
};
