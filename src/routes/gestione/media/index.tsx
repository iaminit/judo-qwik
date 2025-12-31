import { component$, useSignal, useVisibleTask$, $, useComputed$ } from '@builder.io/qwik';
import { pbAdmin } from '~/lib/pocketbase-admin';

interface MediaItem {
    id: string;
    collectionId?: string;
    collectionName: string;
    file: string;
    url: string;
    thumb: string;
    name: string;
    type: string;
    source: 'pocketbase' | 'local';
}

export default component$(() => {
    const mediaItems = useSignal<MediaItem[]>([]);
    const isLoading = useSignal(true);
    const filter = useSignal<'all' | 'gallery' | 'techniques' | 'storia' | 'local'>('all');
    const searchTerm = useSignal('');
    const isUploading = useSignal(false);
    const fileInputRef = useSignal<HTMLInputElement>();

    const fetchMedia = $(async () => {
        isLoading.value = true;
        try {
            const allMedia: MediaItem[] = [];

            // 1. Fetch from PocketBase (Gallery)
            if (filter.value === 'all' || filter.value === 'gallery') {
                const galleryRecords = await pbAdmin.collection('gallery').getFullList({
                    sort: '-created',
                    filter: 'image != ""',
                    requestKey: null
                });

                allMedia.push(...galleryRecords.map(r => ({
                    id: r.id,
                    collectionId: r.collectionId,
                    collectionName: 'gallery',
                    file: r.image,
                    url: pbAdmin.files.getUrl(r, r.image),
                    thumb: pbAdmin.files.getUrl(r, r.image, { thumb: '200x200' }),
                    name: r.title || r.image,
                    type: 'image',
                    source: 'pocketbase' as const
                })));
            }

            // 2. Fetch from PocketBase (Technique Images & Smart Mapping)
            if (filter.value === 'all' || filter.value === 'techniques') {
                try {
                    const [techRecords, techImages, localFiles] = await Promise.all([
                        pbAdmin.collection('techniques').getFullList({ requestKey: null }),
                        pbAdmin.collection('technique_images').getFullList({ requestKey: null }).catch(() => []),
                        fetch('/api/local-media').then(res => res.ok ? res.json() : [])
                    ]);

                    const localFileSet = new Set(localFiles.map((f: any) => f.name));

                    const techniqueImageMap = new Map<string, string>(
                        techImages.map((img: any) => {
                            const rawPath = img.path || img.image_file || img.image || '';
                            const filename = rawPath ? rawPath.replace(/^media\//, '').split('/').pop() : '';
                            return [img.technique, filename];
                        })
                    );

                    techRecords.forEach((t: any) => {
                        // Slug fallback logic (same as frontend)
                        let slugBase = t.name.toLowerCase().trim()
                            .replace(/[ōō]/g, 'o').replace(/[ūū]/g, 'u').replace(/[āā]/g, 'a')
                            .replace(/[īī]/g, 'i').replace(/[ēē]/g, 'e').replace(/[\s/]+/g, '-');

                        // Common term normalization
                        slugBase = slugBase.replace(/tsuri-?komi/g, 'tsuri-komi').replace(/seoi-?nage/g, 'seoi-nage')
                            .replace(/maki-?komi/g, 'maki-komi').replace(/ashi-?guruma/g, 'ashi-guruma')
                            .replace(/de-?ashi/g, 'de-ashi').replace(/o-?goshi/g, 'o-goshi')
                            .replace(/o-?uchi/g, 'o-uchi').replace(/ko-?uchi/g, 'ko-uchi')
                            .replace(/o-?soto/g, 'o-soto').replace(/ko-?soto/g, 'ko-soto');

                        const slugBaseClean = slugBase.replace(/[^-a-z0-9]/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
                        const extensions = ['.webp', '.svg', '.jpg', '.jpeg', '.png'];

                        let foundImage = '';
                        search_loop: for (const ext of extensions) {
                            if (localFileSet.has(slugBaseClean + ext)) {
                                foundImage = slugBaseClean + ext;
                                break search_loop;
                            }
                        }

                        const dbImage = techniqueImageMap.get(t.id);
                        const finalFile = dbImage || foundImage;

                        if (finalFile) {
                            allMedia.push({
                                id: t.id + '_img',
                                collectionId: t.collectionId,
                                collectionName: 'techniques',
                                file: finalFile,
                                url: finalFile.startsWith('http') ? finalFile : `/media/${finalFile}`,
                                thumb: finalFile.startsWith('http') ? finalFile : `/media/${finalFile}`,
                                name: `${t.name} (Tecnica)`,
                                type: 'image',
                                source: dbImage ? 'pocketbase' : 'local'
                            });
                        }
                    });
                } catch (e) {
                    console.warn('[Media Center] Error fetching techniques logic:', e);
                }
            }

            // 2b. Fetch from PocketBase (Storia)
            if (filter.value === 'all' || filter.value === 'storia') {
                try {
                    const historyRecords = await pbAdmin.collection('history').getFullList({
                        sort: '-created',
                        filter: 'image != ""',
                        requestKey: null
                    });

                    allMedia.push(...historyRecords.map(r => ({
                        id: r.id,
                        collectionId: r.collectionId,
                        collectionName: 'history',
                        file: r.image,
                        url: pbAdmin.files.getUrl(r, r.image),
                        thumb: pbAdmin.files.getUrl(r, r.image, { thumb: '200x200' }),
                        name: r.title || r.image,
                        type: 'image',
                        source: 'pocketbase' as const
                    })));
                } catch (e) {
                    console.warn('[Media Center] history images not accessible');
                }
            }

            // 3. Scan Local /public/media (via API or manual list for now if API missing)
            // Note: Since we can't easily read filesystem from browser, we usually need an API.
            // But for this project, I'll add the discovery of local files if they have a consistent pattern.
            // For now, let's assume we want to see the local files too.
            if (filter.value === 'all' || filter.value === 'local') {
                try {
                    const response = await fetch('/api/local-media');
                    if (response.ok) {
                        const localFiles = await response.json();
                        allMedia.push(...localFiles.map((file: string) => ({
                            id: file,
                            collectionName: 'public/media',
                            file: file,
                            url: `/media/${file}`,
                            thumb: `/media/${file}`,
                            name: file,
                            type: file.endsWith('.mp4') ? 'video' : 'image',
                            source: 'local' as const
                        })));
                    }
                } catch (e) {
                    console.warn('[Media Center] Local media API not found');
                }
            }

            mediaItems.value = allMedia;
        } catch (e) {
            console.error('[Media Center] Error:', e);
        } finally {
            isLoading.value = false;
        }
    });

    useVisibleTask$(async ({ track }) => {
        track(() => filter.value);
        fetchMedia();
    });

    const filteredItems = useComputed$(() => {
        if (!searchTerm.value) return mediaItems.value;
        const lowSearch = searchTerm.value.toLowerCase();
        return mediaItems.value.filter(item =>
            item.name.toLowerCase().includes(lowSearch) ||
            item.file.toLowerCase().includes(lowSearch)
        );
    });

    const copyToClipboard = $(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('URL copiato negli appunti!');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    });

    const handleUpload = $(async (e: Event) => {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        isUploading.value = true;
        try {
            const formData = new FormData();
            formData.append('file', input.files[0]);

            // If we are filtering by 'local' and it looks like a subfolder...
            // For now just upload to root media/

            const resp = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (resp.ok) {
                await fetchMedia();
            } else {
                alert('Caricamento fallito');
            }
        } catch (e) {
            console.error('[Media Center] Upload error:', e);
        } finally {
            isUploading.value = false;
        }
    });

    const handleDelete = $(async (item: MediaItem) => {
        if (!confirm(`Sei sicuro di voler eliminare "${item.name}"?`)) return;

        try {
            if (item.source === 'pocketbase' && item.collectionName) {
                await pbAdmin.collection(item.collectionName).delete(item.id);
            } else if (item.source === 'local') {
                const resp = await fetch('/api/delete-media', {
                    method: 'POST',
                    body: JSON.stringify({ fileName: item.file }),
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!resp.ok) throw new Error('Delete failed');
            }
            // Update local state instead of refetching for speed
            mediaItems.value = mediaItems.value.filter(m => m.id !== item.id);
        } catch (e) {
            console.error('[Media Center] Delete error:', e);
            alert('Errore durante l\'eliminazione');
        }
    });

    return (
        <div class="space-y-10 animate-in fade-in duration-700">
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Media Center</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Sincronizzato con PocketBase e cartella locale /media.</p>
                </div>
                <div class="flex flex-col md:flex-row gap-4 items-center">
                    <input
                        type="file"
                        class="hidden"
                        ref={fileInputRef}
                        onChange$={handleUpload}
                        accept="image/*,video/*"
                    />
                    <button
                        onClick$={() => fileInputRef.value?.click()}
                        disabled={isUploading.value}
                        class="px-6 py-2 bg-red-600 text-white font-black rounded-xl shadow-lg shadow-red-500/20 hover:scale-105 transition-all text-sm disabled:opacity-50"
                    >
                        {isUploading.value ? 'Caricamento...' : '➕ Aggiungi File'}
                    </button>
                    <div class="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Cerca file..."
                            bind:value={searchTerm}
                            class="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-red-500 outline-none transition-all dark:text-white font-bold text-sm"
                        />
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    </div>
                    <div class="flex bg-white dark:bg-gray-900 p-1 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <button
                            onClick$={() => filter.value = 'all'}
                            class={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter.value === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Tutti
                        </button>
                        <button
                            onClick$={() => filter.value = 'gallery'}
                            class={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter.value === 'gallery' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Galleria
                        </button>
                        <button
                            onClick$={() => filter.value = 'techniques'}
                            class={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter.value === 'techniques' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Tecniche
                        </button>
                        <button
                            onClick$={() => filter.value = 'storia'}
                            class={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter.value === 'storia' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Storia
                        </button>
                        <button
                            onClick$={() => filter.value = 'local'}
                            class={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter.value === 'local' ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Media Locali
                        </button>
                    </div>
                </div>
            </header>

            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {isLoading.value ? (
                    Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} class="aspect-square bg-white dark:bg-gray-900 rounded-3xl animate-pulse border border-gray-100 dark:border-gray-800"></div>
                    ))
                ) : (
                    filteredItems.value.map((item) => (
                        <div key={`${item.source}-${item.id}`} class="group relative aspect-square bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all hover:scale-[1.02]">
                            {item.type === 'video' ? (
                                <div class="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-2 rounded-3xl">
                                    <span class="text-4xl">🎥</span>
                                </div>
                            ) : (
                                <img src={item.thumb} alt={item.name} class="w-full h-full object-cover p-2 rounded-3xl" />
                            )}

                            <div class="absolute inset-0 bg-black/60 opacity-20 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                                <p class="text-[10px] font-black text-white uppercase tracking-tight line-clamp-2 mb-2">{item.name}</p>
                                <div class="flex gap-2">
                                    <button
                                        onClick$={() => copyToClipboard(item.url)}
                                        class="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-colors"
                                        title="Copia URL"
                                    >
                                        🔗
                                    </button>
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        class="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg transition-colors"
                                        title="Apri Originale"
                                    >
                                        👁️
                                    </a>
                                    <button
                                        onClick$={() => handleDelete(item)}
                                        class="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                                        title="Elimina"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <div class="absolute bottom-2 left-0 right-0 flex flex-col gap-1">
                                    <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.collectionName}</span>
                                    <span class={`text-[7px] font-black uppercase tracking-tighter ${item.source === 'local' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                        {item.source === 'local' ? '📁 Cartella Locale' : '☁️ PocketBase'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!isLoading.value && filteredItems.value.length === 0 && (
                <div class="py-20 text-center">
                    <div class="text-6xl mb-4">📂</div>
                    <p class="text-gray-500 font-bold uppercase tracking-widest">Nessun file trovato.</p>
                </div>
            )}
        </div>
    );
});
