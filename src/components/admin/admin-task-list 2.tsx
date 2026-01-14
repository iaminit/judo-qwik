import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { ReminderModal } from './reminder-modal';

interface TaskAdmin {
    id: string;
    titolo: string;
    contenuto?: string;
    descrizione_breve?: string;
    completato: boolean;
    priorita: 'bassa' | 'media' | 'alta' | 'urgente';
    stato: 'aperto' | 'in_corso' | 'bloccato' | 'completato';
    assegnato_a_id?: string;
    data_riferimento?: string;
    in_evidenza?: boolean;
    promemoria_inviato?: boolean;
    created: string;
    expand?: {
        assegnato_a_id?: {
            name?: string;
            email?: string;
        };
    };
}

interface AdminTaskListProps {
    onRefresh: () => Promise<void>;
}

export const AdminTaskList = component$<AdminTaskListProps>(({ onRefresh }) => {
    const tasks = useSignal<TaskAdmin[]>([]);
    const isLoading = useSignal(true);
    const isReminderModalOpen = useSignal(false);
    const selectedTask = useSignal<TaskAdmin | null>(null);

    const fetchTasks = $(async () => {
        isLoading.value = true;
        try {
            console.log('[AdminTaskList] Fetching tasks from task_admin...');
            console.log('[AdminTaskList] Auth state:', {
                isValid: pbAdmin.authStore.isValid,
                token: pbAdmin.authStore.token ? 'EXISTS' : 'MISSING'
            });

            const results = await pbAdmin.collection('task_admin').getFullList({
                requestKey: null,
                expand: 'assegnato_a_id', // Espandi relazione utente
            });

            console.log('[AdminTaskList] ✅ Fetched tasks:', results.length);
            if (results.length > 0) {
                console.log('[AdminTaskList] First task:', results[0]);
            }

            tasks.value = results as any[];
        } catch (e: any) {
            console.error('[AdminTaskList] ❌ Error fetching tasks:', {
                message: e.message,
                status: e.status,
                data: e.data
            });
            tasks.value = [];
        } finally {
            isLoading.value = false;
        }
    });

    useVisibleTask$(() => {
        fetchTasks();
    });

    const toggleComplete = $(async (taskId: string, currentStatus: boolean) => {
        try {
            const nuovoStato = !currentStatus;
            await pbAdmin.collection('task_admin').update(taskId, {
                completato: nuovoStato,
                stato: nuovoStato ? 'completato' : 'aperto'
            });
            await fetchTasks();
        } catch (e) {
            alert('Errore nell\'aggiornamento del task');
        }
    });

    const deleteTask = $(async (taskId: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo task?')) return;
        try {
            await pbAdmin.collection('task_admin').delete(taskId);
            await fetchTasks();
        } catch (e) {
            alert('Errore nell\'eliminazione del task');
        }
    });

    const openReminderModal = $((task: TaskAdmin) => {
        selectedTask.value = task;
        isReminderModalOpen.value = true;
    });

    const getPriorityColor = (priorita: string) => {
        switch (priorita) {
            case 'urgente': return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
            case 'alta': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
            case 'media': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            case 'bassa': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getPriorityIcon = (priorita: string) => {
        switch (priorita) {
            case 'urgente': return '🔴';
            case 'alta': return '🟠';
            case 'media': return '🔵';
            case 'bassa': return '⚪';
            default: return '⚪';
        }
    };

    const getStatoColor = (stato: string) => {
        switch (stato) {
            case 'completato': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
            case 'in_corso': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
            case 'bloccato': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
            case 'aperto': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    if (isLoading.value) {
        return (
            <div class="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} class="h-16 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (tasks.value.length === 0) {
        return (
            <div class="text-center py-12">
                <div class="text-5xl mb-4">✓</div>
                <p class="text-gray-400 font-bold text-sm">Nessun task in sospeso</p>
            </div>
        );
    }

    return (
        <div class="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {tasks.value.map(task => (
                <div
                    key={task.id}
                    class={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${task.completato
                        ? 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 opacity-60'
                        : task.in_evidenza
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 shadow-sm'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
                        }`}
                >
                    {/* Pin indicator per task in evidenza */}
                    {task.in_evidenza && !task.completato && (
                        <div class="absolute top-2 right-2 text-xs">📌</div>
                    )}

                    {/* Checkbox */}
                    <button
                        onClick$={() => toggleComplete(task.id, task.completato)}
                        class={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completato
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                            }`}
                    >
                        {task.completato && <span class="text-white text-sm">✓</span>}
                    </button>

                    {/* Task Content */}
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex-1">
                                <p class={`text-sm font-bold ${task.completato ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {task.titolo || 'Senza Titolo'}
                                </p>
                                {(task.contenuto || task.descrizione_breve) && (
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                        {task.descrizione_breve || task.contenuto}
                                    </p>
                                )}
                                {/* Mostra utente assegnato se presente */}
                                {task.expand?.assegnato_a_id && (
                                    <p class="text-[10px] text-gray-400 mt-1">
                                        👤 {task.expand.assegnato_a_id.name || task.expand.assegnato_a_id.email}
                                    </p>
                                )}
                            </div>
                            <div class="flex flex-col items-end gap-1">
                                <span class={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getPriorityColor(task.priorita || 'media')}`}>
                                    {getPriorityIcon(task.priorita || 'media')} {task.priorita || 'media'}
                                </span>
                                {task.stato && task.stato !== 'aperto' && (
                                    <span class={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatoColor(task.stato)}`}>
                                        {task.stato}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Data di riferimento */}
                        {task.data_riferimento && (
                            <p class="text-[10px] text-gray-400 mt-2">
                                📅 {new Date(task.data_riferimento).toLocaleDateString('it-IT')}
                            </p>
                        )}

                        {/* Promemoria già inviato */}
                        {task.promemoria_inviato && (
                            <p class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                                ✉️ Promemoria inviato
                            </p>
                        )}

                        {/* Actions */}
                        <div class="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick$={() => openReminderModal(task)}
                                class="px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                title="Invia promemoria via email"
                            >
                                📧 Sollecita
                            </button>
                            <button
                                onClick$={() => deleteTask(task.id)}
                                class="px-3 py-1.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                                🗑️ Elimina
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            {/* Modal Sollecito */}
            <ReminderModal
                isOpen={isReminderModalOpen.value}
                task={selectedTask.value}
                onClose$={$(() => isReminderModalOpen.value = false)}
                onSent$={$(() => fetchTasks())}
            />
        </div>
    );
});
