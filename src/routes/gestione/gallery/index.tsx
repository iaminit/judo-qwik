import { component$, useSignal, useResource$, Resource, $, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
    const searchTerm = useSignal('');
    const isClient = useSignal(false);

    useVisibleTask$(() => {
        isClient.value = true;
    });

    const galleryItems = useResource$<any[]>(async ({ track }) => {
        track(() => searchTerm.value);
        track(() => isClient.value);

        if (!isClient.value) return [];

        try {
            const filter = searchTerm.value
                ? `title ~ "${searchTerm.value}" || description ~ "${searchTerm.value}"`
                : '';

            const records = await pbAdmin.collection('gallery').getFullList({
                sort: '-date,-created',
                filter: filter,
                requestKey: null,
            });

            return records.map(r => {
                let previewUrl = '';
                if (r.type === 'photo' && r.image) {
                    previewUrl = pbAdmin.files.getUrl(r, r.image, { thumb: '100x100' });
                } else if (r.type === 'video' && r.video_url) {
                    const videoId = r.video_url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1];
                    if (videoId) {
                        previewUrl = `https://img.youtube.com/vi/${videoId}/default.jpg`;
                    }
                }

                return {
                    id: r.id,
                    title: r.title,
                    type: r.type,
                    date: r.date,
                    previewUrl: previewUrl
                };
            });
        } catch (e) {
            console.error('[Admin Gallery] Error:', e);
            return [];
        }
    });

    const handleDelete = $(async (id: string) => {
        if (confirm('Sei sicuro di voler eliminare questo elemento dalla galleria?')) {
            try {
                await pbAdmin.collection('gallery').delete(id);
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
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestione Galleria</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Gestisci le foto e i video della galleria.</p>
                </div>
                <Link
                    href="/gestione/gallery/new"
                    class="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-500/25 transform hover:-translate-y-1"
                >
                    <span class="text-xl">➕</span>
                    Nuovo Elemento
                </Link>
            </header>

            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div class="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div class="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Cerca per titolo o descrizione..."
                            value={searchTerm.value}
                            onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
                            class="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white font-bold"
                        />
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                    </div>
                </div>

                <Resource
                    value={galleryItems}
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
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Media</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Titolo</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Data</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} class="px-6 py-20 text-center text-gray-500 dark:text-gray-400 font-bold">
                                                Nessun elemento trovato.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map(item => (
                                            <tr key={item.id} class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <div class="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center p-1">
                                                        {item.previewUrl ? (
                                                            <img
                                                                src={item.previewUrl}
                                                                alt={item.title}
                                                                class="max-w-full max-h-full object-contain"
                                                            />
                                                        ) : (
                                                            <div class="w-full h-full flex items-center justify-center text-gray-300 text-xl">
                                                                {item.type === 'video' ? '🎥' : '🖼️'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                                    {item.title}
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <span class={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.type === 'video'
                                                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                            : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-400">
                                                    {item.date ? new Date(item.date).toLocaleDateString('it-IT') : '-'}
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-right">
                                                    <div class="flex justify-end gap-2">
                                                        <a
                                                            href={`/gestione/gallery/${item.id}`}
                                                            class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors"
                                                            title="Modifica"
                                                        >
                                                            ✏️
                                                        </a>
                                                        <button
                                                            onClick$={() => handleDelete(item.id)}
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
