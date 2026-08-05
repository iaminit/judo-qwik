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
            nome_completo: formData.get('nome_completo'),
            cintura_colore: formData.get('cintura_colore'),
            tipo: formData.get('tipo') || 'Kyu',
            grado: Number(formData.get('grado') || 0),
            ordine: Number(formData.get('ordine') || 0),
            requisiti: formData.get('requisiti') || '',
        };

        try {
            if (isNew) {
                await pbAdmin.collection('livelli_dan').create(data);
            } else {
                await pbAdmin.collection('livelli_dan').update(program.id, data);
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
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Nome Completo Grado / Livello</label>
                        <input
                            type="text"
                            name="nome_completo"
                            required
                            value={program?.nome_completo || program?.titolo || program?.belt}
                            placeholder="es. 6° Kyu (Bianca) o 1° Dan (Nera)"
                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold"
                        />
                    </div>
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Colore Cintura</label>
                        <input
                            type="text"
                            name="cintura_colore"
                            value={program?.cintura_colore || program?.belt}
                            placeholder="es. Bianca, Gialla, Nera..."
                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Tipo Grado</label>
                        <select
                            name="tipo"
                            value={program?.tipo || 'Kyu'}
                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold"
                        >
                            <option value="Kyu">Kyu (Cinture colorate)</option>
                            <option value="Dan">Dan (Cinture nere)</option>
                        </select>
                    </div>

                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Numero Grado</label>
                        <input
                            type="number"
                            name="grado"
                            value={program?.grado || 0}
                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold"
                        />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Ordine Visualizzazione</label>
                        <input
                            type="number"
                            name="ordine"
                            required
                            value={program?.ordine || program?.order || 0}
                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold"
                        />
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Requisiti e Programma Tecnico (Supporta HTML)</label>
                    <RichTextEditor
                        name="requisiti"
                        id="requisiti_programma"
                        value={program?.requisiti || program?.contenuto || program?.description}
                        placeholder="Elenca le tecniche e i requisiti richiesti per questo grado..."
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
                        class="px-10 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-xl shadow-red-600/20 hover:transform hover:-translate-y-1 transition-all disabled:opacity-50"
                    >
                        {loading.value ? 'Salvataggio...' : (isNew ? 'Crea Programma' : 'Salva Modifiche')}
                    </button>
                </div>
            </form>
        </div>
    );
});
