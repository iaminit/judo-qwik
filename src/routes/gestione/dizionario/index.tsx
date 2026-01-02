import { component$, useSignal, useResource$, Resource, $, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

interface DictionaryTerm {
    id: string;
    term: string;
    kanji: string;
    description: string;
    pronunciation: string;
    audio: string;
    collectionId: string;
}

export default component$(() => {
    const searchTerm = useSignal('');
    const dictionaryTerms = useSignal<DictionaryTerm[]>([]);
    const isLoading = useSignal(true);
    const selectedIds = useSignal<string[]>([]);
    const isDeleting = useSignal(false);

    const fetchDictionary = $(async () => {
        isLoading.value = true;
        try {
            const filter = searchTerm.value
                ? `titolo ~ "${searchTerm.value}" || titolo_secondario ~ "${searchTerm.value}"`
                : '';

            const records = await pbAdmin.collection('dizionario').getFullList({
                sort: 'titolo',
                filter: filter,
                requestKey: null,
            });

            dictionaryTerms.value = records.map(r => ({
                id: r.id,
                term: r.titolo,
                kanji: r.titolo_secondario,
                description: r.contenuto,
                pronunciation: r.categoria_secondaria,
                audio: r.audio,
                collectionId: r.collectionId
            })) as DictionaryTerm[];
        } catch (e) {
            console.error('Error fetching dictionary:', e);
            dictionaryTerms.value = [];
        } finally {
            isLoading.value = false;
        }
    });

    useVisibleTask$(({ track }) => {
        track(() => searchTerm.value);
        selectedIds.value = []; // Reset sub-selection on search
        fetchDictionary();
    });

    const handleDelete = $(async (id: string, term: string) => {
        if (!confirm(`Sei sicuro di voler eliminare il termine "${term}"?`)) return;
        try {
            await pbAdmin.collection('dizionario').delete(id);
            dictionaryTerms.value = dictionaryTerms.value.filter(t => t.id !== id);
            selectedIds.value = selectedIds.value.filter(sid => sid !== id);
        } catch (e: any) {
            alert('Errore: ' + e.message);
        }
    });

    const handleBulkDelete = $(async () => {
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.value.length} termini selezionati?`)) return;

        isDeleting.value = true;
        try {
            for (const id of selectedIds.value) {
                await pbAdmin.collection('dizionario').delete(id);
            }
            dictionaryTerms.value = dictionaryTerms.value.filter(t => !selectedIds.value.includes(t.id));
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
        if (selectedIds.value.length === dictionaryTerms.value.length) {
            selectedIds.value = [];
        } else {
            selectedIds.value = dictionaryTerms.value.map(t => t.id);
        }
    });

    return (
        <div class="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Dizionario Giapponese</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Gestisci i termini, i kanji e le pronunce audio.</p>
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
                    <a
                        href="/gestione/dizionario/new"
                        class="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <span>➕</span>
                        <span>Nuovo Termine</span>
                    </a>
                </div>
            </div>

            {/* Table Section */}
            <div class="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {/* Search Bar */}
                <div class="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div class="relative max-w-md">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Cerca termine o kanji..."
                            class="w-full pl-12 pr-6 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-medium"
                            onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
                        />
                    </div>
                </div>

                {/* Table */}
                <div class="overflow-x-auto">
                    {isLoading.value ? (
                        <div class="p-20 flex justify-center">
                            <div class="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-800/50">
                                    <th class="px-6 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={dictionaryTerms.value.length > 0 && selectedIds.value.length === dictionaryTerms.value.length}
                                            onClick$={toggleSelectAll}
                                            class="w-5 h-5 rounded-lg accent-emerald-600 cursor-pointer"
                                        />
                                    </th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Termine</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Kanji</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Pronuncia</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Audio</th>
                                    <th class="px-3 md:px-6 py-4 text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                {dictionaryTerms.value.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} class="px-6 py-20 text-center text-gray-500 dark:text-gray-400 font-bold">
                                            Nessun termine trovato.
                                        </td>
                                    </tr>
                                ) : (
                                    dictionaryTerms.value.map(t => (
                                        <tr key={t.id} class={`group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.value.includes(t.id) ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                                            <td class="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.value.includes(t.id)}
                                                    onClick$={() => toggleSelect(t.id)}
                                                    class="w-5 h-5 rounded-lg accent-emerald-600 cursor-pointer"
                                                />
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                                {t.term}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap font-serif text-xl text-emerald-600 dark:text-emerald-400">
                                                {t.kanji}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium italic">
                                                {t.pronunciation}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                {t.audio ? (
                                                    <span class="text-xl" title="Audio presente">🔊</span>
                                                ) : (
                                                    <span class="text-xl opacity-20" title="Senza audio">🔇</span>
                                                )}
                                            </td>
                                            <td class="px-3 md:px-6 py-4 whitespace-nowrap text-right">
                                                <div class="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={`/gestione/dizionario/${t.id}`}
                                                        class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-colors"
                                                        title="Modifica"
                                                    >
                                                        <span class="text-lg md:text-xl">✏️</span>
                                                    </a>
                                                    <button
                                                        onClick$={() => handleDelete(t.id, t.term)}
                                                        class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                                                        title="Elimina"
                                                    >
                                                        <span class="text-lg md:text-xl">🗑️</span>
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
                    {dictionaryTerms.value.length} record trovati • {selectedIds.value.length} selezionati
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Gestione Dizionario - JudoOK',
};
