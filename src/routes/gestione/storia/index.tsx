import { component$, useSignal, useResource$, Resource, $, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
    const activeTab = useSignal<'articol' | 'timeline'>('articol');
    const isClient = useSignal(false);

    useVisibleTask$(() => {
        isClient.value = true;
    });

    const historyItems = useResource$<any[]>(async ({ track }) => {
        track(() => activeTab.value);
        track(() => isClient.value);
        if (!isClient.value || activeTab.value !== 'articol') return [];
        return await pbAdmin.collection('history').getFullList({ requestKey: null });
    });

    const timelineItems = useResource$<any[]>(async ({ track }) => {
        track(() => activeTab.value);
        track(() => isClient.value);
        if (!isClient.value || activeTab.value !== 'timeline') return [];
        return await pbAdmin.collection('timeline_history').getFullList({ sort: 'year', requestKey: null });
    });

    const handleDelete = $(async (collection: string, id: string) => {
        if (confirm('Sei sicuro di voler eliminare questo elemento?')) {
            try {
                await pbAdmin.collection(collection).delete(id);
                window.location.reload();
            } catch (e) {
                alert('Errore durante l\'eliminazione');
            }
        }
    });

    return (
        <div class="space-y-10">
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestione Storia del Judo</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Gestisci gli articoli storici e la cronologia mondiale del Judo.</p>
                </div>
                <div class="flex gap-2">
                    {activeTab.value === 'articol' && (
                        <Link href="/gestione/storia/info/new" class="px-6 py-3 bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-500/25 transform hover:-translate-y-1 transition-all">➕ Nuovo Articolo</Link>
                    )}
                    {activeTab.value === 'timeline' && (
                        <Link href="/gestione/storia/timeline/new" class="px-6 py-3 bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-500/25 transform hover:-translate-y-1 transition-all">➕ Nuovo Evento</Link>
                    )}
                </div>
            </header>

            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div class="flex border-b border-gray-100 dark:border-gray-800">
                    <button onClick$={() => activeTab.value = 'articol'} class={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab.value === 'articol' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/10' : 'text-gray-400 hover:text-gray-600'}`}>Articoli Storia</button>
                    <button onClick$={() => activeTab.value = 'timeline'} class={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab.value === 'timeline' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/10' : 'text-gray-400 hover:text-gray-600'}`}>Cronologia</button>
                </div>

                <div class="p-6">
                    {activeTab.value === 'articol' && (
                        <Resource
                            value={historyItems}
                            onPending={() => <div class="py-10 text-center animate-pulse">Caricamento...</div>}
                            onResolved={(list) => (
                                <div class="space-y-4">
                                    {list.map(item => (
                                        <div key={item.id} class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                            <div class="flex items-center gap-4">
                                                <div class="w-12 h-12 rounded-xl bg-white dark:bg-gray-900 overflow-hidden border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                                                    {item.image ? (
                                                        <img src={pbAdmin.files.getUrl(item, item.image, { thumb: '50x50' })} class="w-full h-full object-cover" alt="" />
                                                    ) : <span class="text-xl">📖</span>}
                                                </div>
                                                <div>
                                                    <p class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.title}</p>
                                                    <p class="text-[10px] font-bold text-orange-500 uppercase mt-1">{item.subtitle || 'Storia'}</p>
                                                </div>
                                            </div>
                                            <div class="flex gap-2">
                                                <Link href={`/gestione/storia/info/${item.id}`} class="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors">✏️</Link>
                                                <button onClick$={() => handleDelete('history', item.id)} class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors">🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        />
                    )}

                    {activeTab.value === 'timeline' && (
                        <Resource
                            value={timelineItems}
                            onPending={() => <div class="py-10 text-center animate-pulse">Caricamento...</div>}
                            onResolved={(list) => (
                                <div class="space-y-4">
                                    {list.map(item => (
                                        <div key={item.id} class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                            <div>
                                                <p class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight"><span class="text-orange-600 mr-2">{item.year}</span> {item.title}</p>
                                                <p class="text-[10px] text-gray-400 line-clamp-1 mt-1">{item.description}</p>
                                            </div>
                                            <div class="flex gap-2">
                                                <Link href={`/gestione/storia/timeline/${item.id}`} class="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors">✏️</Link>
                                                <button onClick$={() => handleDelete('timeline_history', item.id)} class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors">🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        />
                    )}
                </div>
            </div>
        </div>
    );
});
