import type { RequestHandler } from '@builder.io/qwik-city';
import { sendEmail } from '~/utils/mailgun';

/**
 * Endpoint di test per verificare la configurazione Mailgun
 * POST /api/email/test
 */
export const onPost: RequestHandler = async ({ json, request }) => {
  try {
    const body = await request.json();
    const { to, subject, message } = body;

    if (!to || !subject || !message) {
      json(400, {
        success: false,
        error: 'Parametri mancanti: to, subject, message sono obbligatori'
      });
      return;
    }

    const result = await sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email di Test - JudoOK</h2>
          <p>${message}</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Questa è un'email di test inviata da JudoOK usando Mailgun
          </p>
        </div>
      `,
      text: message
    });

    json(200, result);
  } catch (error) {
    console.error('Errore test email:', error);
    json(500, {
      success: false,
      error: 'Errore durante l\'invio dell\'email di test'
    });
  }
};
