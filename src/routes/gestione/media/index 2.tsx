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
    const filter = useSignal<'TUTTI' | 'IMMAGINI' | 'VIDEO' | 'AUDIO' | 'POST'>('TUTTI');
    const searchTerm = useSignal('');
    const isUploading = useSignal(false);
    const fileInputRef = useSignal<HTMLInputElement>();

    const fetchMedia = $(async () => {
        isLoading.value = true;
        try {
            const allMedia: MediaItem[] = [];

            // Fetch unified local media info
            const response = await fetch('/api/local-media');
            const localFiles = response.ok ? await response.json() : [];
            console.log('[Media Center] Local media received:', localFiles.length, 'items');

            allMedia.push(...localFiles.map((file: any) => ({
                id: file.path,
                collectionName: file.tag,
                file: file.path,
                url: file.url,
                thumb: file.url,
                name: file.name,
                type: file.tag.toLowerCase(),
                source: 'local' as const
            })));

            // Also keep PocketBase images for context, but tag them
            try {
                const galleryRecords = await pbAdmin.collection('gallery').getFullList({ sort: '-created', filter: 'image != ""', requestKey: null });
                allMedia.push(...galleryRecords.map(r => ({
                    id: r.id,
                    collectionId: r.collectionId,
                    collectionName: 'GALLERY',
                    file: r.image,
                    url: pbAdmin.files.getUrl(r, r.image),
                    thumb: pbAdmin.files.getUrl(r, r.image, { thumb: '200x200' }),
                    name: r.title || r.image,
                    type: 'immagini',
                    source: 'pocketbase' as const
                })));
            } catch (e) {
                console.warn('[Media Center] Gallery records (pb) not available:', e);
            }

            const currentFilter = filter.value;
            const filteredByTag = currentFilter === 'TUTTI'
                ? allMedia
                : allMedia.filter(m => m.type.toUpperCase() === currentFilter);

            mediaItems.value = filteredByTag;
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

            // Set folder based on current filter if it's a specific category
            if (filter.value !== 'TUTTI') {
                formData.append('folder', filter.value.toLowerCase());
            }

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
                        accept="image/*,video/*,audio/*"
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
                    <div class="flex bg-white dark:bg-gray-900 p-1 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
                        <button
                            onClick$={() => filter.value = 'TUTTI'}
                            class={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter.value === 'TUTTI' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Tutti
                        </button>
                        <button
                            onClick$={() => filter.value = 'IMMAGINI'}
                            class={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter.value === 'IMMAGINI' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Immagini
                        </button>
                        <button
                            onClick$={() => filter.value = 'VIDEO'}
                            class={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter.value === 'VIDEO' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Video
                        </button>
                        <button
                            onClick$={() => filter.value = 'AUDIO'}
                            class={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter.value === 'AUDIO' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Audio
                        </button>
                        <button
                            onClick$={() => filter.value = 'POST'}
                            class={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter.value === 'POST' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Post
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
                            ) : item.type === 'audio' ? (
                                <div class="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-2 rounded-3xl">
                                    <span class="text-4xl text-red-500">🔊</span>
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
