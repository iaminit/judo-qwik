import { component$, $, useSignal } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import RichTextEditor from './rich-text-editor';
import { MediaBrowserModal } from './media-browser-modal';

interface HistoryFormProps {
    item?: any;
    isNew: boolean;
    type: 'info' | 'timeline';
}

export default component$<HistoryFormProps>(({ item, isNew, type }) => {
    const nav = useNavigate();
    const loading = useSignal(false);
    const error = useSignal<string | null>(null);
    const imagePreview = useSignal<string | null>(item?.immagine_principale ? (item.immagine_principale.startsWith('media/') ? '/' + item.immagine_principale : pbAdmin.files.getUrl(item, item.immagine_principale)) : null);
    const isMediaModalOpen = useSignal(false);
    const selectedMediaName = useSignal<string | null>(null);

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

        // Add tag based on type
        if (type === 'info') {
            formData.append('tags', 'articolo');
        }

        // Handle existing media selection
        if (selectedMediaName.value) {
            try {
                const response = await fetch(`/media/${selectedMediaName.value}`);
                const blob = await response.blob();
                const file = new File([blob], selectedMediaName.value, { type: blob.type });
                formData.set('immagine_principale', file);
            } catch (e) {
                console.error('[HistoryForm] Error attaching media file:', e);
            }
        }

        try {
            if (isNew) {
                await pbAdmin.collection('storia').create(formData);
            } else {
                await pbAdmin.collection('storia').update(item.id, formData);
            }
            nav('/gestione/storia');
        } catch (err: any) {
            error.value = err.message || 'Errore durante il salvataggio';
        } finally {
            loading.value = false;
        }
    });

    const handleFileChange = $((e: Event) => {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            selectedMediaName.value = null; // Reset selection
            imagePreview.value = URL.createObjectURL(input.files[0]);
        }
    });

    const handleMediaSelect = $((filename: string) => {
        selectedMediaName.value = filename;
        imagePreview.value = `/media/${filename}`;
        isMediaModalOpen.value = false;
        // Reset file input
        const coverInput = document.querySelector('input[name="immagine_principale"]') as HTMLInputElement;
        if (coverInput) coverInput.value = '';
    });

    return (
        <>
            <form onSubmit$={handleSubmit} class="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                {error.value && (
                    <div class="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold">
                        {error.value}
                    </div>
                )}

                <div class="grid grid-cols-1 gap-6">
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Titolo</label>
                        <input
                            type="text"
                            name="titolo"
                            value={item?.titolo || ''}
                            required
                            class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-bold text-gray-900 dark:text-white"
                        />
                    </div>

                    {type === 'info' && (
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Sottotitolo</label>
                            <input
                                type="text"
                                name="titolo_secondario"
                                value={item?.titolo_secondario || ''}
                                class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-bold text-gray-900 dark:text-white"
                            />
                        </div>
                    )}

                    {type === 'timeline' && (
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Anno</label>
                            <input
                                type="number"
                                name="anno"
                                value={item?.anno || ''}
                                required
                                class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-bold text-gray-900 dark:text-white"
                            />
                        </div>
                    )}

                    {type === 'info' && (
                        <div class="space-y-6">
                            <div class="space-y-2">
                                <div class="flex items-center justify-between px-1">
                                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest">Immagine (Opzionale)</label>
                                    <button
                                        type="button"
                                        onClick$={() => isMediaModalOpen.value = true}
                                        class="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline"
                                    >
                                        Sfoglia Libreria
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    name="immagine_principale"
                                    accept="image/*"
                                    onChange$={handleFileChange}
                                    class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-medium text-gray-500"
                                />
                            </div>
                            {imagePreview.value && (
                                <div class="w-full h-64 rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                    <img src={imagePreview.value} class="w-full h-full object-contain p-4" alt="Preview" />
                                </div>
                            )}
                        </div>
                    )}

                    {type === 'info' ? (
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Contenuto (HTML)</label>
                            <RichTextEditor
                                name="contenuto"
                                id="contenuto_info"
                                value={item?.contenuto || ''}
                            />
                        </div>
                    ) : (
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Descrizione</label>
                            <RichTextEditor
                                name="contenuto"
                                id="contenuto_timeline"
                                value={item?.contenuto || ''}
                            />
                        </div>
                    )}
                </div>

                <div class="pt-6 flex gap-4">
                    <button
                        type="submit"
                        disabled={loading.value}
                        class="px-10 py-4 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {loading.value ? 'Salvataggio...' : 'Salva Elemento'}
                    </button>
                    <button
                        type="button"
                        onClick$={() => nav('/gestione/storia')}
                        class="px-10 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black rounded-2xl hover:bg-gray-200 transition-all"
                    >
                        Annulla
                    </button>
                </div>
            </form>

            <MediaBrowserModal
                isOpen={isMediaModalOpen.value}
                onClose={$(() => { isMediaModalOpen.value = false; })}
                onSelect={handleMediaSelect}
            />
        </>
    );
});
