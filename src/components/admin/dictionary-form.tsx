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
                            {/* Drop Zone */}
                            <div class="relative group">
                                <div class="h-[100px] rounded-3xl bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center relative shadow-inner transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-800 focus-within:ring-2 focus-within:ring-emerald-500">
                                    <div class="text-center">
                                        <span class="text-2xl block mb-1">🎙️</span>
                                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {previewAudio.value ? 'Sostituisci Audio' : 'Carica MP3'}
                                        </span>
                                    </div>
                                    <input
                                        type="file"
                                        name="audio"
                                        accept="audio/mpeg, audio/mp3"
                                        onChange$={handleAudioChange}
                                        class="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                </div>
                            </div>

                            {/* Player Zone (Outside Drop Zone) */}
                            {previewAudio.value && (
                                <div class="p-4 mt-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div class="flex items-center gap-3 mb-3">
                                        <span class="text-2xl">🎵</span>
                                        <div class="flex-1 min-w-0">
                                            <span class="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Preview Pronuncia</span>
                                            <p class="text-[10px] text-gray-400 font-mono truncate">
                                                {term?.audio || (previewAudio.value.startsWith('blob:') ? 'Nuovo File' : 'File di Sistema')}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-2">
                                        <audio
                                            key={previewAudio.value}
                                            src={previewAudio.value}
                                            controls
                                            class="h-10 flex-1 opacity-90"
                                        />
                                        <button
                                            type="button"
                                            onClick$={() => {
                                                const audio = new Audio(previewAudio.value!);
                                                audio.play().catch(e => alert('Errore: ' + e.message));
                                            }}
                                            class="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            ▶️
                                        </button>
                                    </div>
                                </div>
                            )}
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
