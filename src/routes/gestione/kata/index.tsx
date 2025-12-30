import { component$, useSignal, useResource$, Resource, $, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
    const searchTerm = useSignal('');
    const isClient = useSignal(false);

    useVisibleTask$(() => {
        isClient.value = true;
    });

    const kataList = useResource$<any[]>(async ({ track }) => {
        track(() => searchTerm.value);
        track(() => isClient.value);

        if (!isClient.value) return [];

        try {
            const filter = searchTerm.value
                ? `name ~ "${searchTerm.value}" || japanese_name ~ "${searchTerm.value}"`
                : '';

            const records = await pbAdmin.collection('kata').getFullList({
                sort: 'name',
                filter: filter,
                requestKey: null,
            });

            return records.map(r => ({
                id: r.id,
                name: r.name,
                japanese_name: r.japanese_name,
                level: r.level,
            }));
        } catch (e) {
            console.error('[Admin Kata] Error:', e);
            return [];
        }
    });

    const handleDelete = $(async (id: string) => {
        if (confirm('Sei sicuro di voler eliminare questo Kata?')) {
            try {
                await pbAdmin.collection('kata').delete(id);
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
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestione Kata</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Modifica le descrizioni e i video dei Kata.</p>
                </div>
                <Link
                    href="/gestione/kata/new"
                    class="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-500/25 transform hover:-translate-y-1"
                >
                    <span class="text-xl">➕</span>
                    Nuovo Kata
                </Link>
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

                <Resource
                    value={kataList}
                    onPending={() => (
                        <div class="p-20 flex justify-center">
                            <div class="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
                        </div>
                    )}
                    onResolved={(list) => (
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-gray-50 dark:bg-gray-800/50">
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nome</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Giapponese</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Livello</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} class="px-6 py-20 text-center text-gray-500 dark:text-gray-400 font-bold">
                                                Nessun Kata trovato.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map(kata => (
                                            <tr key={kata.id} class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                                                    <div class="flex justify-end gap-2">
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
                        </div>
                    )}
                />
            </div>
        </div>
    );
});
