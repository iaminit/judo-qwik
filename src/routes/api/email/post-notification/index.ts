import type { RequestHandler } from '@builder.io/qwik-city';
import { sendNewPostNotification } from '~/utils/mailgun';

/**
 * Endpoint per inviare notifica nuovo post bacheca
 * POST /api/email/post-notification
 */
export const onPost: RequestHandler = async ({ json, request }) => {
  try {
    const body = await request.json();
    const { title, author, excerpt } = body;

    if (!title || !author || !excerpt) {
      json(400, {
        success: false,
        error: 'Parametri mancanti: title, author, excerpt sono obbligatori'
      });
      return;
    }

    const result = await sendNewPostNotification({
      title,
      author,
      excerpt
    });

    json(200, result);
  } catch (error) {
    console.error('Errore invio notifica post:', error);
    json(500, {
      success: false,
      error: 'Errore durante l\'invio della notifica'
    });
  }
};
