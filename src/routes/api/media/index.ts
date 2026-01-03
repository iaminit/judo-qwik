import { type RequestHandler } from "@builder.io/qwik-city";
import fs from "fs";
import path from "path";

export const onGet: RequestHandler = async ({ json }) => {
    try {
        const isProd = process.env.NODE_ENV === 'production';
        const mediaDir = isProd
            ? path.join(process.cwd(), 'dist', 'media')
            : path.join(process.cwd(), 'public', 'media');

        const files = fs.readdirSync(mediaDir);

        const mediaFiles = files
            .filter(f => !fs.statSync(path.join(mediaDir, f)).isDirectory())
            .map(f => ({
                name: f,
                url: `/media/${f}`,
                extension: path.extname(f).toLowerCase()
            }))
            .filter(f => [".webp", ".jpg", ".jpeg", ".png", ".svg"].includes(f.extension));

        json(200, mediaFiles);
    } catch (err) {
        json(500, { error: "Failed to read media directory" });
    }
};
