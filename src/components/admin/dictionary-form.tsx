import { component$, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import RichTextEditor from './rich-text-editor';

interface DictionaryFormProps {
    term?: any;
    isNew?: boolean;
}

export default component$<DictionaryFormProps>(({ term, isNew }) => {
    const nav = useNavigate();
    const loading = useSignal(false);
    const error = useSignal<string | null>(null);
    const previewAudio = useSignal<string | null>(null);

    useVisibleTask$(({ track }) => {
        track(() => term);
        if (term?.audio) {
            previewAudio.value = term.audio.startsWith('media/') ? '/' + term.audio : pbAdmin.files.getUrl(term, term.audio);
        }
    });

    const handleAudioChange = $((e: Event) => {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const url = URL.createObjectURL(input.files[0]);
            previewAudio.value = url;
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
                await pbAdmin.collection('dictionary').create(formData);
            } else {
                await pbAdmin.collection('dictionary').update(term.id, formData);
            }
            nav('/gestione/dizionario');
        } catch (err: any) {
            console.error('Form Error:', err);
            error.value = err.message || 'Errore durante il salvataggio';
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

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Term & Kanji */}
                    <div class="space-y-6">
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Termine</label>
                            <input
                                type="text"
                                name="term"
                                required
                                value={term?.term}
                                placeholder="es. Dojo"
                                class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-white font-bold"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Kanji</label>
                            <input
                                type="text"
                                name="kanji"
                                value={term?.kanji}
                                placeholder="es. 道場"
                                class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-white font-serif text-xl"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Pronuncia</label>
                            <input
                                type="text"
                                name="pronunciation"
                                value={term?.pronunciation}
                                placeholder="es. doo-joo"
                                class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-white font-medium"
                            />
                        </div>
                    </div>

                    {/* Audio Upload */}
                    <div class="space-y-6">
                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">File Audio (MP3)</label>
                            <div class="relative group">
                                <div class="aspect-[4/1] md:aspect-[4/2] rounded-3xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                                    {previewAudio.value ? (
                                        <div class="text-center p-4">
                                            <span class="text-3xl block mb-2">🎵</span>
                                            <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Preview Audio</span>

                                            {/* Advanced Player */}
                                            <div class="flex items-center gap-2">
                                                <audio
                                                    key={previewAudio.value}
                                                    src={previewAudio.value}
                                                    controls
                                                    class="h-8 w-full opacity-60 hover:opacity-100 transition-opacity"
                                                />
                                                <button
                                                    type="button"
                                                    onClick$={() => {
                                                        if (previewAudio.value) {
                                                            const audio = new Audio(previewAudio.value);
                                                            audio.play().catch(e => alert('Errore riproduzione: ' + e.message));
                                                        }
                                                    }}
                                                    class="p-1 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                                >
                                                    ▶️
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div class="text-center">
                                            <span class="text-3xl block mb-2">🎙️</span>
                                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seleziona MP3</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        name="audio"
                                        accept="audio/mpeg, audio/mp3"
                                        onChange$={handleAudioChange}
                                        class="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                {term?.audio && (
                                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl pointer-events-none">
                                        <span class="text-white font-black uppercase tracking-widest text-xs">Sostituisci Audio</span>
                                    </div>
                                )}
                            </div>
                            <p class="text-[10px] text-gray-400 font-medium px-2 italic">Trascina un file MP3 per la pronuncia corretta.</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Descrizione</label>
                    <RichTextEditor
                        name="description"
                        id="description"
                        value={term?.description}
                        placeholder="Significato storico, tecnico o filosofico del termine..."
                    />
                </div>

                <div class="pt-10 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick$={() => nav('/gestione/dizionario')}
                        class="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                        Annulla
                    </button>
                    <button
                        type="submit"
                        disabled={loading.value}
                        class="px-10 py-4 rounded-2xl bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-500/20 hover:transform hover:-translate-y-1 transition-all disabled:opacity-50"
                    >
                        {loading.value ? 'Salvataggio...' : (isNew ? 'Crea Termine' : 'Salva Modifiche')}
                    </button>
                </div>
            </form >
        </div >
    );
});
