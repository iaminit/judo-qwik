import { component$, useSignal, useVisibleTask$, $, useResource$, Resource } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

interface PostRecord {
    id: string;
    title: string;
    date: string; // data_riferimento
    activity: string;
    cover_image: string;
    data_fine?: string; // expiration date, optional
}

/**
 * Load all posts from the `bacheca` collection and split them into
 *   - **Bacheca**: posts without an expiration date or with a future expiration.
 *   - **Archivio**: posts whose `data_fine` is in the past.
 */
const loadPosts = async (): Promise<{ bacheca: PostRecord[]; archivio: PostRecord[] }> => {
    const records = await pbAdmin.collection('bacheca').getFullList({
        sort: '-data_riferimento',
        requestKey: null,
    });

    const now = new Date();
    const bacheca: PostRecord[] = [];
    const archivio: PostRecord[] = [];

    for (const r of records) {
        const post: PostRecord = {
            id: r.id,
            title: r.titolo,
            date: r.data_riferimento,
            activity: r.tags,
            cover_image: r.immagine_principale,
            data_fine: r.data_fine,
        };
        if (post.data_fine && new Date(post.data_fine) < now) {
            archivio.push(post);
        } else {
            bacheca.push(post);
        }
    }

    return { bacheca, archivio };
};

export default component$(() => {
    const searchTerm = useSignal('');
    const bachecaPosts = useSignal<PostRecord[]>([]);
    const archivioPosts = useSignal<PostRecord[]>([]);
    const isLoading = useSignal(true);

    // Fetch and split posts on mount and when search term changes
    useVisibleTask$(async ({ track }) => {
        track(() => searchTerm.value);
        isLoading.value = true;
        try {
            const { bacheca, archivio } = await loadPosts();
            // Simple filter based on title or activity
            const filter = (p: PostRecord) =>
                !searchTerm.value ||
                p.title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
                (p.activity && p.activity.toLowerCase().includes(searchTerm.value.toLowerCase()));
            bachecaPosts.value = bacheca.filter(filter);
            archivioPosts.value = archivio.filter(filter);
        } catch (e) {
            console.error('Error loading posts:', e);
        } finally {
            isLoading.value = false;
        }
    });

    const handleDelete = $(async (id: string, title: string) => {
        if (confirm(`Sei sicuro di voler eliminare la news "${title}"?`)) {
            try {
                await pbAdmin.collection('bacheca').delete(id);
                // Refresh after deletion
                const { bacheca, archivio } = await loadPosts();
                bachecaPosts.value = bacheca;
                archivioPosts.value = archivio;
            } catch (e: any) {
                alert('Errore: ' + e.message);
            }
        }
    });

    const getActivityBadgeColor = (activity: string) => {
        switch (activity?.toUpperCase()) {
            case 'JUDO':
                return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/10';
            case 'BJJ':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/10';
            case 'KRAV MAGA':
                return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/10';
            default:
                return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/10';
        }
    };

    const Section = ({ title, posts }: { title: string; posts: PostRecord[] }) => (
        <section class="space-y-6">
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">{title}</h2>
            {isLoading.value ? (
                <div class="flex justify-center py-12">
                    <div class="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full" />
                </div>
            ) : posts.length === 0 ? (
                <div class="text-center py-12 text-gray-500 dark:text-gray-400">Nessun post da mostrare.</div>
            ) : (
                <div class="grid gap-6 md:grid-cols-2">
                    {posts.map(p => (
                        <div key={p.id} class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 group hover:shadow-lg transition-shadow">
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{p.title}</h3>
                            <div class="mb-4">
                                <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 dark:border-gray-600">
                                    {p.activity || 'GENERALE'}
                                </span>
                            </div>
                            <div class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                                <span>{new Date(p.date).toLocaleDateString('it-IT')}</span>
                                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={`/gestione/bacheca/${p.id}`} class="text-blue-600 hover:underline">Modifica</a>
                                    <button onClick$={() => handleDelete(p.id, p.title)} class="text-red-600 hover:underline">Elimina</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );

    return (
        <div class="max-w-5xl mx-auto p-6 space-y-12 animate-in fade-in duration-500">
            {/* Page Header */}
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 class="text-3xl font-black text-gray-900 dark:text-white">Bacheca</h1>
                    <p class="text-gray-500 dark:text-gray-400">Gestisci le news, gli eventi e le comunicazioni del Dojo.</p>
                </div>
                <a href="/gestione/bacheca/new" class="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                    <span>➕</span>
                    <span>Nuova News</span>
                </a>
            </header>

            {/* Search Bar */}
            <div class="relative max-w-md mb-8">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                    type="text"
                    placeholder="Cerca titolo o attività..."
                    class="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white font-medium"
                    value={searchTerm.value}
                    onInput$={(e) => (searchTerm.value = (e.target as HTMLInputElement).value)}
                />
            </div>

            {/* Sections */}
            <Section title="📚 Bacheca" posts={bachecaPosts.value} />
            <Section title="📁 Archivio" posts={archivioPosts.value} />
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Gestione Bacheca – Bacheca & Archivio',
    meta: [{ name: 'description', content: 'Pannello di amministrazione con le sezioni Bacheca (attivi) e Archivio (scaduti).' }],
};
