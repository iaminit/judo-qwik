import { component$, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { parsePbError } from '~/lib/error-parser';
import RichTextEditor from './rich-text-editor';
import { MediaBrowserModal } from './media-browser-modal';

interface GalleryFormProps {
    item?: any;
    isNew?: boolean;
}

export default component$<GalleryFormProps>(({ item, isNew }) => {
    const nav = useNavigate();
    const loading = useSignal(false);
    const error = useSignal<string | null>(null);
    const previewImage = useSignal<string | null>(null);
    const type = useSignal(item?.type || 'photo');
    const isMediaModalOpen = useSignal(false);
    const selectedMediaName = useSignal<string | null>(null);

    useVisibleTask$(() => {
        if (item?.immagine_principale) {
            previewImage.value = pbAdmin.files.getUrl(item, item.immagine_principale);
        }
    });

    const handleFileChange = $((e: Event) => {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            selectedMediaName.value = null; // Reset selection
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImage.value = event.target?.result as string;
            };
            reader.readAsDataURL(input.files[0]);
        }
    });

    const handleMediaSelect = $((filename: string) => {
        selectedMediaName.value = filename;
        previewImage.value = `/media/${filename}`;
        isMediaModalOpen.value = false;
        // Reset file input
        const coverInput = document.querySelector('input[name="immagine_principale"]') as HTMLInputElement;
        if (coverInput) coverInput.value = '';
    });

    const handleSubmit = $(async (e: Event) => {
        e.preventDefault();
        loading.value = true;
        error.value = null;

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        // Generate slug
        const generateSlug = (text: string) => {
            return (text || 'untitled')
                .toLowerCase()
                .replace(/[àáâãäå]/g, 'a')
                .replace(/[èéêë]/g, 'e')
                .replace(/[ìíîï]/g, 'i')
                .replace(/[òóôõö]/g, 'o')
                .replace(/[ùúûü]/g, 'u')
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 100);
        };

        const titolo = formData.get('titolo') as string;
        if (!formData.get('slug')) {
            formData.append('slug', generateSlug(titolo));
        }

        // Map type to tags
        const mediaType = formData.get('type');
        if (mediaType) {
            formData.append('tags', mediaType as string);
        }

        // Handle existing media selection
        if (selectedMediaName.value) {
            try {
                const response = await fetch(`/media/${selectedMediaName.value}`);
                const blob = await response.blob();
                const file = new File([blob], selectedMediaName.value, { type: blob.type });
                formData.set('immagine_principale', file);
            } catch (e) {
                console.error('[GalleryForm] Error attaching media file:', e);
            }
        }

        try {
            if (isNew) {
                await pbAdmin.collection('galleria').create(formData);
            } else {
                await pbAdmin.collection('galleria').update(item.id, formData);
            }
            nav('/gestione/gallery');
        } catch (err: any) {
            error.value = parsePbError(err);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            loading.value = false;
        }
    });

    const getYouTubeVideoId = (url?: string): string | undefined => {
        if (!url) return undefined;
        const match = url.match(
            /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
        );
        return match ? match[1] : undefined;
    };

    return (
        <div class="max-w-4xl mx-auto">
            <form onSubmit$={handleSubmit} class="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {error.value && (
                    <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 font-bold flex items-center gap-3">
                        <span>⚠️</span>
                        {error.value}
                    </div>
                )}

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Side: Media Preview */}
                    <div class="space-y-4">
                        <div class="flex items-center justify-between px-1">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest">Anteprima Media</label>
                            {type.value === 'photo' && (
                                <button
                                    type="button"
                                    onClick$={() => isMediaModalOpen.value = true}
                                    class="text-[10px] font-black text-pink-600 uppercase tracking-widest hover:underline"
                                >
                                    Sfoglia Libreria
                                </button>
                            )}
                        </div>

                        {type.value === 'photo' ? (
                            <div class="relative group">
                                <div class="aspect-square rounded-3xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center relative shadow-inner">
                                    {previewImage.value ? (
                                        <img src={previewImage.value} class="w-full h-full object-contain p-2" alt="Preview" />
                                    ) : (
                                        <div class="text-center p-6">
                                            <span class="text-4xl block mb-2">📸</span>
                                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trascina o clicca</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        name="immagine_principale"
                                        accept="image/*"
                                        onChange$={handleFileChange}
                                        class="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                {previewImage.value && (
                                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl pointer-events-none">
                                        <span class="text-white font-black uppercase tracking-widest text-xs">Cambia Foto</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div class="aspect-square rounded-3xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center relative shadow-inner">
                                {item?.video_link && getYouTubeVideoId(item.video_link) ? (
                                    <img
                                        src={`https://img.youtube.com/vi/${getYouTubeVideoId(item.video_link)}/hqdefault.jpg`}
                                        class="w-full h-full object-cover"
                                        alt="Video Preview"
                                    />
                                ) : (
                                    <div class="text-center p-6">
                                        <span class="text-4xl block mb-2">🎥</span>
                                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Anteprima Video</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <p class="text-[10px] text-gray-400 font-medium px-2 italic">Solo per Foto: .webp, .jpg. Max 5MB.</p>
                    </div>

                    {/* Right Side: Form Fields */}
                    <div class="lg:col-span-2 space-y-6">
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Titolo</label>
                            <input
                                type="text"
                                name="titolo"
                                required
                                value={item?.titolo}
                                placeholder="es. Stage di Natale 2023"
                                class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all dark:text-white font-bold"
                            />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Tipo Media</label>
                                <select
                                    name="type"
                                    required
                                    value={type.value}
                                    onChange$={(e) => type.value = (e.target as HTMLSelectElement).value}
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all dark:text-white font-bold appearance-none"
                                >
                                    <option value="photo">Foto</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Data</label>
                                <input
                                    type="date"
                                    name="data_riferimento"
                                    value={item?.data_riferimento ? new Date(item.data_riferimento).toISOString().split('T')[0] : ''}
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all dark:text-white font-bold"
                                />
                            </div>
                        </div>

                        {type.value === 'video' && (
                            <div class="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">YouTube URL</label>
                                <input
                                    type="url"
                                    name="video_link"
                                    required={type.value === 'video'}
                                    value={item?.video_link}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all dark:text-white font-bold"
                                />
                            </div>
                        )}

                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Link Esterno (opzionale)</label>
                            <input
                                type="url"
                                name="link_esterno"
                                value={item?.link_esterno}
                                placeholder="https://..."
                                class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all dark:text-white font-bold"
                            />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Descrizione</label>
                            <RichTextEditor
                                id="contenuto"
                                name="contenuto"
                                value={item?.contenuto}
                                placeholder="Breve descrizione dell'evento o della foto..."
                            />
                        </div>
                    </div>
                </div>

                <div class="pt-10 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick$={() => nav('/gestione/gallery')}
                        class="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                        Annulla
                    </button>
                    <button
                        type="submit"
                        disabled={loading.value}
                        class="px-10 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-lg shadow-xl shadow-black/10 hover:transform hover:-translate-y-1 transition-all disabled:opacity-50"
                    >
                        {loading.value ? 'Salvataggio...' : (isNew ? 'Aggiungi alla Galleria' : 'Salva Modifiche')}
                    </button>
                </div>
            </form>

            <MediaBrowserModal
                isOpen={isMediaModalOpen.value}
                onClose={$(() => { isMediaModalOpen.value = false; })}
                onSelect={handleMediaSelect}
            />
        </div>
    );
});
