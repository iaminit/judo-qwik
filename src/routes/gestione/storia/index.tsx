import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
    const activeTab = useSignal<'articoli' | 'timeline'>('articoli');
    const historyList = useSignal<any[]>([]);
    const timelineList = useSignal<any[]>([]);
    const isLoading = useSignal(true);
    const selectedIds = useSignal<string[]>([]);
    const isDeleting = useSignal(false);

    useVisibleTask$(async ({ track }) => {
        track(() => activeTab.value);
        isLoading.value = true;
        selectedIds.value = []; // Reset sub-selection

        try {
            if (activeTab.value === 'articoli') {
                console.log('[Admin Storia] Fetching articles from storia...');
                // Articles: filter by tags containing 'articolo' or simply items without anno if that's the logic
                const results = await pbAdmin.collection('storia').getFullList({
                    filter: 'tags ~ "articolo" || anno = null',
                    sort: 'ordine,titolo',
                    requestKey: null
                });
                console.log('[Admin Storia] ✅ Fetched history items:', results.length);
                historyList.value = results;
            } else {
                console.log('[Admin Storia] Fetching timeline from storia...');
                // Timeline: items with anno
                const results = await pbAdmin.collection('storia').getFullList({
                    filter: 'anno != null',
                    sort: 'anno,ordine',
                    requestKey: null
                });
                console.log('[Admin Storia] ✅ Fetched timeline items:', results.length);
                timelineList.value = results;
            }
        } catch (e: any) {
            console.error('[Admin Storia] ERROR:', e.message);
            if (activeTab.value === 'articoli') historyList.value = [];
            else timelineList.value = [];
        } finally {
            isLoading.value = false;
        }
    });

    const handleDelete = $(async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo elemento?')) return;
        try {
            // Both articles and timeline are now in 'storia'
            await pbAdmin.collection('storia').delete(id);
            if (activeTab.value === 'articoli') {
                historyList.value = historyList.value.filter(item => item.id !== id);
            } else {
                timelineList.value = timelineList.value.filter(item => item.id !== id);
            }
            selectedIds.value = selectedIds.value.filter(sid => sid !== id);
        } catch (e) {
            alert('Errore durante l\'eliminazione');
        }
    });

    const handleBulkDelete = $(async () => {
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.value.length} elementi selezionati?`)) return;

        isDeleting.value = true;
        try {
            for (const id of selectedIds.value) {
                await pbAdmin.collection('storia').delete(id);
            }
            if (activeTab.value === 'articoli') {
                historyList.value = historyList.value.filter(item => !selectedIds.value.includes(item.id));
            } else {
                timelineList.value = timelineList.value.filter(item => !selectedIds.value.includes(item.id));
            }
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
        const currentRef = activeTab.value === 'articoli' ? historyList : timelineList;
        if (selectedIds.value.length === currentRef.value.length && currentRef.value.length > 0) {
            selectedIds.value = [];
        } else {
            selectedIds.value = currentRef.value.map(item => item.id);
        }
    });

    return (
        <div class="space-y-10 animate-in fade-in duration-700">
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestione Storia del Judo</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Gestisci gli articoli storici e la cronologia mondiale del Judo.</p>
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
                    <div class="flex gap-2">
                        {activeTab.value === 'articoli' && (
                            <Link href="/gestione/storia/info/new" class="px-6 py-3 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-500/25 transform hover:-translate-y-1 transition-all">➕ Nuovo Articolo</Link>
                        )}
                        {activeTab.value === 'timeline' && (
                            <Link href="/gestione/storia/timeline/new" class="px-6 py-3 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-500/25 transform hover:-translate-y-1 transition-all">➕ Nuovo Evento</Link>
                        )}
                    </div>
                </div>
            </header>

            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div class="flex border-b border-gray-100 dark:border-gray-800">
                    <button onClick$={() => activeTab.value = 'articoli'} class={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab.value === 'articoli' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/10' : 'text-gray-400 hover:text-gray-600'}`}>Articoli Storia</button>
                    <button onClick$={() => activeTab.value = 'timeline'} class={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab.value === 'timeline' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/10' : 'text-gray-400 hover:text-gray-600'}`}>Cronologia</button>
                </div>

                <div class="p-6">
                    <div class="mb-6 flex items-center justify-between">
                        <button
                            onClick$={toggleSelectAll}
                            class="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors flex items-center gap-2"
                        >
                            <input
                                type="checkbox"
                                checked={(activeTab.value === 'articoli' ? historyList.value : timelineList.value).length > 0 && selectedIds.value.length === (activeTab.value === 'articoli' ? historyList.value : timelineList.value).length}
                                class="w-4 h-4 rounded accent-red-600"
                                readOnly
                            />
                            {selectedIds.value.length === (activeTab.value === 'articoli' ? historyList.value : timelineList.value).length ? 'Deseleziona Tutto' : 'Seleziona Tutto'}
                        </button>
                        <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {selectedIds.value.length} selezionati
                        </span>
                    </div>

                    {isLoading.value ? (
                        <div class="py-10 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Caricamento...</div>
                    ) : (
                        <>
                            {activeTab.value === 'articoli' && (
                                <div class="space-y-4">
                                    {historyList.value.length === 0 ? (
                                        <div class="py-10 text-center text-gray-500 font-bold">Nessun articolo trovato.</div>
                                    ) : (
                                        historyList.value.map(item => (
                                            <div key={item.id} class={`group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border transition-all ${selectedIds.value.includes(item.id) ? 'border-red-500/50 bg-red-50/10' : 'border-gray-100 dark:border-gray-700/50'}`}>
                                                <div class="flex items-center gap-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.value.includes(item.id)}
                                                        onClick$={() => toggleSelect(item.id)}
                                                        class="w-5 h-5 rounded-lg accent-red-600 cursor-pointer"
                                                    />
                                                    <div class="w-12 h-12 rounded-xl bg-white dark:bg-gray-900 overflow-hidden border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                                                        {item.immagine_principale ? (
                                                            <img src={pbAdmin.files.getUrl(item, item.immagine_principale, { thumb: '50x50' })} class="w-full h-full object-cover" alt="" />
                                                        ) : <span class="text-xl">📖</span>}
                                                    </div>
                                                    <div>
                                                        <p class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.titolo}</p>
                                                        <p class="text-[10px] font-bold text-red-500 uppercase mt-1">{item.titolo_secondario || 'Storia'}</p>
                                                    </div>
                                                </div>
                                                <div class="flex gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/gestione/storia/info/${item.id}`} class="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors">✏️</Link>
                                                    <button onClick$={() => handleDelete(item.id)} class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors">🗑️</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab.value === 'timeline' && (
                                <div class="space-y-4">
                                    {timelineList.value.length === 0 ? (
                                        <div class="py-10 text-center text-gray-500 font-bold">Nessun evento in timeline trovato.</div>
                                    ) : (
                                        timelineList.value.map(item => (
                                            <div key={item.id} class={`group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border transition-all ${selectedIds.value.includes(item.id) ? 'border-red-500/50 bg-red-50/10' : 'border-gray-100 dark:border-gray-700/50'}`}>
                                                <div class="flex items-center gap-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.value.includes(item.id)}
                                                        onClick$={() => toggleSelect(item.id)}
                                                        class="w-5 h-5 rounded-lg accent-red-600 cursor-pointer"
                                                    />
                                                    <div>
                                                        <p class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight"><span class="text-red-600 mr-2">{item.anno}</span> {item.titolo}</p>
                                                        <p class="text-[10px] text-gray-400 line-clamp-1 mt-1">{item.descrizione_breve || item.contenuto?.substring(0, 100)}</p>
                                                    </div>
                                                </div>
                                                <div class="flex gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/gestione/storia/timeline/${item.id}`} class="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors">✏️</Link>
                                                    <button onClick$={() => handleDelete(item.id)} class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors">🗑️</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});
