import type { RequestHandler } from '@builder.io/qwik-city';
import { sendEmail } from '~/utils/email';

export const onPost: RequestHandler = async ({ json, request, env }) => {
    try {
        const body = await request.json();
        const { to, task } = body;

        if (!to || !task) {
            json(400, { error: 'Missing required fields' });
            return;
        }

        // Map Italian priority to config (supporta sia inglese che italiano per retro-compatibilità)
        const priorityConfig = {
            urgente: { emoji: '🔴', color: '#dc2626', label: 'URGENTE' },
            alta: { emoji: '🟠', color: '#ea580c', label: 'ALTA' },
            media: { emoji: '🔵', color: '#2563eb', label: 'MEDIA' },
            bassa: { emoji: '⚪', color: '#6b7280', label: 'BASSA' },
            // Retro-compatibilità con vecchie priorità inglesi
            urgent: { emoji: '🔴', color: '#dc2626', label: 'URGENTE' },
            high: { emoji: '🟠', color: '#ea580c', label: 'ALTA' },
            medium: { emoji: '🔵', color: '#2563eb', label: 'MEDIA' },
            low: { emoji: '⚪', color: '#6b7280', label: 'BASSA' }
        };

        const priority = priorityConfig[task.priorita as keyof typeof priorityConfig]
            || priorityConfig[task.priority as keyof typeof priorityConfig] // fallback vecchio campo
            || priorityConfig.media;

        // Supporta sia titolo (nuovo) che title (vecchio)
        const taskTitle = task.titolo || task.title || 'Task senza titolo';
        const taskContent = task.contenuto || task.description || '';

        // Generate HTML
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900;">🥋 JudoOK Admin</h1>
                            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">SISTEMA DI GESTIONE TASK</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 30px 10px 30px;">
                            <div style="display: inline-block; padding: 10px 20px; background-color: ${priority.color}15; border-radius: 100px; border: 2px solid ${priority.color};">
                                <span style="color: ${priority.color}; font-size: 12px; font-weight: 900; letter-spacing: 1px;">${priority.emoji} PRIORITÀ ${priority.label}</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 30px;">
                            <h2 style="margin: 0; color: #111827; font-size: 24px; font-weight: 800;">${taskTitle}</h2>
                        </td>
                    </tr>
                    ${taskContent ? `<tr><td style="padding: 0 30px 20px 30px;"><div style="background-color: #f9fafb; border-left: 4px solid #dc2626; padding: 16px 20px; border-radius: 8px;"><p style="margin: 0; color: #4b5563; font-size: 15px;">${taskContent}</p></div></td></tr>` : ''}
                    <tr>
                        <td style="padding: 30px; text-align: center;">
                            <a href="${env.get('VITE_PB_URL')?.replace(':8090', ':5173') || 'http://localhost:5173'}/gestione" style="display: inline-block; padding: 16px 40px; background: #dc2626; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 14px;">➔ Vai alla Dashboard</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 30px; background-color: #f9fafb; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">Questo è un promemoria automatico dal sistema JudoOK Admin.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `;

        const text = `[JudoOK Admin] ${priority.emoji} Task: ${taskTitle}\n\nPRIORITÀ: ${priority.label}\n\n${taskContent || 'Nessuna descrizione fornita.'}\n\nAccedi: ${env.get('VITE_PB_URL')?.replace(':8090', ':5173') || 'http://localhost:5173'}/gestione`;

        const result = await sendEmail({
            to,
            subject: `${priority.emoji} [JudoOK] Task: ${taskTitle}`,
            html,
            text
        });

        if (result.success) {
            console.log('[Email API] ✅ Email sent successfully to:', to);
            json(200, {
                success: true,
                message: 'Email reminder sent successfully'
            });
        } else {
            throw result.error;
        }

    } catch (e: any) {
        console.error('[Email API] ❌ Error:', e);
        json(500, {
            error: e.message || 'Failed to send email',
            details: e.details || null
        });
    }
};
