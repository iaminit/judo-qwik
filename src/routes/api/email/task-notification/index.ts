import type { RequestHandler } from '@builder.io/qwik-city';
import { sendAdminTaskNotification } from '~/utils/mailgun';

/**
 * Endpoint per inviare notifica creazione task
 * POST /api/email/task-notification
 */
export const onPost: RequestHandler = async ({ json, request }) => {
  try {
    const body = await request.json();
    const { title, description, priority, createdBy } = body;

    if (!title || !description || !priority || !createdBy) {
      json(400, {
        success: false,
        error: 'Parametri mancanti'
      });
      return;
    }

    const result = await sendAdminTaskNotification({
      title,
      description,
      priority,
      createdBy
    });

    json(200, result);
  } catch (error) {
    console.error('Errore invio notifica task:', error);
    json(500, {
      success: false,
      error: 'Errore durante l\'invio della notifica'
    });
  }
};
