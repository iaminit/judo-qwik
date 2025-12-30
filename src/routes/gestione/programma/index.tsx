import { component$, useSignal, useResource$, Resource, $, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
    const activeDan = useSignal<number | null>(null);
    const isClient = useSignal(false);

    useVisibleTask$(() => {
        isClient.value = true;
    });

    const programList = useResource$<any[]>(async ({ track }) => {
        track(() => activeDan.value);
        track(() => isClient.value);

        if (!isClient.value) return [];

        try {
            const filter = activeDan.value ? `dan_level = ${activeDan.value}` : '';

            const records = await pbAdmin.collection('exam_program').getFullList({
                sort: 'dan_level,order',
                filter: filter,
                requestKey: null,
            });

            return records.map(r => ({
                id: r.id,
                title: r.title,
                dan_level: r.dan_level,
                section_type: r.section_type,
                order: r.order
            }));
        } catch (e) {
            console.error('[Admin Program] Error:', e);
            return [];
        }
    });

    const handleDelete = $(async (id: string) => {
        if (confirm('Sei sicuro di voler eliminare questa sezione del programma?')) {
            try {
                await pbAdmin.collection('exam_program').delete(id);
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
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestione Programmi</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Gestisci i requisiti per gli esami DAN.</p>
                </div>
                <Link
                    href="/gestione/programma/new"
                    class="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-500/25 transform hover:-translate-y-1"
                >
                    <span class="text-xl">➕</span>
                    Nuova Sezione
                </Link>
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

                <Resource
                    value={programList}
                    onPending={() => (
                        <div class="p-20 flex justify-center">
                            <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                        </div>
                    )}
                    onResolved={(list) => (
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-gray-50 dark:bg-gray-800/50">
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Dan</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Sezione</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Titolo</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ordine</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} class="px-6 py-20 text-center text-gray-500 dark:text-gray-400 font-bold">
                                                Nessun programma trovato.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map(prog => (
                                            <tr key={prog.id} class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <span class="font-black text-indigo-600 dark:text-indigo-400">{prog.dan_level}° DAN</span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <span class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        {prog.section_type || '-'}
                                                    </span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                                                    {prog.title}
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-400">
                                                    #{prog.order}
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-right">
                                                    <div class="flex justify-end gap-2">
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
                        </div>
                    )}
                />
            </div>
        </div>
    );
});
