import { component$, useSignal, useResource$, Resource, $, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
    const activeTab = useSignal<'info' | 'timeline' | 'regulations'>('info');
    const isClient = useSignal(false);

    useVisibleTask$(() => {
        isClient.value = true;
    });

    const infoItems = useResource$<any[]>(async ({ track }) => {
        track(() => activeTab.value);
        track(() => isClient.value);
        if (!isClient.value || activeTab.value !== 'info') return [];
        return await pbAdmin.collection('fijlkam').getFullList({ requestKey: null });
    });

    const timelineItems = useResource$<any[]>(async ({ track }) => {
        track(() => activeTab.value);
        track(() => isClient.value);
        if (!isClient.value || activeTab.value !== 'timeline') return [];
        return await pbAdmin.collection('timeline_fijlkam').getFullList({ sort: 'year', requestKey: null });
    });

    const regulationItems = useResource$<any[]>(async ({ track }) => {
        track(() => activeTab.value);
        track(() => isClient.value);
        if (!isClient.value || activeTab.value !== 'regulations') return [];
        return await pbAdmin.collection('regulations').getFullList({ sort: 'title', requestKey: null });
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
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestione FIJLKAM</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Gestisci le informazioni istituzionali, la storia e i regolamenti.</p>
                </div>
                <div class="flex gap-2">
                    {activeTab.value === 'info' && (
                        <Link href="/gestione/fijlkam/info/new" class="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/25 transform hover:-translate-y-1 transition-all">➕ Nuova Info</Link>
                    )}
                    {activeTab.value === 'timeline' && (
                        <Link href="/gestione/fijlkam/timeline/new" class="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/25 transform hover:-translate-y-1 transition-all">➕ Nuovo Evento</Link>
                    )}
                    {activeTab.value === 'regulations' && (
                        <Link href="/gestione/fijlkam/regulations/new" class="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/25 transform hover:-translate-y-1 transition-all">➕ Nuova Regola</Link>
                    )}
                </div>
            </header>

            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div class="flex border-b border-gray-100 dark:border-gray-800">
                    <button onClick$={() => activeTab.value = 'info'} class={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab.value === 'info' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/10' : 'text-gray-400 hover:text-gray-600'}`}>Informazioni</button>
                    <button onClick$={() => activeTab.value = 'timeline'} class={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab.value === 'timeline' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/10' : 'text-gray-400 hover:text-gray-600'}`}>Storia</button>
                    <button onClick$={() => activeTab.value = 'regulations'} class={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab.value === 'regulations' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/10' : 'text-gray-400 hover:text-gray-600'}`}>Regolamenti</button>
                </div>

                <div class="p-6">
                    {activeTab.value === 'info' && (
                        <Resource
                            value={infoItems}
                            onPending={() => <div class="py-10 text-center animate-pulse">Caricamento...</div>}
                            onResolved={(list) => (
                                <div class="space-y-4">
                                    {list.map(item => (
                                        <div key={item.id} class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                            <div>
                                                <p class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.title}</p>
                                                <p class="text-[10px] font-bold text-blue-500 uppercase mt-1">Sezione: {item.section || 'generale'}</p>
                                            </div>
                                            <div class="flex gap-2">
                                                <Link href={`/gestione/fijlkam/info/${item.id}`} class="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors">✏️</Link>
                                                <button onClick$={() => handleDelete('fijlkam', item.id)} class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors">🗑️</button>
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
                                                <p class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight"><span class="text-blue-600 mr-2">{item.year}</span> {item.title}</p>
                                                <p class="text-[10px] text-gray-400 line-clamp-1 mt-1">{item.description}</p>
                                            </div>
                                            <div class="flex gap-2">
                                                <Link href={`/gestione/fijlkam/timeline/${item.id}`} class="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors">✏️</Link>
                                                <button onClick$={() => handleDelete('timeline_fijlkam', item.id)} class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors">🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        />
                    )}

                    {activeTab.value === 'regulations' && (
                        <Resource
                            value={regulationItems}
                            onPending={() => <div class="py-10 text-center animate-pulse">Caricamento...</div>}
                            onResolved={(list) => (
                                <div class="space-y-4">
                                    {list.map(item => (
                                        <div key={item.id} class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                            <div>
                                                <p class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.title}</p>
                                                <p class="text-[10px] text-yellow-600 font-bold uppercase mt-1">{item.subtitle || 'Regolamento'}</p>
                                            </div>
                                            <div class="flex gap-2">
                                                <Link href={`/gestione/fijlkam/regulations/${item.id}`} class="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors">✏️</Link>
                                                <button onClick$={() => handleDelete('regulations', item.id)} class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors">🗑️</button>
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
