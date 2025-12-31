import { component$, $, useSignal } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { parsePbError } from '~/lib/error-parser';
import RichTextEditor from './rich-text-editor';

interface ProgramFormProps {
    program?: any;
    isNew?: boolean;
}

export default component$<ProgramFormProps>(({ program, isNew }) => {
    const nav = useNavigate();
    const loading = useSignal(false);
    const error = useSignal<string | null>(null);

    const handleSubmit = $(async (e: Event) => {
        e.preventDefault();
        loading.value = true;
        error.value = null;

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        const data: any = {
            title: formData.get('title'),
            section_type: formData.get('section_type'),
            content: formData.get('content'),
            dan_level: Number(formData.get('dan_level')),
            order: Number(formData.get('order')),
        };

        try {
            if (isNew) {
                await pbAdmin.collection('exam_program').create(data);
            } else {
                await pbAdmin.collection('exam_program').update(program.id, data);
            }
            nav('/gestione/programma');
        } catch (err: any) {
            error.value = parsePbError(err);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            loading.value = false;
        }
    });

    return (
        <div class="max-w-4xl mx-auto">
            <form onSubmit$={handleSubmit} class="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {error.value && (
                    <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 font-bold flex items-center gap-3">
                        <span>⚠️</span>
                        {error.value}
                    </div>
                )}

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="space-y-2 md:col-span-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Titolo Sezione</label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={program?.title}
                            placeholder="es. Nage Waza"
                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white font-bold"
                        />
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Sezione (Badge)</label>
                        <input
                            type="text"
                            name="section_type"
                            value={program?.section_type}
                            placeholder="es. Pratica"
                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white font-bold"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Livello Dan (1-6)</label>
                        <input
                            type="number"
                            name="dan_level"
                            required
                            min={1}
                            max={6}
                            value={program?.dan_level || 1}
                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white font-bold"
                        />
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Ordine Visualizzazione</label>
                        <input
                            type="number"
                            name="order"
                            required
                            value={program?.order || 0}
                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white font-bold"
                        />
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Contenuto Programma</label>
                    <RichTextEditor
                        name="content"
                        id="content"
                        value={program?.content}
                        placeholder="Elenca le tecniche e i requisiti..."
                    />
                </div>

                <div class="pt-10 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick$={() => nav('/gestione/programma')}
                        class="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                        Annulla
                    </button>
                    <button
                        type="submit"
                        disabled={loading.value}
                        class="px-10 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-lg shadow-xl shadow-black/10 hover:transform hover:-translate-y-1 transition-all disabled:opacity-50"
                    >
                        {loading.value ? 'Salvataggio...' : (isNew ? 'Crea Programma' : 'Salva Modifiche')}
                    </button>
                </div>
            </form>
        </div>
    );
});
