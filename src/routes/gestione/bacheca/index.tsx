import { component$, useSignal, useResource$, Resource, $, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

interface PostRecord {
    id: string;
    title: string;
    date: string;
    activity: string;
    cover_image: string;
    collectionId: string;
}

export default component$(() => {
    const searchTerm = useSignal('');

    const posts = useSignal<PostRecord[]>([]);
    const isLoading = useSignal(true);

    useVisibleTask$(async ({ track }) => {
        track(() => searchTerm.value);
        isLoading.value = true;

        try {
            const filter = searchTerm.value
                ? `title ~ "${searchTerm.value}" || activity ~ "${searchTerm.value}"`
                : '';

            const records = await pbAdmin.collection('post').getFullList({
                sort: '-date',
                filter: filter || undefined,
                requestKey: null,
            });

            posts.value = records.map(r => ({
                id: r.id,
                title: r.title,
                date: r.date,
                activity: r.activity,
                cover_image: r.cover_image,
                collectionId: r.collectionId
            })) as PostRecord[];
        } catch (e) {
            console.error('Error fetching posts:', e);
            posts.value = [];
        } finally {
            isLoading.value = false;
        }
    });

    const handleDelete = $(async (id: string, title: string) => {
        if (confirm(`Sei sicuro di voler eliminare la news "${title}"?`)) {
            try {
                await pbAdmin.collection('post').delete(id);
                window.location.reload();
            } catch (e: any) {
                alert('Errore: ' + e.message);
            }
        }
    });

    const getActivityBadgeColor = (activity: string) => {
        switch (activity?.toUpperCase()) {
            case 'JUDO': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/10';
            case 'BJJ': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/10';
            case 'KRAV MAGA': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/10';
            default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/10';
        }
    };

    return (
        <div class="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Bacheca Avvisi</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Gestisci le news, gli eventi e le comunicazioni del Dojo.</p>
                </div>
                <a
                    href="/gestione/bacheca/new"
                    class="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <span>➕</span>
                    <span>Nuova News</span>
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
                            placeholder="Cerca titolo o attività..."
                            class="w-full pl-12 pr-6 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white font-medium"
                            onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
                        />
                    </div>
                </div>

                {/* Table */}
                <div class="overflow-x-auto">
                    {isLoading.value ? (
                        <div class="p-20 flex justify-center">
                            <div class="animate-spin h-8 w-8 border-4 border-orange-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-800/50">
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Data</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Titolo</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Attività</th>
                                    <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Media</th>
                                    <th class="px-3 md:px-6 py-4 text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                {posts.value.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} class="px-6 py-20 text-center text-gray-500 dark:text-gray-400 font-bold">
                                            Nessun avviso trovato.
                                        </td>
                                    </tr>
                                ) : (
                                    posts.value.map(p => (
                                        <tr key={p.id} class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-400 uppercase">
                                                {new Date(p.date).toLocaleDateString('it-IT')}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap font-black text-gray-900 dark:text-white uppercase tracking-tight max-w-xs truncate">
                                                {p.title}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getActivityBadgeColor(p.activity)}`}>
                                                    {p.activity || 'GENERALE'}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700">
                                                    {p.cover_image ? (
                                                        <img
                                                            src={pbAdmin.files.getUrl(p, p.cover_image, { thumb: '100x100' })}
                                                            alt={p.title}
                                                            class="w-full h-full object-cover"
                                                            onError$={(e) => {
                                                                (e.target as HTMLImageElement).src = '/media/kano_non_sa.webp';
                                                                (e.target as HTMLImageElement).classList.add('grayscale');
                                                            }}
                                                        />
                                                    ) : (
                                                        <img
                                                            src="/media/kano_non_sa.webp"
                                                            alt="No Cover"
                                                            class="w-full h-full object-cover grayscale opacity-30"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td class="px-3 md:px-6 py-4 whitespace-nowrap text-right">
                                                <div class="flex justify-end gap-1 md:gap-2">
                                                    <a
                                                        href={`/gestione/bacheca/${p.id}`}
                                                        class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-colors"
                                                        title="Modifica"
                                                    >
                                                        <span class="text-lg md:text-xl">✏️</span>
                                                    </a>
                                                    <button
                                                        onClick$={() => handleDelete(p.id, p.title)}
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
    title: 'Gestione Bacheca - JudoOK',
};
