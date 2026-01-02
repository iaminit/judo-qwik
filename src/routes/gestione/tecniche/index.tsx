import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
    const searchTerm = useSignal('');
    const techList = useSignal<any[]>([]);
    const isLoading = useSignal(true);
    const selectedIds = useSignal<string[]>([]);
    const isDeleting = useSignal(false);

    const fetchTechniques = $(async () => {
        isLoading.value = true;
        try {
            const filter = searchTerm.value
                ? `titolo ~ "${searchTerm.value}" || tags ~ "${searchTerm.value}"`
                : '';

            const records = await pbAdmin.collection('tecniche').getFullList({
                sort: 'tags,ordine,titolo',
                filter: filter,
                requestKey: null,
            });

            const processed = records.map(r => {
                let previewUrl = '';
                const processImageUrl = (record: any, fileName: string) => {
                    if (!fileName) return '';
                    if (fileName.startsWith('media/')) return '/' + fileName;
                    return pbAdmin.files.getUrl(record, fileName, { thumb: '100x120' });
                };

                const getSlugFallback = (name: string) => {
                    const slug = name.toLowerCase().trim()
                        .replace(/ō/g, 'o').replace(/ū/g, 'u').replace(/ā/g, 'a')
                        .replace(/ī/g, 'i').replace(/ē/g, 'e').replace(/[\s/]+/g, '-')
                        .replace(/[^-a-z0-9]/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
                    return '/media/' + slug + '.webp';
                };

                if (r.immagine_principale) {
                    previewUrl = processImageUrl(r, r.immagine_principale);
                } else {
                    previewUrl = getSlugFallback(r.titolo);
                }

                return {
                    id: r.id,
                    name: r.titolo,
                    group: r.tags,
                    order: r.ordine,
                    previewUrl: previewUrl
                };
            });

            techList.value = processed;
        } catch (e) {
            console.error('[Admin] Error fetching techniques:', e);
        } finally {
            isLoading.value = false;
        }
    });

    useVisibleTask$(({ track }) => {
        track(() => searchTerm.value);
        selectedIds.value = []; // Reset sub-selection on search
        fetchTechniques();
    });

    const handleDelete = $(async (id: string, name: string) => {
        if (!confirm(`Sei sicuro di voler eliminare la tecnica "${name}"?`)) return;
        try {
            await pbAdmin.collection('tecniche').delete(id);
            techList.value = techList.value.filter(t => t.id !== id);
            selectedIds.value = selectedIds.value.filter(sid => sid !== id);
        } catch (e: any) {
            alert('Errore: ' + e.message);
        }
    });

    const handleBulkDelete = $(async () => {
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.value.length} tecniche selezionate?`)) return;

        isDeleting.value = true;
        try {
            // Delete one by one
            for (const id of selectedIds.value) {
                await pbAdmin.collection('tecniche').delete(id);
            }
            techList.value = techList.value.filter(t => !selectedIds.value.includes(t.id));
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
        if (selectedIds.value.length === techList.value.length) {
            selectedIds.value = [];
        } else {
            selectedIds.value = techList.value.map(t => t.id);
        }
    });

    return (
        <div class="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestione Tecniche</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Gestisci il database delle tecniche di Judo.</p>
                </div>
                <div class="flex items-center gap-3">
                    {selectedIds.value.length > 0 && (
                        <button
                            onClick$={handleBulkDelete}
                            disabled={isDeleting.value}
                            class="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold border border-red-100 dark:bg-red-950/20 dark:border-red-900 shadow-sm"
                        >
                            {isDeleting.value ? 'Eliminazione...' : `Elimina ${selectedIds.value.length} selezionate`}
                        </button>
                    )}
                    <a
                        href="/gestione/tecniche/new"
                        class="bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <span>➕</span>
                        <span>Nuova Tecnica</span>
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
                            placeholder="Cerca tecnica o gruppo..."
                            class="w-full pl-12 pr-6 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white font-medium"
                            onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
                        />
                    </div>
                </div>

                {/* Table */}
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-800/50">
                                <th class="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={techList.value.length > 0 && selectedIds.value.length === techList.value.length}
                                        onClick$={toggleSelectAll}
                                        class="w-5 h-5 rounded-lg accent-red-600 cursor-pointer"
                                    />
                                </th>
                                <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Anteprima</th>
                                <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nome</th>
                                <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Gruppo</th>
                                <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ordine</th>
                                <th class="px-3 md:px-6 py-4 text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                            {isLoading.value ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} class="animate-pulse">
                                        <td colSpan={6} class="px-6 py-8">
                                            <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : techList.value.length === 0 ? (
                                <tr>
                                    <td colSpan={6} class="px-6 py-20 text-center text-gray-500 dark:text-gray-400 font-bold">
                                        Nessuna tecnica trovata.
                                    </td>
                                </tr>
                            ) : (
                                techList.value.map(tech => (
                                    <tr key={tech.id} class={`group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.value.includes(tech.id) ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                        <td class="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.value.includes(tech.id)}
                                                onClick$={() => toggleSelect(tech.id)}
                                                class="w-5 h-5 rounded-lg accent-red-600 cursor-pointer"
                                            />
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center p-1">
                                                {tech.previewUrl ? (
                                                    <img
                                                        src={tech.previewUrl}
                                                        alt={tech.name}
                                                        class="max-w-full max-h-full object-contain"
                                                        onError$={(e) => {
                                                            (e.target as HTMLImageElement).src = '/media/kano_non_sa.webp';
                                                            (e.target as HTMLImageElement).classList.add('grayscale');
                                                        }}
                                                    />
                                                ) : (
                                                    <span class="text-2xl">🥋</span>
                                                )}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                            {tech.name}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                                {tech.group}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-400">
                                            #{tech.order}
                                        </td>
                                        <td class="px-3 md:px-6 py-4 whitespace-nowrap text-right">
                                            <div class="flex justify-end gap-1 md:gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                                <a
                                                    href={`/gestione/tecniche/${tech.id}`}
                                                    class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-colors"
                                                    title="Modifica"
                                                >
                                                    <span class="text-lg md:text-xl">✏️</span>
                                                </a>
                                                <button
                                                    onClick$={() => handleDelete(tech.id, tech.name)}
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
                </div>

                <div class="p-6 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {techList.value.length} record trovati • {selectedIds.value.length} selezionati
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Gestione Tecniche - JudoOK',
};
