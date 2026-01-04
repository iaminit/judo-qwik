import type { RequestHandler } from '@builder.io/qwik-city';
import { sendReminderEmail } from '~/utils/email';

/**
 * Endpoint per inviare reminder
 * POST /api/email/reminder
 */
export const onPost: RequestHandler = async ({ json, request }) => {
  try {
    const body = await request.json();
    const { to, title, message, actionUrl, actionLabel } = body;

    if (!to || !title || !message) {
      json(400, {
        success: false,
        error: 'Parametri mancanti: to, title, message sono obbligatori'
      });
      return;
    }

    const result = await sendReminderEmail({
      to,
      title,
      message,
      actionUrl,
      actionLabel
    });

    json(200, result);
  } catch (error) {
    console.error('Errore invio reminder:', error);
    json(500, {
      success: false,
      error: 'Errore durante l\'invio del reminder'
    });
  }
};
