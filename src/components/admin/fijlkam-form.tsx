import { component$, $, useSignal } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import RichTextEditor from './rich-text-editor';

interface FijlkamFormProps {
    item?: any;
    isNew: boolean;
    type: 'info' | 'timeline' | 'regulations';
}

export default component$<FijlkamFormProps>(({ item, isNew, type }) => {
    const nav = useNavigate();
    const loading = useSignal(false);
    const error = useSignal<string | null>(null);

    const handleSubmit = $(async (e: Event) => {
        e.preventDefault();
        loading.value = true;
        error.value = null;

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const collection = type === 'info' ? 'fijlkam' : type === 'timeline' ? 'timeline_fijlkam' : 'regulations';

            if (isNew) {
                await pbAdmin.collection(collection).create(data);
            } else {
                await pbAdmin.collection(collection).update(item.id, data);
            }
            nav('/gestione/fijlkam');
        } catch (err: any) {
            error.value = err.message || 'Errore durante il salvataggio';
        } finally {
            loading.value = false;
        }
    });

    return (
        <form onSubmit$={handleSubmit} class="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
            {error.value && (
                <div class="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold">
                    {error.value}
                </div>
            )}

            <div class="grid grid-cols-1 gap-6">
                {(type === 'info' || type === 'regulations' || type === 'timeline') && (
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Titolo</label>
                        <input
                            type="text"
                            name="title"
                            value={item?.title || ''}
                            required
                            class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-bold text-gray-900 dark:text-white"
                        />
                    </div>
                )}

                {type === 'info' && (
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Sezione (slug)</label>
                        <input
                            type="text"
                            name="section"
                            value={item?.section || ''}
                            placeholder="es: info, campioni, cinture..."
                            class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-bold text-gray-900 dark:text-white"
                        />
                    </div>
                )}

                {type === 'timeline' && (
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Anno</label>
                        <input
                            type="text"
                            name="year"
                            value={item?.year || ''}
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
                            name="subtitle"
                            value={item?.subtitle || ''}
                            class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-bold text-gray-900 dark:text-white"
                        />
                    </div>
                )}

                {type === 'regulations' && (
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Link Esterno</label>
                        <input
                            type="url"
                            name="link_external"
                            value={item?.link_external || ''}
                            class="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none font-bold text-gray-900 dark:text-white"
                        />
                    </div>
                )}

                {(type === 'info' || type === 'regulations') && (
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Contenuto (HTML)</label>
                        <RichTextEditor
                            name="content"
                            id="content"
                            value={item?.content || ''}
                        />
                    </div>
                )}

                {type === 'timeline' && (
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Descrizione</label>
                        <RichTextEditor
                            name="description"
                            id="description"
                            value={item?.description || ''}
                        />
                    </div>
                )}
            </div>

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
    );
});
