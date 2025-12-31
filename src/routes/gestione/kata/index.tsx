import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

interface KataItem {
    id: string;
    name: string;
    japanese_name: string;
    level: string;
}

export default component$(() => {
    const searchTerm = useSignal('');
    const kataList = useSignal<KataItem[]>([]);
    const isLoading = useSignal(true);
    const selectedIds = useSignal<string[]>([]);
    const isDeleting = useSignal(false);

    const fetchKata = $(async () => {
        isLoading.value = true;
        try {
            const filter = searchTerm.value
                ? `name ~ "${searchTerm.value}" || japanese_name ~ "${searchTerm.value}"`
                : '';

            const records = await pbAdmin.collection('kata').getFullList({
                sort: 'name',
                filter: filter || undefined,
                requestKey: null,
            });

            kataList.value = records.map(r => ({
                id: r.id,
                name: r.name,
                japanese_name: r.japanese_name,
                level: r.level,
            })) as KataItem[];
        } catch (e) {
            console.error('[Admin Kata] Error:', e);
            kataList.value = [];
        } finally {
            isLoading.value = false;
        }
    });

    useVisibleTask$(async ({ track }) => {
        track(() => searchTerm.value);
        selectedIds.value = []; // Reset sub-selection on search
        fetchKata();
    });

    const handleDelete = $(async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo Kata?')) return;
        try {
            await pbAdmin.collection('kata').delete(id);
            kataList.value = kataList.value.filter(item => item.id !== id);
            selectedIds.value = selectedIds.value.filter(sid => sid !== id);
        } catch (e) {
            alert('Errore durante l\'eliminazione');
        }
    });

    const handleBulkDelete = $(async () => {
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.value.length} Kata selezionati?`)) return;

        isDeleting.value = true;
        try {
            for (const id of selectedIds.value) {
                await pbAdmin.collection('kata').delete(id);
            }
            kataList.value = kataList.value.filter(item => !selectedIds.value.includes(item.id));
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
        if (selectedIds.value.length === kataList.value.length && kataList.value.length > 0) {
            selectedIds.value = [];
        } else {
            selectedIds.value = kataList.value.map(item => item.id);
        }
    });

    return (
        <div class="space-y-10 animate-in fade-in duration-700">
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestione Kata</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Modifica le descrizioni e i video dei Kata.</p>
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
                        href="/gestione/kata/new"
                        class="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-500/25 transform hover:-translate-y-1"
                    >
                        <span class="text-xl">➕</span>
                        Nuovo Kata
                    </Link>
                </div>
            </header>

            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div class="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div class="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Cerca Kata..."
                            value={searchTerm.value}
                            onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
                            class="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white font-bold"
                        />
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    {isLoading.value ? (
                        <div class="p-20 flex justify-center">
                            <div class="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-800/50">
                                    <th class="px-6 py-4 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={kataList.value.length > 0 && selectedIds.value.length === kataList.value.length}
                                            onClick$={toggleSelectAll}
                                            class="w-5 h-5 rounded-lg accent-red-600 cursor-pointer"
                                        />
                                    </th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nome</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Giapponese</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Livello</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                {kataList.value.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} class="px-6 py-20 text-center text-gray-500 dark:text-gray-400 font-bold">
                                            Nessun Kata trovato.
                                        </td>
                                    </tr>
                                ) : (
                                    kataList.value.map(kata => (
                                        <tr key={kata.id} class={`group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.value.includes(kata.id) ? 'bg-red-50/20 dark:bg-red-900/10' : ''}`}>
                                            <td class="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.value.includes(kata.id)}
                                                    onClick$={() => toggleSelect(kata.id)}
                                                    class="w-5 h-5 rounded-lg accent-red-600 cursor-pointer"
                                                />
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                                {kata.name}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 italic">
                                                {kata.japanese_name || '-'}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    {kata.level || '-'}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-right">
                                                <div class="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={`/gestione/kata/${kata.id}`}
                                                        class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors"
                                                        title="Modifica"
                                                    >
                                                        ✏️
                                                    </a>
                                                    <button
                                                        onClick$={() => handleDelete(kata.id)}
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
                    {kataList.value.length} Kata • {selectedIds.value.length} selezionati
                </div>
            </div>
        </div>
    );
});
