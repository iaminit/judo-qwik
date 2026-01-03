import { type RequestHandler } from '@builder.io/qwik-city';
import fs from 'fs';
import path from 'path';

export const onPost: RequestHandler = async ({ request, json }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || '';

        if (!file) {
            json(400, { error: 'No file provided' });
            return;
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name.replace(/\s+/g, '-').toLowerCase();

        const isProd = process.env.NODE_ENV === 'production';
        const targetDir = isProd
            ? path.join(process.cwd(), 'dist', 'media', folder)
            : path.join(process.cwd(), 'public', 'media', folder);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const filePath = path.join(targetDir, fileName);

        let finalFileName = fileName;
        if (fs.existsSync(filePath)) {
            const ext = path.extname(fileName);
            const name = path.basename(fileName, ext);
            finalFileName = `${name}-${Date.now()}${ext}`;
        }

        const finalPath = path.join(targetDir, finalFileName);
        fs.writeFileSync(finalPath, buffer);

        const relativeUrl = folder ? `/media/${folder}/${finalFileName}` : `/media/${finalFileName}`;

        json(200, {
            url: relativeUrl,
            fileName: finalFileName
        });
    } catch (error: any) {
        console.error('[API Upload] Error:', error);
        json(500, { error: error.message || 'Upload failed' });
    }
};
