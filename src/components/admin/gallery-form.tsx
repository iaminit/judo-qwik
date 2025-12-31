import { component$, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { parsePbError } from '~/lib/error-parser';
import RichTextEditor from './rich-text-editor';

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

    useVisibleTask$(() => {
        if (item?.image) {
            previewImage.value = pbAdmin.files.getUrl(item, item.image);
        }
    });

    const handleFileChange = $((e: Event) => {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImage.value = event.target?.result as string;
            };
            reader.readAsDataURL(input.files[0]);
        }
    });

    const handleSubmit = $(async (e: Event) => {
        e.preventDefault();
        loading.value = true;
        error.value = null;

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        try {
            if (isNew) {
                await pbAdmin.collection('gallery').create(formData);
            } else {
                await pbAdmin.collection('gallery').update(item.id, formData);
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
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Anteprima Media</label>

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
                                        name="image"
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
                                {item?.video_url && getYouTubeVideoId(item.video_url) ? (
                                    <img
                                        src={`https://img.youtube.com/vi/${getYouTubeVideoId(item.video_url)}/hqdefault.jpg`}
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
                                name="title"
                                required
                                value={item?.title}
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
                                    name="date"
                                    value={item?.date ? new Date(item.date).toISOString().split('T')[0] : ''}
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all dark:text-white font-bold"
                                />
                            </div>
                        </div>

                        {type.value === 'video' && (
                            <div class="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">YouTube URL</label>
                                <input
                                    type="url"
                                    name="video_url"
                                    required={type.value === 'video'}
                                    value={item?.video_url}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all dark:text-white font-bold"
                                />
                            </div>
                        )}

                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Link Esterno (opzionale)</label>
                            <input
                                type="url"
                                name="link"
                                value={item?.link}
                                placeholder="https://..."
                                class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all dark:text-white font-bold"
                            />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Descrizione</label>
                            <RichTextEditor
                                id="description"
                                name="description"
                                value={item?.description}
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
        </div>
    );
});
