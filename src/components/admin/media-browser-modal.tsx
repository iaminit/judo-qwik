import { component$, useSignal, $, useVisibleTask$, useStyles$ } from '@builder.io/qwik';

interface MediaFile {
    name: string;
    url: string;
    extension: string;
}

interface MediaBrowserModalProps {
    isOpen: boolean;
    onClose: QRL<() => void>;
    onSelect: QRL<(url: string) => void>;
}

import { type QRL } from '@builder.io/qwik';

export const MediaBrowserModal = component$<MediaBrowserModalProps>(({ isOpen, onClose, onSelect }) => {
    const files = useSignal<MediaFile[]>([]);
    const isLoading = useSignal(true);
    const searchTerm = useSignal('');

    const fetchFiles = $(async () => {
        isLoading.value = true;
        try {
            const res = await fetch('/api/media');
            if (res.ok) {
                const data = await res.json();
                files.value = data;
            }
        } catch (err) {
            console.error('Error fetching media files:', err);
        } finally {
            isLoading.value = false;
        }
    });

    useVisibleTask$(({ track }) => {
        track(() => isOpen);
        if (isOpen) {
            fetchFiles();
        }
    });

    const filteredFiles = files.value.filter(f =>
        f.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick$={onClose} />

            <div class="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in duration-300">
                {/* Header */}
                <div class="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                    <div>
                        <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Sfoglia Media</h2>
                        <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Seleziona un'immagine esistente da public/media</p>
                    </div>
                    <button onClick$={onClose} class="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-all">
                        ✕
                    </button>
                </div>

                {/* Search */}
                <div class="p-4 md:p-6 border-b border-gray-100 dark:border-white/5">
                    <input
                        type="text"
                        placeholder="Cerca file..."
                        value={searchTerm.value}
                        onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
                        class="w-full px-6 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-red-500/50 outline-none transition-all dark:text-white font-bold"
                    />
                </div>

                {/* Content */}
                <div class="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {isLoading.value ? (
                        <div class="h-64 flex items-center justify-center">
                            <div class="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent"></div>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div class="text-center py-20 grayscale opacity-40">
                            <div class="text-6xl mb-4">🖼️</div>
                            <p class="font-black uppercase tracking-widest text-gray-400">Nessun file trovato</p>
                        </div>
                    ) : (
                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredFiles.map(file => (
                                <div
                                    key={file.name}
                                    class="group relative aspect-square bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-red-500/30 transition-all border border-gray-100 dark:border-white/5"
                                    onClick$={() => onSelect(file.name)}
                                >
                                    {((file as any).tag === 'VIDEO') ? (
                                        <div class="w-full h-full flex items-center justify-center text-4xl">🎥</div>
                                    ) : ((file as any).tag === 'AUDIO') ? (
                                        <div class="w-full h-full flex items-center justify-center text-4xl text-red-500">🔊</div>
                                    ) : (
                                        <img
                                            src={file.url}
                                            alt={file.name}
                                            class="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    )}
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-center">
                                        <span class="text-[7px] font-black text-red-500 uppercase tracking-widest mb-1">{(file as any).tag}</span>
                                        <p class="text-[9px] font-black text-white truncate uppercase tracking-widest">{file.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div class="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                    {filteredFiles.length} file disponibili
                </div>
            </div>
        </div>
    );
});
