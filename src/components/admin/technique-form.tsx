import { component$, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { parsePbError } from '~/lib/error-parser';
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
    const youtubeValue = useSignal(technique?.video_youtube || '');

    const extractYoutubeId = (url: string) => {
        if (!url) return '';
        if (url.length === 11) return url; // Already an ID
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:v\/|u\/\w\/|embed\/|watch\?v=))([^#&?]*)/);
        return (match && match[1].length === 11) ? match[1] : '';
    };

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
            const file = input.files[0];
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (file.size > maxSize) {
                error.value = 'L\'immagine è troppo grande. Il limite è 5MB.';
                input.value = '';
                previewImage.value = null;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            error.value = null;
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImage.value = event.target?.result as string;
            };
            reader.readAsDataURL(file);
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
                        <div class="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <label class="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Audio Pronuncia (MP3)</label>

                            {/* Drop Zone */}
                            <div class="relative group">
                                <div class="h-[100px] rounded-3xl bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center relative shadow-inner transition-colors group-hover:bg-gray-100 dark:group-hover:bg-gray-800">
                                    <div class="text-center">
                                        <span class="text-2xl block mb-1">�️</span>
                                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {previewAudio.value ? 'Sostituisci MP3' : 'Carica MP3'}
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
                                <div class="p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div class="flex items-center gap-3 mb-3">
                                        <span class="text-2xl">🎵</span>
                                        <div class="flex-1 min-w-0">
                                            <span class={`text-[9px] font-black uppercase tracking-widest block ${technique?.audio ? 'text-red-600' : 'text-gray-400'}`}>
                                                {technique?.audio ? 'File Caricato' : 'File di Sistema'}
                                            </span>
                                            <p class="text-[10px] text-gray-400 font-mono truncate">
                                                {technique?.audio || (previewAudio.value.startsWith('blob:') ? 'Nuovo File' : previewAudio.value.replace('/media/audio/', ''))}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-2">
                                        <audio
                                            key={previewAudio.value}
                                            src={previewAudio.value}
                                            controls
                                            class="h-10 flex-1 opacity-90"
                                            onPlay$={() => console.log('[TechniqueForm] Playing:', previewAudio.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick$={() => {
                                                const audio = new Audio(previewAudio.value!);
                                                audio.play().catch(err => alert('Errore: ' + err.message));
                                            }}
                                            class="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                                            title="Play diretto"
                                        >
                                            ▶️
                                        </button>
                                    </div>
                                </div>
                            )}
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
                                {extractYoutubeId(youtubeValue.value) && (
                                    <div class="mb-4 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 aspect-video relative group/yt">
                                        <iframe
                                            class="w-full h-full"
                                            src={`https://www.youtube.com/embed/${extractYoutubeId(youtubeValue.value)}`}
                                            title="YouTube Preview"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullscreen
                                        ></iframe>
                                    </div>
                                )}
                                <input
                                    type="text"
                                    name="video_youtube"
                                    value={youtubeValue.value}
                                    onInput$={(e) => {
                                        youtubeValue.value = (e.target as HTMLInputElement).value;
                                    }}
                                    placeholder="ID o Link YouTube"
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
