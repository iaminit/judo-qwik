import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { pbAdmin } from '~/lib/pocketbase-admin';

interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
}

interface ReminderModalProps {
    isOpen: boolean;
    task: {
        id: string;
        titolo: string;
        contenuto?: string;
        descrizione_breve?: string;
        priorita: string;
    } | null;
    onClose$: () => void;
    onSent$: () => void;
}

export const ReminderModal = component$<ReminderModalProps>(({ isOpen, task, onClose$, onSent$ }) => {
    const users = useSignal<User[]>([]);
    const isLoading = useSignal(true);
    const isSending = useSignal(false);
    const searchTerm = useSignal('');

    const fetchUsers = $(async () => {
        isLoading.value = true;
        try {
            const results = await pbAdmin.collection('users').getFullList({
                sort: 'name',
            });
            users.value = results as unknown as User[];
        } catch (e) {
            console.error('Error fetching users:', e);
        } finally {
            isLoading.value = false;
        }
    });

    useVisibleTask$(({ track }) => {
        track(() => isOpen);
        if (isOpen) {
            fetchUsers();
        }
    });

    const sendReminder = $(async (userEmail: string, userName: string) => {
        if (!task) return;

        isSending.value = true;

        try {
            // Invia email tramite Mailgun
            const response = await fetch('/api/email/reminder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: userEmail,
                    title: `Sollecito: ${task.titolo}`,
                    message: `Ciao ${userName},\n\nti sollecito per il seguente task:\n\n` +
                        `📌 ${task.titolo}\n` +
                        `📝 ${task.contenuto || task.descrizione_breve || 'Vedi dettagli in dashboard'}\n\n` +
                        `Priorità: ${task.priorita.toUpperCase()}\n\n` +
                        `Grazie per la collaborazione!`,
                    actionUrl: `${window.location.origin}/gestione`,
                    actionLabel: 'Vai alla Dashboard'
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Tracciamo l'azione nel database
                await pbAdmin.collection('task_admin').update(task.id, {
                    promemoria_inviato: true,
                    promemoria_data: new Date().toISOString()
                });
                onSent$();
                onClose$();
            } else {
                console.error('Errore invio reminder:', result.error);
                alert('Errore durante l\'invio del promemoria. Riprova.');
            }
        } catch (e) {
            console.error('Error sending reminder:', e);
            alert('Errore di connessione. Verifica la configurazione Mailgun.');
        } finally {
            isSending.value = false;
        }
    });

    if (!isOpen || !task) return null;

    const filteredUsers = users.value.filter(u =>
        (u.name || '').toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.value.toLowerCase())
    );

    return (
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div onClick$={onClose$} class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

            <div class="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div class="p-6 border-b border-gray-100 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/10">
                    <h2 class="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span>📧</span> Sollecita Collaboratore
                    </h2>
                    <p class="text-xs text-gray-500 mt-1">Seleziona un utente per inviare un promemoria per:</p>
                    <p class="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5 line-clamp-1">"{task.titolo}"</p>
                </div>

                {/* Search */}
                <div class="p-4 border-b border-gray-100 dark:border-gray-800">
                    <input
                        type="text"
                        placeholder="Cerca per nome o email..."
                        value={searchTerm.value}
                        onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
                        class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {/* List */}
                <div class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {isLoading.value ? (
                        <div class="flex flex-col gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} class="h-12 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                            <button
                                key={user.id}
                                disabled={isSending.value}
                                onClick$={() => sendReminder(user.email, user.name)}
                                class="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {(user.name || user.email)[0].toUpperCase()}
                                </div>
                                <div class="flex-1 text-left">
                                    <p class="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {user.name || 'Utente senza nome'}
                                    </p>
                                    <p class="text-[10px] text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                                <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span class="text-blue-500">➜</span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div class="text-center py-10 text-gray-400 text-sm">
                            Nessun utente trovato
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div class="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                    <button
                        onClick$={onClose$}
                        disabled={isSending.value}
                        class="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending.value ? 'Invio in corso...' : 'Annulla'}
                    </button>
                </div>
            </div>
        </div>
    );
});
