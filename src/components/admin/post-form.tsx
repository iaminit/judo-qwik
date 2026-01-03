import { component$, $, useSignal } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { parsePbError } from '~/lib/error-parser';
import RichTextEditor from './rich-text-editor';
import { MediaBrowserModal } from './media-browser-modal';

interface PostFormProps {
    post?: any;
    isNew?: boolean;
}

export default component$<PostFormProps>(({ post, isNew }) => {
    const nav = useNavigate();
    const loading = useSignal(false);
    const error = useSignal<string | null>(null);
    const imagePreview = useSignal<string | null>(null);
    const isMediaModalOpen = useSignal(false);
    const selectedMediaName = useSignal<string | null>(null);

    const handleSubmit = $(async () => {
        console.log('[Admin] Form SUBMIT triggered');
        loading.value = true;
        error.value = null;

        const form = document.getElementById('post-form') as HTMLFormElement;
        if (!form) {
            alert('Errore: Form non trovato nel DOM');
            loading.value = false;
            return;
        }

        const rawFormData = new FormData(form);
        const finalData = new FormData();

        // Title (Required)
        const title = (rawFormData.get('titolo') as string)?.trim();
        if (!title) {
            alert('Il campo TITOLO è obbligatorio.');
            loading.value = false;
            return;
        }
        finalData.append('titolo', title);

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
        finalData.append('slug', generateSlug(title));

        // Content
        const content = rawFormData.get('contenuto') as string;
        console.log('[Admin] Sending content:', content);
        finalData.append('contenuto', content || '');

        // Tags (Activity)
        const activity = rawFormData.get('tags') as string;
        finalData.append('tags', activity || 'GENERALE');

        // Date (Required)
        let dateVal = rawFormData.get('data_riferimento') as string;
        if (dateVal && dateVal.includes('T')) {
            dateVal = dateVal.replace('T', ' ') + ':00';
        }
        if (!dateVal) {
            alert('Il campo DATA è obbligatorio.');
            loading.value = false;
            return;
        }
        finalData.append('data_riferimento', dateVal);

        // Video & External Links
        const video = rawFormData.get('video_link') as string;
        if (video) finalData.append('video_link', video);

        const external = rawFormData.get('link_esterno') as string;
        if (external) finalData.append('link_esterno', external);

        // Expiration Date (data_fine)
        let expDate = rawFormData.get('data_fine') as string;
        if (expDate && expDate.includes('T')) {
            expDate = expDate.replace('T', ' ') + ':00';
            finalData.append('data_fine', expDate);
        }

        // Image handling
        const coverInput = form.querySelector('input[name="immagine_principale"]') as HTMLInputElement;
        if (coverInput?.files?.[0]) {
            console.log('[Admin] Adding new cover image:', coverInput.files[0].name);
            finalData.append('immagine_principale', coverInput.files[0]);
        } else if (selectedMediaName.value) {
            console.log('[Admin] Attaching existing media:', selectedMediaName.value);
            try {
                const response = await fetch(`/media/${selectedMediaName.value}`);
                const blob = await response.blob();
                const file = new File([blob], selectedMediaName.value, { type: blob.type });
                finalData.append('immagine_principale', file);
            } catch (e) {
                console.error('[Admin] Error attaching media file:', e);
            }
        }

        if (!pbAdmin.authStore.isValid) {
            alert('Attenzione: Sessione non valida. Effettua nuovamente il login.');
            loading.value = false;
            return;
        }

        try {
            if (isNew) {
                await pbAdmin.collection('bacheca').create(finalData);

                // Invia notifica email per nuovo post
                try {
                    const plainContent = content?.replace(/<[^>]*>/g, '') || '';
                    const excerpt = plainContent.length > 150
                        ? plainContent.substring(0, 150) + '...'
                        : plainContent;

                    const emailResponse = await fetch('/api/email/post-notification', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            title: title,
                            author: 'Admin',
                            excerpt: excerpt || 'Nessun contenuto disponibile'
                        }),
                    });

                    const emailResult = await emailResponse.json();
                    if (emailResult.success) {
                        console.log('[PostForm] ✉️ Email notification sent successfully');
                    } else {
                        console.warn('[PostForm] ⚠️ Email notification failed:', emailResult.error);
                    }
                } catch (emailError) {
                    console.error('[PostForm] ⚠️ Error sending email notification:', emailError);
                    // Non bloccare il flusso se l'email fallisce
                }
            } else {
                await pbAdmin.collection('bacheca').update(post.id, finalData);
            }

            window.location.href = '/gestione/bacheca';
        } catch (err: any) {
            error.value = parsePbError(err);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            loading.value = false;
        }
    });

    const handleImageChange = $((e: Event) => {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (file.size > maxSize) {
                error.value = 'L\'immagine è troppo grande. Il limite è 5MB.';
                input.value = '';
                imagePreview.value = null;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            error.value = null;
            selectedMediaName.value = null; // Reset selection if new manual upload
            const reader = new FileReader();
            reader.onload = (event) => {
                imagePreview.value = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    });

    const handleMediaSelect = $((filename: string) => {
        selectedMediaName.value = filename;
        imagePreview.value = `/media/${filename}`;
        isMediaModalOpen.value = false;
        // Reset file input if something was selected
        const coverInput = document.querySelector('input[name="immagine_principale"]') as HTMLInputElement;
        if (coverInput) coverInput.value = '';
    });

    return (
        <div class="max-w-5xl mx-auto">
            <form
                id="post-form"
                preventdefault:submit
                onSubmit$={handleSubmit}
                class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
                {error.value && (
                    <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 font-bold flex items-center gap-3">
                        <span>⚠️</span>
                        {error.value}
                    </div>
                )}

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Info */}
                    <div class="lg:col-span-2 space-y-6">
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Titolo della News</label>
                            <input
                                type="text"
                                name="titolo"
                                required
                                value={post?.titolo}
                                placeholder="es. Stage Tecnico di Primavera"
                                class="w-full px-6 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all dark:text-white font-black uppercase tracking-tight"
                            />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Attività</label>
                                <select
                                    name="tags"
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all dark:text-white font-bold"
                                >
                                    <option value="" selected={!post?.tags}>Generale</option>
                                    <option value="JUDO" selected={post?.tags === 'JUDO'}>Judo</option>
                                    <option value="BJJ" selected={post?.tags === 'BJJ'}>BJJ</option>
                                    <option value="JJ" selected={post?.tags === 'JJ'}>JJ</option>
                                    <option value="KRAV MAGA" selected={post?.tags === 'KRAV MAGA'}>Krav Maga</option>
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Data Pubblicazione</label>
                                <input
                                    type="datetime-local"
                                    name="data_riferimento"
                                    required
                                    value={typeof post?.data_riferimento === 'string' ? post.data_riferimento.substring(0, 16).replace(' ', 'T') : new Date().toISOString().substring(0, 16)}
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all dark:text-white font-bold"
                                />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Contenuto</label>
                            <RichTextEditor
                                name="contenuto"
                                id="contenuto"
                                value={post?.contenuto}
                                placeholder="Scrivi qui la news..."
                            />
                        </div>
                    </div>

                    {/* Right Column: Media/Links */}
                    <div class="space-y-6">
                        {/* Cover Image */}
                        <div class="space-y-4">
                            <div class="flex items-center justify-between px-1">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest">Immagine di Copertina</label>
                                <button
                                    type="button"
                                    onClick$={() => isMediaModalOpen.value = true}
                                    class="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline"
                                >
                                    Sfoglia Libreria
                                </button>
                            </div>
                            <div class="relative group aspect-video rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700">
                                {(imagePreview.value || (post?.immagine_principale && !isNew)) ? (
                                    <img
                                        src={imagePreview.value || (post?.immagine_principale?.startsWith('media/') ? '/' + post.immagine_principale : `/api/files/${post?.collectionId}/${post?.id}/${post?.immagine_principale}`)}
                                        alt="Preview"
                                        class="w-full h-full object-cover"
                                        onError$={(e) => {
                                            (e.target as HTMLImageElement).src = '/media/kano_non_sa.webp';
                                            (e.target as HTMLImageElement).classList.add('grayscale');
                                        }}
                                    />
                                ) : (
                                    <div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                        <span class="text-4xl mb-2">🖼️</span>
                                        <span class="text-[10px] font-black uppercase tracking-widest">Seleziona Immagine</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    name="immagine_principale"
                                    accept="image/*"
                                    onInput$={handleImageChange}
                                    class="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Video Link (YouTube o URL)</label>
                            <input
                                type="text"
                                name="video_link"
                                value={post?.video_link}
                                placeholder="es. https://youtu.be/..."
                                class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all dark:text-white font-medium"
                            />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Link Esterno (Opzionale)</label>
                            <input
                                type="text"
                                name="link_esterno"
                                value={post?.link_esterno}
                                placeholder="es. https://fijlkam.it/gara..."
                                class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all dark:text-white font-medium"
                            />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Data Scadenza (Auto-archiviazione)</label>
                            <input
                                type="datetime-local"
                                name="data_fine"
                                value={typeof post?.data_fine === 'string' ? post.data_fine.substring(0, 16).replace(' ', 'T') : ''}
                                class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all dark:text-white font-bold"
                            />
                        </div>
                    </div>
                </div>

                <div class="pt-10 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick$={() => nav('/gestione/bacheca')}
                        class="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                        Annulla
                    </button>
                    <button
                        type="button"
                        onClick$={handleSubmit}
                        disabled={loading.value}
                        class="px-10 py-4 rounded-2xl bg-orange-600 text-white font-black text-lg shadow-xl shadow-orange-500/20 hover:transform hover:-translate-y-1 transition-all disabled:opacity-50"
                    >
                        {loading.value ? 'In corso...' : (isNew ? 'Pubblica News' : 'Salva Modifiche')}
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
