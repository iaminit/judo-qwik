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

    useVisibleTask$(async ({ track }) => {
        track(() => searchTerm.value);
        isLoading.value = true;

        try {
            const filter = searchTerm.value
                ? `term ~ "${searchTerm.value}" || kanji ~ "${searchTerm.value}"`
                : '';

            const records = await pbAdmin.collection('dictionary').getFullList({
                sort: 'term',
                filter: filter,
                requestKey: null,
            });

            dictionaryTerms.value = records.map(r => ({
                id: r.id,
                term: r.term,
                kanji: r.kanji,
                description: r.description,
                pronunciation: r.pronunciation,
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

    const handleDelete = $(async (id: string, term: string) => {
        if (confirm(`Sei sicuro di voler eliminare il termine "${term}"?`)) {
            try {
                await pbAdmin.collection('dictionary').delete(id);
                window.location.reload();
            } catch (e: any) {
                alert('Errore: ' + e.message);
            }
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
                <a
                    href="/gestione/dizionario/new"
                    class="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <span>➕</span>
                    <span>Nuovo Termine</span>
                </a>
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
                                        <td colSpan={5} class="px-6 py-20 text-center text-gray-500 dark:text-gray-400 font-bold">
                                            Nessun termine trovato.
                                        </td>
                                    </tr>
                                ) : (
                                    dictionaryTerms.value.map(t => (
                                        <tr key={t.id} class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                                                <div class="flex justify-end gap-1 md:gap-2">
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
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Gestione Dizionario - JudoOK',
};
