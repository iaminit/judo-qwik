import { type RequestHandler } from '@builder.io/qwik-city';
import fs from 'fs';
import path from 'path';

export const onPost: RequestHandler = async ({ request, json }) => {
    try {
        const { fileName } = await request.json();

        if (!fileName) {
            json(400, { error: 'No filename provided' });
            return;
        }

        // Security check: prevent directory traversal
        if (fileName.includes('..')) {
            json(400, { error: 'Invalid filename' });
            return;
        }

        const filePath = path.join(process.cwd(), 'public', 'media', fileName);

        if (!fs.existsSync(filePath)) {
            json(404, { error: 'File not found' });
            return;
        }

        fs.unlinkSync(filePath);

        json(200, { success: true });
    } catch (error: any) {
        console.error('[API Delete Media] Error:', error);
        json(500, { error: error.message || 'Deletion failed' });
    }
};
