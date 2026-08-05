import { component$, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { getPBFileUrl } from '~/lib/pocketbase';
import RichTextEditor from './rich-text-editor';
import { MediaBrowserModal } from './media-browser-modal';
import CompleteContentFields from './complete-content-fields';
import { normalizeContentFormData } from '~/lib/content-form-data';

interface FijlkamFormProps {
    item?: any;
    isNew: boolean;
    type: 'info' | 'timeline' | 'regulations' | 'programmi';
}

export default component$<FijlkamFormProps>(({ item, isNew, type }) => {
    const nav = useNavigate();
    const loading = useSignal(false);
    const error = useSignal<string | null>(null);
    const danLevels = useSignal<any[]>([]);
    const isMediaModalOpen = useSignal(false);
    const selectedMediaName = useSignal<string | null>(null);
    const imagePreview = useSignal<string | null>(
        item?.immagine_principale
            ? item.immagine_principale.startsWith('http')
                ? item.immagine_principale
                : item.immagine_principale.startsWith('/media/')
                    ? item.immagine_principale
                    : item.immagine_principale.startsWith('media/')
                        ? `/${item.immagine_principale}`
                        : getPBFileUrl(item.collectionId, item.id, item.immagine_principale)
            : null
    );

    useVisibleTask$(async () => {
        if (type === 'programmi') {
            try {
                const levels = await pbAdmin.collection('livelli_dan').getFullList({
                    sort: 'ordine',
                });
                danLevels.value = levels;
            } catch (e) {
                console.error('[FijlkamForm] Error fetching dan levels:', e);
            }
        }
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

        const typeTag =
            type === 'info'
                ? 'info'
                : type === 'timeline'
                    ? 'timeline'
                    : type === 'regulations'
                        ? 'regolamento'
                        : 'esame_dan';
        const reservedTags = new Set(['info', 'timeline', 'regolamento', 'esame_dan']);
        const extraTags = String(formData.get('tags') || item?.tags || '')
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag && !reservedTags.has(tag.toLowerCase()));
        formData.set('tags', [typeTag, ...extraTags].join(','));

        if (selectedMediaName.value) {
            try {
                const response = await fetch(`/media/${selectedMediaName.value}`);
                if (!response.ok) throw new Error('File media non disponibile');
                const blob = await response.blob();
                const file = new File([blob], selectedMediaName.value, { type: blob.type });
                formData.set('immagine_principale', file);
            } catch (mediaError) {
                console.error('[FijlkamForm] Error attaching media file:', mediaError);
                error.value = 'Impossibile allegare l’immagine selezionata';
                loading.value = false;
                return;
            }
        } else {
            const imageFile = formData.get('immagine_principale');
            if (imageFile instanceof File && imageFile.size === 0) {
                formData.delete('immagine_principale');
            }
        }
        normalizeContentFormData(formData);

        try {
            if (isNew) {
                await pbAdmin.collection('fijlkam').create(formData);
            } else {
                await pbAdmin.collection('fijlkam').update(item.id, formData);
            }
            nav('/gestione/fijlkam');
        } catch (err: any) {
            error.value = err.message || 'Errore durante il salvataggio';
        } finally {
            loading.value = false;
        }
    });

    const handleFileChange = $((event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files?.[0]) {
            selectedMediaName.value = null;
            imagePreview.value = URL.createObjectURL(input.files[0]);
        }
    });

    const handleMediaSelect = $((filename: string) => {
        selectedMediaName.value = filename;
        imagePreview.value = `/media/${filename}`;
        isMediaModalOpen.value = false;
        const imageInput = document.querySelector(
            'input[name="immagine_principale"]'
        ) as HTMLInputElement | null;
        if (imageInput) imageInput.value = '';
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

                {(type === 'info' || type === 'programmi') && (
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Sezione / Sotto-sezione</label>
                        <input
                            type="text"
                            name="categoria_secondaria"
                            value={item?.categoria_secondaria || ''}
                            placeholder={type === 'info' ? "es: info, campioni, cinture..." : "es: Te Waza, Kata, Teoria..."}
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

                {type === 'regulations' && (
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

                <div class="space-y-6">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between gap-4 px-1">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest">
                                Immagine della scheda (Opzionale)
                            </label>
                            <button
                                type="button"
                                onClick$={() => {
                                    isMediaModalOpen.value = true;
                                }}
                                class="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
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
                            <img
                                src={imagePreview.value}
                                class="w-full h-full object-contain p-4"
                                alt="Anteprima immagine"
                            />
                        </div>
                    )}
                </div>

                {type === 'regulations' && (
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Link Esterno</label>
                        <input
                            type="url"
                            name="link_esterno"
                            value={item?.link_esterno || ''}
                            class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-bold text-gray-900 dark:text-white"
                        />
                    </div>
                )}

                {type === 'programmi' && (
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Grado Richiesto</label>
                            <select
                                name="livello"
                                class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-bold text-gray-900 dark:text-white appearance-none"
                            >
                                {danLevels.value.map(level => (
                                    <option
                                        key={level.id}
                                        value={level.grado}
                                        selected={Number(item?.livello) === level.grado}
                                    >
                                        {level.nome_completo}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Ordine</label>
                            <input
                                type="number"
                                name="ordine"
                                value={item?.ordine || 0}
                                class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-bold text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                )}

                {(type === 'info' || type === 'regulations' || type === 'programmi') && (
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Contenuto (HTML)</label>
                        <RichTextEditor
                            name="contenuto"
                            id="contenuto_fijlkam"
                            value={item?.contenuto || ''}
                        />
                    </div>
                )}

                {type === 'timeline' && (
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Descrizione</label>
                        <RichTextEditor
                            name="contenuto"
                            id="contenuto_timeline_fijlkam"
                            value={item?.contenuto || ''}
                        />
                    </div>
                )}
            </div>

            <CompleteContentFields
                record={item}
                exclude={[
                    'titolo',
                    'immagine_principale',
                    'contenuto',
                    ...(type === 'info' ? ['categoria_secondaria'] : []),
                    ...(type === 'timeline' ? ['anno'] : []),
                    ...(type === 'regulations' ? ['titolo_secondario', 'link_esterno'] : []),
                    ...(type === 'programmi' ? ['categoria_secondaria', 'livello', 'ordine'] : []),
                ]}
            />

            <div class="pt-6 flex gap-4">
                <button
                    type="submit"
                    disabled={loading.value}
                    class="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-all disabled:opacity-50"
                >
                    {loading.value ? 'Salvataggio...' : 'Salva Elemento'}
                </button>
                <button
                    type="button"
                    onClick$={() => nav('/gestione/fijlkam')}
                    class="px-10 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black rounded-2xl hover:bg-gray-200 transition-all"
                >
                    Annulla
                </button>
            </div>
        </form>
        <MediaBrowserModal
            isOpen={isMediaModalOpen.value}
            onClose$={$(() => {
                isMediaModalOpen.value = false;
            })}
            onSelect$={handleMediaSelect}
        />
        </>
    );
});
