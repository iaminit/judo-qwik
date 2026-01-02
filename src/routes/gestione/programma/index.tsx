import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
    const activeDan = useSignal<number | null>(null);
    const programList = useSignal<any[]>([]);
    const isLoading = useSignal(true);
    const selectedIds = useSignal<string[]>([]);
    const isDeleting = useSignal(false);

    const fetchProgram = $(async () => {
        isLoading.value = true;
        try {
            const filter = activeDan.value
                ? `livello = ${activeDan.value} && tags ~ "esame_dan"`
                : 'tags ~ "esame_dan"';

            const records = await pbAdmin.collection('programmi_fijlkam').getFullList({
                sort: 'livello,ordine',
                filter: filter,
                requestKey: null,
            });

            programList.value = records.map(r => ({
                id: r.id,
                titolo: r.titolo,
                livello: r.livello,
                categoria_secondaria: r.categoria_secondaria,
                ordine: r.ordine
            }));
        } catch (e) {
            console.error('[Admin Program] Error:', e);
            programList.value = [];
        } finally {
            isLoading.value = false;
        }
    });

    useVisibleTask$(({ track }) => {
        track(() => activeDan.value);
        fetchProgram();
    });

    const handleDelete = $(async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa sezione del programma?')) return;
        try {
            await pbAdmin.collection('programmi_fijlkam').delete(id);
            programList.value = programList.value.filter(item => item.id !== id);
            selectedIds.value = selectedIds.value.filter(sid => sid !== id);
        } catch (e) {
            alert('Errore durante l\'eliminazione');
        }
    });

    const handleBulkDelete = $(async () => {
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.value.length} sezioni del programma selezionate?`)) return;

        isDeleting.value = true;
        try {
            for (const id of selectedIds.value) {
                await pbAdmin.collection('programmi_fijlkam').delete(id);
            }
            programList.value = programList.value.filter(item => !selectedIds.value.includes(item.id));
            selectedIds.value = [];
        } catch (e: any) {
            alert('Errore durante l\'eliminazione di massa: ' + e.message);
        } finally {
            isDeleting.value = false;
        }
    });

    const toggleSelect = $((id: string) => {
        if (selectedIds.value.includes(id)) {
            selectedIds.value = selectedIds.value.filter(sid => sid !== id);
        } else {
            selectedIds.value = [...selectedIds.value, id];
        }
    });

    const toggleSelectAll = $(() => {
        if (selectedIds.value.length === programList.value.length && programList.value.length > 0) {
            selectedIds.value = [];
        } else {
            selectedIds.value = programList.value.map(item => item.id);
        }
    });

    return (
        <div class="space-y-10 animate-in fade-in duration-700">
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestione Programmi</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Gestisci i requisiti per gli esami DAN.</p>
                </div>
                <div class="flex items-center gap-3">
                    {selectedIds.value.length > 0 && (
                        <button
                            onClick$={handleBulkDelete}
                            disabled={isDeleting.value}
                            class="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold border border-red-100 dark:bg-red-950/20 dark:border-red-900 shadow-sm animate-in slide-in-from-right-4 duration-300"
                        >
                            {isDeleting.value ? 'Eliminazione...' : `Elimina ${selectedIds.value.length} selezionati`}
                        </button>
                    )}
                    <Link
                        href="/gestione/programma/new"
                        class="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-500/25 transform hover:-translate-y-1"
                    >
                        <span class="text-xl">➕</span>
                        Nuova Sezione
                    </Link>
                </div>
            </header>

            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-3">
                    <button
                        onClick$={() => activeDan.value = null}
                        class={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeDan.value === null ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                            }`}
                    >
                        Tutti
                    </button>
                    {[1, 2, 3, 4, 5, 6].map(dan => (
                        <button
                            key={dan}
                            onClick$={() => activeDan.value = dan}
                            class={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeDan.value === dan ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                }`}
                        >
                            {dan}° Dan
                        </button>
                    ))}
                </div>

                <div class="overflow-x-auto">
                    {isLoading.value ? (
                        <div class="p-20 flex justify-center">
                            <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-800/50">
                                    <th class="px-6 py-4 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={programList.value.length > 0 && selectedIds.value.length === programList.value.length}
                                            onClick$={toggleSelectAll}
                                            class="w-5 h-5 rounded-lg accent-indigo-600 cursor-pointer"
                                        />
                                    </th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Dan</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Sezione</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Titolo</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ordine</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                {programList.value.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} class="px-6 py-20 text-center text-gray-500 dark:text-gray-400 font-bold">
                                            Nessun programma trovato.
                                        </td>
                                    </tr>
                                ) : (
                                    programList.value.map(prog => (
                                        <tr key={prog.id} class={`group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.value.includes(prog.id) ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}>
                                            <td class="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.value.includes(prog.id)}
                                                    onClick$={() => toggleSelect(prog.id)}
                                                    class="w-5 h-5 rounded-lg accent-indigo-600 cursor-pointer"
                                                />
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class="font-black text-indigo-600 dark:text-indigo-400">{prog.livello}° DAN</span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    {prog.categoria_secondaria || '-'}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                                                {prog.titolo}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-400">
                                                #{prog.ordine}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-right">
                                                <div class="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={`/gestione/programma/${prog.id}`}
                                                        class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors"
                                                        title="Modifica"
                                                    >
                                                        ✏️
                                                    </a>
                                                    <button
                                                        onClick$={() => handleDelete(prog.id)}
                                                        class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                                        title="Elimina"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div class="p-6 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {programList.value.length} sezioni • {selectedIds.value.length} selezionate
                </div>
            </div>
        </div>
    );
});
