import { component$, useSignal, useResource$, Resource, $, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';

interface Technique {
    id: string;
    name: string;
    group: string;
    order: number;
    image: string;
    collectionId: string;
}

export default component$(() => {
    const searchTerm = useSignal('');
    const isClient = useSignal(false);

    // Ensure we are on the client to have the auth token from localStorage
    useVisibleTask$(() => {
        isClient.value = true;
    });

    const techniques = useResource$<any[]>(async ({ track }) => {
        track(() => searchTerm.value);
        track(() => isClient.value);

        if (!isClient.value) return [];

        try {
            const filter = searchTerm.value
                ? `name ~ "${searchTerm.value}" || group ~ "${searchTerm.value}"`
                : '';

            console.log('[Admin] Fetching techniques with filter:', filter);

            const [records, techniqueImages] = await Promise.all([
                pbAdmin.collection('techniques').getFullList({
                    sort: 'group,order,name',
                    filter: filter,
                    requestKey: null,
                }),
                pbAdmin.collection('technique_images').getFullList({
                    requestKey: null
                }).catch(() => []) // Silent fail for images
            ]);

            console.log(`[Admin] Fetched ${records.length} techniques and ${techniqueImages.length} extra images`);

            const imgMap = new Map();
            techniqueImages.forEach(img => {
                imgMap.set(img.technique, img);
            });

            return records.map(r => {
                let previewUrl = '';
                const processImageUrl = (record: any, fileName: string) => {
                    if (!fileName) return '';
                    if (fileName.startsWith('media/')) {
                        return '/' + fileName;
                    }
                    const cleanFileName = fileName.replace(/^media\//, '');
                    return pbAdmin.files.getUrl(record, cleanFileName, { thumb: '100x120' });
                };

                const getSlugFallback = (name: string) => {
                    const slug = name.toLowerCase().trim()
                        .replace(/ō/g, 'o').replace(/ū/g, 'u').replace(/ā/g, 'a')
                        .replace(/ī/g, 'i').replace(/ē/g, 'e').replace(/[\s/]+/g, '-')
                        .replace(/tsuri-?komi/g, 'tsuri-komi').replace(/seoi-?nage/g, 'seoi-nage')
                        .replace(/o-?soto/g, 'o-soto').replace(/o-?goshi/g, 'o-goshi')
                        .replace(/[^-a-z0-9]/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
                    return '/media/' + slug + '.webp';
                };

                if (r.image) {
                    previewUrl = processImageUrl(r, r.image);
                } else {
                    const extraImg = imgMap.get(r.id);
                    if (extraImg) {
                        const file = extraImg.path || extraImg.image || extraImg.image_file;
                        previewUrl = processImageUrl(extraImg, file);
                    } else {
                        previewUrl = getSlugFallback(r.name);
                    }
                }

                return {
                    id: r.id,
                    name: r.name,
                    group: r.group,
                    order: r.order,
                    previewUrl: previewUrl
                };
            });
        } catch (e) {
            console.error('[Admin] Error fetching techniques:', e);
            return [];
        }
    });

    const handleDelete = $(async (id: string, name: string) => {
        if (confirm(`Sei sicuro di voler eliminare la tecnica "${name}"?`)) {
            try {
                await pbAdmin.collection('techniques').delete(id);
                window.location.reload(); // Quick refresh
            } catch (e: any) {
                alert('Errore: ' + e.message);
            }
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
                <a
                    href="/gestione/tecniche/new"
                    class="bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <span>➕</span>
                    <span>Nuova Tecnica</span>
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
                            placeholder="Cerca tecnica o gruppo..."
                            class="w-full pl-12 pr-6 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white font-medium"
                            onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
                        />
                    </div>
                </div>

                {/* Table */}
                <div class="overflow-x-auto">
                    <Resource
                        value={techniques}
                        onPending={() => (
                            <div class="p-20 flex justify-center">
                                <div class="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
                            </div>
                        )}
                        onResolved={(list) => (
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-gray-50 dark:bg-gray-800/50">
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Anteprima</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nome</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Gruppo</th>
                                        <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ordine</th>
                                        <th class="px-3 md:px-6 py-4 text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} class="px-6 py-20 text-center text-gray-500 dark:text-gray-400 font-bold">
                                                Nessuna tecnica trovata.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map(tech => (
                                            <tr key={tech.id} class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                                                            <img
                                                                src="/media/kano_non_sa.webp"
                                                                alt="No Image"
                                                                class="max-w-full max-h-full object-contain grayscale opacity-50"
                                                            />
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
                                                    <div class="flex justify-end gap-1 md:gap-2">
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
                        )}
                    />
                </div>

                {/* Footer info */}
                <div class="p-6 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Visualizzati record nel database
                    </p>
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Gestione Tecniche - JudoOK',
};
