import { component$, useSignal, $, type QRL } from '@builder.io/qwik';
import { pbAdmin } from '~/lib/pocketbase-admin';

interface TaskModalProps {
    isOpen: boolean;
    onClose: QRL<() => void>;
    onTaskCreated: QRL<() => void>;
}

export const TaskModal = component$<TaskModalProps>(({ isOpen, onClose, onTaskCreated }) => {
    const title = useSignal('');
    const description = useSignal('');
    const shortDescription = useSignal('');
    const tags = useSignal('');
    const referenceDate = useSignal('');
    const priority = useSignal<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const status = useSignal<'aperto' | 'in_corso' | 'bloccato' | 'completato'>('aperto');
    const assignedToId = useSignal('');
    const authorId = useSignal('');
    const completed = useSignal(false);
    const published = useSignal(true);
    const featured = useSignal(false);
    const reminderSent = useSignal(false);
    const reminderDate = useSignal('');
    const isSubmitting = useSignal(false);
    const error = useSignal('');

    const handleSubmit = $(async (e: Event) => {
        e.preventDefault();

        if (!title.value.trim()) {
            error.value = 'Il titolo è obbligatorio';
            return;
        }

        isSubmitting.value = true;
        error.value = '';

        const taskData = {
            titolo: title.value.trim(),
            contenuto: description.value.trim(),
            descrizione_breve: shortDescription.value.trim(),
            tags: tags.value.trim(),
            data_riferimento: referenceDate.value || '',
            priorita: priority.value === 'low' ? 'bassa' :
                priority.value === 'medium' ? 'media' :
                    priority.value === 'high' ? 'alta' : 'urgente',
            completato: completed.value,
            stato: status.value,
            assegnato_a_id: assignedToId.value.trim(),
            autore_id: authorId.value.trim(),
            pubblicato: published.value,
            in_evidenza: featured.value,
            promemoria_inviato: reminderSent.value,
            promemoria_data: reminderDate.value ? new Date(reminderDate.value).toISOString() : '',
        };

        console.log('[TaskModal] Creating task in task_admin with data:', taskData);

        try {
            const result = await pbAdmin.collection('task_admin').create(taskData);
            console.log('[TaskModal] ✅ Task created successfully in task_admin:', result);

            // Invia notifica email all'admin
            try {
                const emailResponse = await fetch('/api/email/task-notification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: taskData.titolo,
                        description: taskData.contenuto || 'Nessuna descrizione',
                        priority: taskData.priorita,
                        createdBy: 'Admin Dashboard'
                    }),
                });

                const emailResult = await emailResponse.json();
                if (emailResult.success) {
                    console.log('[TaskModal] ✉️ Email notification sent successfully');
                } else {
                    console.warn('[TaskModal] ⚠️ Email notification failed:', emailResult.error);
                }
            } catch (emailError) {
                console.error('[TaskModal] ⚠️ Error sending email notification:', emailError);
                // Non bloccare il flusso se l'email fallisce
            }

            // Reset form
            title.value = '';
            description.value = '';
            shortDescription.value = '';
            tags.value = '';
            referenceDate.value = '';
            priority.value = 'medium';
            status.value = 'aperto';
            assignedToId.value = '';
            authorId.value = '';
            completed.value = false;
            published.value = true;
            featured.value = false;
            reminderSent.value = false;
            reminderDate.value = '';

            onTaskCreated();
            onClose();
        } catch (e: any) {
            console.error('[TaskModal] ❌ Error creating task:', e);
            error.value = e.message || 'Errore nella creazione del task';
        } finally {
            isSubmitting.value = false;
        }
    });

    const priorityOptions = [
        { value: 'low', label: 'Bassa', emoji: '⚪', color: 'gray' },
        { value: 'medium', label: 'Media', emoji: '🔵', color: 'blue' },
        { value: 'high', label: 'Alta', emoji: '🟠', color: 'orange' },
        { value: 'urgent', label: 'Urgente', emoji: '🔴', color: 'red' }
    ];

    if (!isOpen) return null;

    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                onClick$={onClose}
                class="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></div>

            {/* Modal */}
            <div class="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div class="bg-gradient-to-r from-red-600 to-red-500 px-8 py-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <span class="text-2xl">✓</span>
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-white">Nuovo Task</h2>
                                <p class="text-sm text-white/80">Crea un nuovo task amministrativo</p>
                            </div>
                        </div>
                        <button
                            onClick$={onClose}
                            class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form preventdefault:submit onSubmit$={handleSubmit} class="p-8 space-y-6 max-h-[calc(90vh-112px)] overflow-y-auto">
                    {/* Error Message */}
                    {error.value && (
                        <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg animate-in slide-in-from-top-2">
                            <p class="text-sm font-bold text-red-600 dark:text-red-400">❌ {error.value}</p>
                        </div>
                    )}

                    {/* Title */}
                    <div class="space-y-2">
                        <label class="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Titolo Task *
                        </label>
                        <input
                            type="text"
                            name="titolo"
                            value={title.value}
                            onInput$={(e) => title.value = (e.target as HTMLInputElement).value}
                            placeholder="es. Aggiornare foto tecniche"
                            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium"
                            maxLength={200}
                        />
                    </div>

                    {/* Description */}
                    <div class="space-y-2">
                        <label class="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Descrizione (opzionale)
                        </label>
                        <textarea
                            name="contenuto"
                            value={description.value}
                            onInput$={(e) => description.value = (e.target as HTMLTextAreaElement).value}
                            placeholder="Aggiungi dettagli sul task..."
                            rows={3}
                            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium resize-none"
                            maxLength={500}
                        ></textarea>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Descrizione breve
                            </label>
                            <input
                                name="descrizione_breve"
                                value={shortDescription.value}
                                onInput$={(e) => shortDescription.value = (e.target as HTMLInputElement).value}
                                class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">Tag</label>
                            <input
                                name="tags"
                                value={tags.value}
                                onInput$={(e) => tags.value = (e.target as HTMLInputElement).value}
                                class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">Data riferimento</label>
                            <input
                                type="date"
                                name="data_riferimento"
                                value={referenceDate.value}
                                onInput$={(e) => referenceDate.value = (e.target as HTMLInputElement).value}
                                class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">Stato</label>
                            <select
                                name="stato"
                                value={status.value}
                                onChange$={(e) => status.value = (e.target as HTMLSelectElement).value as typeof status.value}
                                class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            >
                                <option value="aperto">Aperto</option>
                                <option value="in_corso">In corso</option>
                                <option value="bloccato">Bloccato</option>
                                <option value="completato">Completato</option>
                            </select>
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">ID assegnatario</label>
                            <input
                                name="assegnato_a_id"
                                value={assignedToId.value}
                                onInput$={(e) => assignedToId.value = (e.target as HTMLInputElement).value}
                                class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">ID autore</label>
                            <input
                                name="autore_id"
                                value={authorId.value}
                                onInput$={(e) => authorId.value = (e.target as HTMLInputElement).value}
                                class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">Data promemoria</label>
                            <input
                                type="datetime-local"
                                name="promemoria_data"
                                value={reminderDate.value}
                                onInput$={(e) => reminderDate.value = (e.target as HTMLInputElement).value}
                                class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Priority */}
                    <div class="space-y-3">
                        <input type="hidden" name="priorita" value={priority.value} />
                        <label class="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Priorità
                        </label>
                        <div class="grid grid-cols-2 gap-3">
                            {priorityOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick$={() => priority.value = opt.value as any}
                                    class={`px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm flex items-center gap-2 ${priority.value === opt.value
                                        ? `border-${opt.color}-500 bg-${opt.color}-50 dark:bg-${opt.color}-900/20 text-${opt.color}-600 dark:text-${opt.color}-400 ring-2 ring-${opt.color}-500/20`
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                        }`}
                                >
                                    <span class="text-lg">{opt.emoji}</span>
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-5 text-sm font-bold">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" name="completato" checked={completed.value} onChange$={(e) => completed.value = (e.target as HTMLInputElement).checked} />
                            Completato
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" name="pubblicato" checked={published.value} onChange$={(e) => published.value = (e.target as HTMLInputElement).checked} />
                            Pubblicato
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" name="in_evidenza" checked={featured.value} onChange$={(e) => featured.value = (e.target as HTMLInputElement).checked} />
                            In evidenza
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" name="promemoria_inviato" checked={reminderSent.value} onChange$={(e) => reminderSent.value = (e.target as HTMLInputElement).checked} />
                            Promemoria inviato
                        </label>
                    </div>

                    {/* Actions */}
                    <div class="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick$={onClose}
                            class="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting.value}
                            class="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                        >
                            {isSubmitting.value ? (
                                <span class="flex items-center justify-center gap-2">
                                    <span class="animate-spin">⏳</span> Creazione...
                                </span>
                            ) : (
                                '✓ Crea Task'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});
