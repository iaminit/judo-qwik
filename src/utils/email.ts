import nodemailer from 'nodemailer';

// Configurazione email
export const emailConfig = {
    host: import.meta.env.SMTP_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(import.meta.env.SMTP_PORT || process.env.SMTP_PORT || '465'),
    secure: (import.meta.env.SMTP_SECURE || process.env.SMTP_SECURE || 'true') === 'true', // true per 465, false per altri
    user: import.meta.env.SMTP_USER || process.env.SMTP_USER || '',
    pass: import.meta.env.SMTP_PASS || process.env.SMTP_PASS || '',
    from: {
        email: import.meta.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || '',
        name: import.meta.env.SMTP_FROM_NAME || process.env.SMTP_FROM_NAME || 'JudoOK Admin'
    },
    adminEmail: import.meta.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL || ''
};

// Transporter (lazy initialization)
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (!transporter) {
        if (!emailConfig.user || !emailConfig.pass) {
            throw new Error('SMTP_USER e SMTP_PASS non configurati');
        }

        transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
                user: emailConfig.user,
                pass: emailConfig.pass,
            },
        });
    }
    return transporter;
}

interface SendEmailParams {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
}

/**
 * Invia un'email tramite SMTP (Gmail o altro)
 */
export async function sendEmail(params: SendEmailParams) {
    try {
        const client = getTransporter();

        const fromString = params.from || `"${emailConfig.from.name}" <${emailConfig.from.email || emailConfig.user}>`;

        const mailOptions = {
            from: fromString,
            to: params.to,
            subject: params.subject,
            html: params.html,
            text: params.text,
            cc: params.cc,
            bcc: params.bcc,
        };

        const info = await client.sendMail(mailOptions);

        console.log('Email inviata con successo:', info.messageId);
        return { success: true, data: info };
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
