import { component$, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import RichTextEditor from './rich-text-editor';

interface TechniqueFormProps {
    technique?: any;
    isNew?: boolean;
}

export default component$<TechniqueFormProps>(({ technique, isNew }) => {
    const nav = useNavigate();
    const loading = useSignal(false);
    const error = useSignal<string | null>(null);
    const previewImage = useSignal<string | null>(null);
    const previewAudio = useSignal<string | null>(null);
    const isFallback = useSignal(false);
    const audioInputRef = useSignal<HTMLInputElement>();

    useVisibleTask$(({ track }) => {
        track(() => technique);

        const getUrl = (record: any, fileName: string) => {
            if (!fileName) return null;
            if (fileName.startsWith('media/')) return '/' + fileName;
            const cleanFileName = fileName.replace(/^media\//, '');
            return pbAdmin.files.getUrl(record, cleanFileName);
        };

        const getSlugFallback = (name: string) => {
            if (!name) return null;
            let slug = name.toLowerCase()
                .trim()
                .replace(/ō/g, 'o')
                .replace(/ū/g, 'u')
                .replace(/ā/g, 'a')
                .replace(/ī/g, 'i')
                .replace(/ē/g, 'e')
                .replace(/[\s/]+/g, '-');

            // Patterns consistent with public page
            slug = slug.replace(/tsuri-?komi/g, 'tsuri-komi')
                .replace(/seoi-?nage/g, 'seoi-nage')
                .replace(/o-?soto/g, 'o-soto')
                .replace(/o-?goshi/g, 'o-goshi');

            const finalSlug = slug
                .replace(/[^-a-z0-9]/g, '')
                .replace(/--+/g, '-')
                .replace(/^-+|-+$/g, '')
                + '.webp';

            return '/media/' + finalSlug;
        };

        const getAudioSlugFallback = (name: string) => {
            if (!name) return null;
            const clean = name.toLowerCase()
                .trim()
                .replace(/ō/g, 'o')
                .replace(/ū/g, 'u')
                .replace(/ā/g, 'a')
                .replace(/ī/g, 'i')
                .replace(/ē/g, 'e')
                .replace(/[\s/-]+/g, ''); // Remove spaces, dashes, slashes for audio
            return `/media/audio/${clean}.mp3`;
        };

        if (technique?.image) {
            previewImage.value = getUrl(technique, technique.image);
            isFallback.value = false;
        } else if (technique?.image_from_collection) {
            const { file } = technique.image_from_collection;
            previewImage.value = getUrl(technique.image_from_collection, file);
            isFallback.value = false;
        } else {
            const slugImage = getSlugFallback(technique?.name);
            if (slugImage) {
                previewImage.value = slugImage;
                isFallback.value = false;
            } else {
                previewImage.value = '/media/kano_non_sa.webp';
                isFallback.value = true;
            }
        }

        // Audio preview logic
        if (technique?.audio) {
            if (technique.audio.startsWith('http')) {
                previewAudio.value = technique.audio;
            } else if (technique.audio.startsWith('media/')) {
                previewAudio.value = '/' + technique.audio;
            } else {
                previewAudio.value = pbAdmin.files.getUrl(technique, technique.audio);
            }
        } else if (technique?.name) {
            previewAudio.value = getAudioSlugFallback(technique.name);
        }
        console.log('[TechniqueForm] Resolved audio URL:', previewAudio.value);
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

    const handleAudioChange = $((e: Event) => {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const url = URL.createObjectURL(input.files[0]);
            previewAudio.value = url;
            console.log('[TechniqueForm] New audio preview URL:', url);
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
                await pbAdmin.collection('techniques').create(formData);
            } else {
                await pbAdmin.collection('techniques').update(technique.id, formData);
            }
            nav('/gestione/tecniche');
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

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Side: Image Upload */}
                    <div class="space-y-4">
                        <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Immagine Tecnica</label>
                        <div class="relative group">
                            <div class="aspect-square rounded-3xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center relative shadow-inner">
                                {previewImage.value ? (
                                    <img
                                        src={previewImage.value}
                                        class={`w-full h-full object-contain p-2 ${isFallback.value ? 'grayscale' : ''}`}
                                        alt="Preview"
                                        onError$={(e) => {
                                            if (!isFallback.value) {
                                                (e.target as HTMLImageElement).src = '/media/kano_non_sa.webp';
                                                (e.target as HTMLImageElement).classList.add('grayscale');
                                            }
                                        }}
                                    />
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
                        <p class="text-[10px] text-gray-400 font-medium px-2 italic">Formati consigliati: .webp, .jpg. Dimensione max: 5MB.</p>

                        {/* Audio Upload Section */}
                        <div class="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Audio Pronuncia (MP3)</label>
                            <div class="relative group">
                                <div class="min-h-[180px] rounded-3xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center relative shadow-inner">
                                    {previewAudio.value ? (
                                        <div class="text-center p-4">
                                            <span class="text-3xl block mb-2">🎵</span>
                                            <span class={`text-[10px] font-black uppercase tracking-widest block mb-1 ${technique?.audio ? 'text-red-600' : 'text-gray-400'}`}>
                                                {technique?.audio ? 'File Caricato' : 'File di Sistema'}
                                            </span>
                                            <p class="text-[9px] text-gray-400 font-mono truncate max-w-[150px] mb-2">
                                                {technique?.audio || (previewAudio.value ? previewAudio.value.replace('/media/audio/', '') : '')}
                                            </p>

                                            {/* Advanced Player */}
                                            <div class="flex items-center gap-2">
                                                <audio
                                                    key={previewAudio.value}
                                                    src={previewAudio.value}
                                                    controls
                                                    class="h-10 w-full opacity-80 hover:opacity-100 transition-opacity"
                                                    onPlay$={() => console.log('[TechniqueForm] Playing:', previewAudio.value)}
                                                    onError$={(e) => {
                                                        const target = e.target as HTMLAudioElement;
                                                        console.error('[TechniqueForm] Audio Error:', target.error?.message, 'URL:', previewAudio.value);
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick$={() => {
                                                        const audio = new Audio(previewAudio.value!);
                                                        audio.play().catch(err => alert('Errore riproduzione: ' + err.message));
                                                    }}
                                                    class="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Play diretto"
                                                >
                                                    ▶️
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div class="text-center">
                                            <span class="text-2xl block mb-1">🎙️</span>
                                            <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Seleziona MP3</span>
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
                                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl pointer-events-none">
                                    <span class="text-white font-black uppercase tracking-widest text-[10px]">
                                        {previewAudio.value ? 'Sostituisci Audio' : 'Carica Audio'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form Fields */}
                    <div class="lg:col-span-2 space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Nome Tecnica</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={technique?.name}
                                    placeholder="es. Seoi Nage"
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold"
                                />
                            </div>
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Gruppo (Gokyo/Altri)</label>
                                <select
                                    name="group"
                                    required
                                    value={technique?.group}
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold appearance-none"
                                >
                                    <option value="I Kyo">I Kyo</option>
                                    <option value="II Kyo">II Kyo</option>
                                    <option value="III Kyo">III Kyo</option>
                                    <option value="IV Kyo">IV Kyo</option>
                                    <option value="V Kyo">V Kyo</option>
                                    <option value="Habukiretsu">Habukiretsu</option>
                                    <option value="Shimmeisho No Waza">Shimmeisho No Waza</option>
                                    <option value="Altri">Altri</option>
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Categoria (Nage Waza/Katame Waza...)</label>
                                <select
                                    name="category"
                                    required
                                    value={technique?.category}
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold appearance-none"
                                >
                                    <option value="Nage Waza">Nage Waza</option>
                                    <option value="Katame Waza">Katame Waza</option>
                                    <option value="Atemi Waza">Atemi Waza</option>
                                    <option value="Ne Waza">Ne Waza</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Ordine</label>
                                <input
                                    type="number"
                                    name="order"
                                    value={technique?.order || 1}
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold"
                                />
                            </div>
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Dan (1-6)</label>
                                <input
                                    type="number"
                                    name="dan_level"
                                    min="1"
                                    max="6"
                                    value={technique?.dan_level || 1}
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold"
                                />
                            </div>
                            <div class="space-y-2">
                                <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">YouTube ID</label>
                                <input
                                    type="text"
                                    name="video_youtube"
                                    value={technique?.video_youtube}
                                    placeholder="ID video (es. dQw4w9WgXcQ)"
                                    class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold"
                                />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Descrizione</label>
                            <RichTextEditor
                                id="description"
                                name="description"
                                value={technique?.description}
                                placeholder="Descrivi la tecnica, i suoi principi e punti chiave..."
                            />
                        </div>
                    </div>
                </div>

                <div class="pt-10 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick$={() => nav('/gestione/tecniche')}
                        class="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                        Annulla
                    </button>
                    <button
                        type="submit"
                        disabled={loading.value}
                        class="px-10 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-lg shadow-xl shadow-black/10 hover:transform hover:-translate-y-1 transition-all disabled:opacity-50"
                    >
                        {loading.value ? 'Salvataggio...' : (isNew ? 'Crea Tecnica' : 'Salva Modifiche')}
                    </button>
                </div>
            </form>
        </div>
    );
});
