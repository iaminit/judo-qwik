import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Configurazione Mailgun
const mailgun = new Mailgun(formData);

// Client Mailgun (lazy initialization)
let mg: ReturnType<typeof mailgun.client> | null = null;

function getMailgunClient() {
  if (!mg) {
    const apiKey = import.meta.env.MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;

    if (!apiKey) {
      throw new Error('MAILGUN_API_KEY non configurata');
    }

    mg = mailgun.client({
      username: 'api',
      key: apiKey,
      url: 'https://api.eu.mailgun.net' // Usa 'https://api.mailgun.net' per US
    });
  }

  return mg;
}

// Configurazione email
export const emailConfig = {
  domain: import.meta.env.MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN || '',
  from: {
    email: import.meta.env.MAILGUN_FROM_EMAIL || process.env.MAILGUN_FROM_EMAIL || '',
    name: import.meta.env.MAILGUN_FROM_NAME || process.env.MAILGUN_FROM_NAME || 'JudoOK Admin'
  },
  adminEmail: import.meta.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL || ''
};

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  template?: string;
  variables?: Record<string, any>;
}

/**
 * Invia un'email tramite Mailgun
 */
export async function sendEmail(params: SendEmailParams) {
  try {
    const client = getMailgunClient();

    const fromEmail = params.from || `${emailConfig.from.name} <${emailConfig.from.email}>`;

    const messageData: any = {
      from: fromEmail,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
    };

    // Aggiungi HTML o testo
    if (params.html) {
      messageData.html = params.html;
    }
    if (params.text) {
      messageData.text = params.text;
    }

    // CC e BCC opzionali
    if (params.cc) {
      messageData.cc = Array.isArray(params.cc) ? params.cc : [params.cc];
    }
    if (params.bcc) {
      messageData.bcc = Array.isArray(params.bcc) ? params.bcc : [params.bcc];
    }

    // Template Mailgun (opzionale)
    if (params.template) {
      messageData.template = params.template;
      if (params.variables) {
        messageData['h:X-Mailgun-Variables'] = JSON.stringify(params.variables);
      }
    }

    const response = await client.messages.create(emailConfig.domain, messageData);

    console.log('Email inviata con successo:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('Errore invio email:', error);
    return { success: false, error };
  }
}

/**
 * Invia notifica admin per nuova task
 */
export async function sendAdminTaskNotification(taskData: {
  title: string;
  description: string;
  priority: string;
  createdBy: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin: 20px 0; }
        .task-info { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #1e40af; }
        .priority { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; }
        .priority-alta { background-color: #fee2e2; color: #991b1b; }
        .priority-media { background-color: #fef3c7; color: #92400e; }
        .priority-bassa { background-color: #dbeafe; color: #1e40af; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🥋 Nuova Task Admin - JudoOK</h1>
        </div>
        <div class="content">
          <p>È stata creata una nuova task nel sistema amministrativo.</p>

          <div class="task-info">
            <h2>${taskData.title}</h2>
            <p><strong>Descrizione:</strong> ${taskData.description}</p>
            <p>
              <strong>Priorità:</strong>
              <span class="priority priority-${taskData.priority.toLowerCase()}">${taskData.priority}</span>
            </p>
            <p><strong>Creata da:</strong> ${taskData.createdBy}</p>
          </div>

          <p style="margin-top: 20px;">
            <a href="${import.meta.env.VITE_PB_URL || 'http://localhost:5173'}/gestione"
               style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Vai al Pannello Admin
            </a>
          </p>
        </div>
        <div class="footer">
          <p>JudoOK Admin System - Notifica automatica</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: emailConfig.adminEmail,
    subject: `🥋 Nuova Task: ${taskData.title}`,
    html,
    text: `Nuova Task: ${taskData.title}\n\nDescrizione: ${taskData.description}\nPriorità: ${taskData.priority}\nCreata da: ${taskData.createdBy}`
  });
}

/**
 * Invia notifica per nuovo post bacheca
 */
export async function sendNewPostNotification(postData: {
  title: string;
  author: string;
  excerpt: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin: 20px 0; }
        .post-preview { background-color: white; padding: 20px; margin: 15px 0; border-radius: 8px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 Nuovo Post nella Bacheca</h1>
        </div>
        <div class="content">
          <div class="post-preview">
            <h2>${postData.title}</h2>
            <p><em>di ${postData.author}</em></p>
            <p>${postData.excerpt}</p>
          </div>

          <p style="margin-top: 20px;">
            <a href="${import.meta.env.VITE_PB_URL || 'http://localhost:5173'}/bacheca"
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Leggi il Post Completo
            </a>
          </p>
        </div>
        <div class="footer">
          <p>JudoOK - Notifica automatica</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: emailConfig.adminEmail,
    subject: `📢 Nuovo Post: ${postData.title}`,
    html,
    text: `Nuovo Post nella Bacheca\n\nTitolo: ${postData.title}\nAutore: ${postData.author}\n\n${postData.excerpt}`
  });
}

/**
 * Invia reminder generico
 */
export async function sendReminderEmail(reminderData: {
  to: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin: 20px 0; }
        .reminder-box { background-color: white; padding: 20px; margin: 15px 0; border-left: 4px solid #dc2626; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ ${reminderData.title}</h1>
        </div>
        <div class="content">
          <div class="reminder-box">
            <p>${reminderData.message}</p>
          </div>

          ${reminderData.actionUrl ? `
            <p style="margin-top: 20px;">
              <a href="${reminderData.actionUrl}"
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                ${reminderData.actionLabel || 'Vai all\'app'}
              </a>
            </p>
          ` : ''}
        </div>
        <div class="footer">
          <p>JudoOK - Reminder automatico</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: reminderData.to,
    subject: `⏰ ${reminderData.title}`,
    html,
    text: `${reminderData.title}\n\n${reminderData.message}`
  });
}

export default {
  sendEmail,
  sendAdminTaskNotification,
  sendNewPostNotification,
  sendReminderEmail,
  config: emailConfig
};
