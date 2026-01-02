import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  const email = useSignal('');
  const subject = useSignal('Test Email - JudoOK');
  const message = useSignal('Questa è un\'email di test inviata tramite Mailgun');
  const loading = useSignal(false);
  const result = useSignal<any>(null);

  const handleSendTest = $(async () => {
    loading.value = true;
    result.value = null;

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email.value,
          subject: subject.value,
          message: message.value,
        }),
      });

      const data = await response.json();
      result.value = data;
    } catch (error) {
      result.value = {
        success: false,
        error: 'Errore di connessione'
      };
    } finally {
      loading.value = false;
    }
  });

  const handleSendTaskNotification = $(async () => {
    loading.value = true;
    result.value = null;

    try {
      const response = await fetch('/api/email/task-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Task di Test',
          description: 'Questa è una task di test per verificare le notifiche email',
          priority: 'Alta',
          createdBy: 'Admin Test'
        }),
      });

      const data = await response.json();
      result.value = data;
    } catch (error) {
      result.value = {
        success: false,
        error: 'Errore di connessione'
      };
    } finally {
      loading.value = false;
    }
  });

  const handleSendReminder = $(async () => {
    loading.value = true;
    result.value = null;

    try {
      const response = await fetch('/api/email/reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email.value,
          title: 'Reminder di Test',
          message: 'Questo è un reminder di test per verificare le notifiche',
          actionUrl: 'http://localhost:5173/gestione',
          actionLabel: 'Vai al Pannello Admin'
        }),
      });

      const data = await response.json();
      result.value = data;
    } catch (error) {
      result.value = {
        success: false,
        error: 'Errore di connessione'
      };
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="min-h-screen bg-gray-50 py-8 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-6">
            Test Integrazione Mailgun
          </h1>

          <div class="space-y-6">
            {/* Configurazione */}
            <div class="border-b pb-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                Configurazione
              </h2>
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-sm text-blue-900 mb-2">
                  <strong>Variabili d'ambiente richieste (.env):</strong>
                </p>
                <ul class="text-sm text-blue-800 space-y-1 ml-4">
                  <li>• MAILGUN_API_KEY - La tua API key di Mailgun</li>
                  <li>• MAILGUN_DOMAIN - Il dominio configurato su Mailgun</li>
                  <li>• MAILGUN_FROM_EMAIL - Email mittente</li>
                  <li>• ADMIN_EMAIL - Email admin per le notifiche</li>
                </ul>
              </div>
            </div>

            {/* Test Email Generica */}
            <div class="border-b pb-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                1. Test Email Generica
              </h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Email destinatario
                  </label>
                  <input
                    type="email"
                    value={email.value}
                    onInput$={(e) => email.value = (e.target as HTMLInputElement).value}
                    placeholder="tua-email@esempio.com"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Oggetto
                  </label>
                  <input
                    type="text"
                    value={subject.value}
                    onInput$={(e) => subject.value = (e.target as HTMLInputElement).value}
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Messaggio
                  </label>
                  <textarea
                    value={message.value}
                    onInput$={(e) => message.value = (e.target as HTMLTextAreaElement).value}
                    rows={3}
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick$={handleSendTest}
                  disabled={loading.value || !email.value}
                  class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {loading.value ? 'Invio in corso...' : 'Invia Email di Test'}
                </button>
              </div>
            </div>

            {/* Test Notifica Task */}
            <div class="border-b pb-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                2. Test Notifica Nuova Task
              </h2>
              <p class="text-sm text-gray-600 mb-4">
                Invia una notifica all'email admin configurata in ADMIN_EMAIL
              </p>
              <button
                onClick$={handleSendTaskNotification}
                disabled={loading.value}
                class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading.value ? 'Invio in corso...' : 'Invia Notifica Task'}
              </button>
            </div>

            {/* Test Reminder */}
            <div class="pb-6">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                3. Test Reminder
              </h2>
              <p class="text-sm text-gray-600 mb-4">
                Invia un reminder all'email specificata sopra
              </p>
              <button
                onClick$={handleSendReminder}
                disabled={loading.value || !email.value}
                class="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading.value ? 'Invio in corso...' : 'Invia Reminder'}
              </button>
            </div>

            {/* Risultato */}
            {result.value && (
              <div class={`p-4 rounded-lg ${
                result.value.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 class={`font-semibold mb-2 ${
                  result.value.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.value.success ? '✓ Successo!' : '✗ Errore'}
                </h3>
                <pre class={`text-sm overflow-auto ${
                  result.value.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {JSON.stringify(result.value, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Documentazione */}
        <div class="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            Come Usare nelle tue Routes/Componenti
          </h2>

          <div class="space-y-4 text-sm">
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">Esempio 1: Inviare email generica</h3>
              <pre class="bg-gray-50 p-4 rounded-lg overflow-auto">
{`import { sendEmail } from '~/utils/mailgun';

// In una route o action
const result = await sendEmail({
  to: 'utente@esempio.com',
  subject: 'Benvenuto!',
  html: '<h1>Benvenuto in JudoOK!</h1>',
  text: 'Benvenuto in JudoOK!'
});`}
              </pre>
            </div>

            <div>
              <h3 class="font-semibold text-gray-900 mb-2">Esempio 2: Notifica task (dal form admin)</h3>
              <pre class="bg-gray-50 p-4 rounded-lg overflow-auto">
{`import { sendAdminTaskNotification } from '~/utils/mailgun';

// Dopo aver creato una task
await sendAdminTaskNotification({
  title: taskData.titolo,
  description: taskData.descrizione,
  priority: taskData.priorita,
  createdBy: 'Admin'
});`}
              </pre>
            </div>

            <div>
              <h3 class="font-semibold text-gray-900 mb-2">Esempio 3: Inviare reminder</h3>
              <pre class="bg-gray-50 p-4 rounded-lg overflow-auto">
{`import { sendReminderEmail } from '~/utils/mailgun';

await sendReminderEmail({
  to: 'admin@esempio.com',
  title: 'Scadenza imminente',
  message: 'La task deve essere completata entro domani',
  actionUrl: 'https://judook.com/gestione',
  actionLabel: 'Vedi Task'
});`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Test Mailgun - JudoOK Admin',
  meta: [
    {
      name: 'description',
      content: 'Pagina di test per verificare l\'integrazione con Mailgun',
    },
  ],
};
