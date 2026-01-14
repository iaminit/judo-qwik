import { type RequestHandler } from '@builder.io/qwik-city';
import fs from 'fs';
import path from 'path';

export const onPost: RequestHandler = async ({ request, json }) => {
    console.log('[API Upload] Request received');
    try {
        const formData = await request.formData();
        console.log('[API Upload] Form data parsed');
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || '';

        if (!file) {
            json(400, { error: 'No file provided' });
            return;
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name).toLowerCase();
        const fileName = file.name.replace(/\s+/g, '-').toLowerCase();

        // 1. Determine base folder by file type or priority
        let finalFolder = folder;
        if (!finalFolder) {
            if (['.mp3', '.wav', '.m4a', '.ogg'].includes(ext)) {
                finalFolder = 'audio';
            } else if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
                finalFolder = 'video';
            } else if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
                // Default image folder if no context is provided
                finalFolder = 'immagini';
            }
        }

        const isProd = process.env.NODE_ENV === 'production';
        const targetDir = isProd
            ? path.join('/app/pb_data', 'media', finalFolder)
            : path.join(process.cwd(), 'public', 'media', finalFolder);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const filePath = path.join(targetDir, fileName);

        let finalFileName = fileName;
        if (fs.existsSync(filePath)) {
            const nameWithoutExt = path.basename(fileName, ext);
            finalFileName = `${nameWithoutExt}-${Date.now()}${ext}`;
        }

        const finalPath = path.join(targetDir, finalFileName);
        fs.writeFileSync(finalPath, buffer);
        console.log(`[API Upload] File written to: ${finalPath}`);

        const relativeUrl = `/media/${finalFolder}/${finalFileName}`;

        json(200, {
            url: relativeUrl,
            fileName: `${finalFolder}/${finalFileName}`
        });
    } catch (error: any) {
        console.error('[API Upload] Error:', error);
        json(500, { error: error.message || 'Upload failed' });
    }
};
