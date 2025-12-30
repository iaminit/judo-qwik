import { component$, useSignal, useStore, useComputed$, useVisibleTask$, $, useContext, useStyles$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, useLocation } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';
import TechniqueCard, { type Technique } from '~/components/technique-card';
import fs from 'node:fs';
import path from 'node:path';

export const useTechniquesData = routeLoader$(async () => {
  try {
    console.log('[Techniques] Fetching techniques records...');
    const records = await pb.collection('techniques').getFullList({
      sort: 'order,name',
      requestKey: null,
    });
    console.log('[Techniques] Fetched', records.length, 'techniques');

    // Load technique_images to check which techniques have images
    const [techniqueImages, mediaFiles] = await Promise.all([
      pb.collection('technique_images').getFullList({
        requestKey: null,
      }).catch(() => []),
      new Promise<string[]>((resolve) => {
        const mediaPath = path.join(process.cwd(), 'public', 'media');
        fs.readdir(mediaPath, (err, files) => {
          if (err) {
            console.error('[Techniques] Error reading media directory:', err);
            resolve([]);
          } else {
            resolve(files);
          }
        });
      })
    ]);

    const mediaFileSet = new Set(mediaFiles);

    // Create a Map of technique ID → actual image filename from DB
    const techniqueImageMap = new Map<string, string>(
      techniqueImages.map((img: any) => {
        // Try multiple common field names for the image path
        const rawPath = img.path || img.image_file || img.image || '';
        // Extract filename from path (e.g., "media/o-soto-gari.webp" → "o-soto-gari.webp")
        const filename = rawPath ? rawPath.replace(/^media\//, '').split('/').pop() : '';
        return [img.technique, filename];
      })
    );

    const techniques: Technique[] = records.map((t: any) => {
      // 1. Generate slug-based fallback (e.g., "O-Soto-Gari" -> "o-soto-gari.webp")
      let slugBase = t.name.toLowerCase()
        .trim()
        .replace(/ō/g, 'o')
        .replace(/ū/g, 'u')
        .replace(/ā/g, 'a')
        .replace(/ī/g, 'i')
        .replace(/ē/g, 'e')
        .replace(/[\s/]+/g, '-');

      // Hyphenation patterns for Judo terms in filenames
      slugBase = slugBase.replace(/tsuri-?komi/g, 'tsuri-komi');
      slugBase = slugBase.replace(/seoi-?nage/g, 'seoi-nage');
      slugBase = slugBase.replace(/maki-?komi/g, 'maki-komi');
      slugBase = slugBase.replace(/ashi-?guruma/g, 'ashi-guruma');
      slugBase = slugBase.replace(/de-?ashi/g, 'de-ashi');
      slugBase = slugBase.replace(/o-?goshi/g, 'o-goshi');
      slugBase = slugBase.replace(/o-?uchi/g, 'o-uchi');
      slugBase = slugBase.replace(/ko-?uchi/g, 'ko-uchi');
      slugBase = slugBase.replace(/o-?soto/g, 'o-soto');
      slugBase = slugBase.replace(/ko-?soto/g, 'ko-soto');

      const slugBaseClean = slugBase
        .replace(/[^-a-z0-9]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Try to find the image in media folder with priority extensions
      // We also handle common variations in naming (shio/shiho, hishigi/hisiji)
      const extensions = ['.webp', '.svg', '.jpg', '.jpeg', '.png', '.gif'];
      const variations = [
        slugBaseClean,
        slugBaseClean.replace(/shio/g, 'shiho'),
        slugBaseClean.replace(/shiho/g, 'shio'),
        slugBaseClean.replace(/hishigi/g, 'hisiji'),
        slugBaseClean.replace(/hisiji/g, 'hishigi'),
        slugBaseClean.replace(/-/g, '_'), // Try underscore instead of hyphen
        slugBaseClean.replace(/-/g, ''),  // Try no separators
      ];

      let foundImage = '';

      search_loop: for (const variant of variations) {
        for (const ext of extensions) {
          if (mediaFileSet.has(variant + ext)) {
            foundImage = variant + ext;
            break search_loop;
          }
        }
      }

      // 2. Audio normalization (mostly no hyphens)
      const normalizedName = t.name.toLowerCase()
        .replace(/[\s-]/g, '')
        .replace(/ō/g, 'o')
        .replace(/ū/g, 'u')
        .replace(/ā/g, 'a')
        .replace(/ī/g, 'i')
        .replace(/ē/g, 'e');

      const pbAudio = t.audio ? pb.files.getUrl(t, t.audio) : null;
      const fallbackAudio = `${normalizedName}.mp3`;

      // 3. Resolve Image: DB first, then slug fallback, then general placeholder
      const dbImage = techniqueImageMap.get(t.id);
      let imageName = (dbImage && dbImage !== '') ? dbImage : foundImage;

      // Final fallback if still no image
      if (!imageName) {
        imageName = 'kano_non_sa.webp';
      }

      return {
        id: t.id,
        nome: t.name,
        gruppo: t.group,
        tipo: t.category,
        descrizione: t.description,
        video_youtube: t.video_youtube,
        audio_file: pbAudio || fallbackAudio,
        has_audio: !!pbAudio || true,
        dan_level: t.dan_level || 1,
        image: imageName
      };
    });

    return { techniques };
  } catch (err) {
    console.error('Error loading techniques:', err);
    return { techniques: [], error: 'Impossibile caricare le tecniche. Riprova più tardi.' };
  }
});

export default component$(() => {
  useQuillStyles();
  const loc = useLocation();
  const data = useTechniquesData();

  const searchTerm = useSignal('');
  const modalTechnique = useSignal<Technique | null>(null);
  const targetId = useSignal<string | null>(null);
  const appState = useContext(AppContext);

  useVisibleTask$(({ track }) => {
    track(() => modalTechnique.value);
    if (modalTechnique.value) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  useVisibleTask$(() => {
    appState.sectionTitle = 'Tecniche';
    appState.sectionIcon = '🥋';
  });

  const activeFilters = useStore({
    group: null as string | null,
    category: null as string | null,
    dan: null as number | null,
  });

  const openSections = useStore({
    settings: false,
    gokyo: true,
    tachiwaza: true,
    sutemiwaza: false,
    dan: false,
  });

  useVisibleTask$(({ track }) => {
    track(() => loc.url.searchParams);
    const searchParam = loc.url.searchParams.get('search');
    const idParam = loc.url.searchParams.get('id');
    if (searchParam) {
      searchTerm.value = searchParam;
    }
    if (idParam) {
      targetId.value = idParam;
      setTimeout(() => { targetId.value = null; }, 3000);
    }
  });

  const filteredTechniques = useComputed$(() => {
    return data.value.techniques.filter(tech => {
      const matchesSearch = tech.nome.toLowerCase().includes(searchTerm.value.toLowerCase());
      const matchesGroup = !activeFilters.group || tech.gruppo === activeFilters.group;
      const matchesCategory = !activeFilters.category || tech.tipo === activeFilters.category;
      const matchesDan = !activeFilters.dan || tech.dan_level === activeFilters.dan;
      return matchesSearch && matchesGroup && matchesCategory && matchesDan;
    });
  });

  const toggleSection = $((section: keyof typeof openSections) => {
    openSections[section] = !openSections[section];
  });

  const handleFilterClick = $((type: 'group' | 'category' | 'dan', value: string | number) => {
    if (type === 'dan') {
      activeFilters.dan = activeFilters.dan === value ? null : value as number;
    } else {
      activeFilters[type] = activeFilters[type] === value ? null : value as string;
    }
  });

  const resetFilters = $(() => {
    activeFilters.group = null;
    activeFilters.category = null;
    activeFilters.dan = null;
    searchTerm.value = '';
  });

  const openModal = $((technique: Technique) => {
    modalTechnique.value = technique;
  });

  const closeModal = $(() => {
    modalTechnique.value = null;
  });

  const nextTechnique = $(() => {
    if (!modalTechnique.value) return;
    const index = filteredTechniques.value.findIndex(t => t.id === modalTechnique.value?.id);
    if (index === -1) return;
    const nextIndex = (index + 1) % filteredTechniques.value.length;
    modalTechnique.value = filteredTechniques.value[nextIndex];
  });

  const prevTechnique = $(() => {
    if (!modalTechnique.value) return;
    const index = filteredTechniques.value.findIndex(t => t.id === modalTechnique.value?.id);
    if (index === -1) return;
    const prevIndex = (index - 1 + filteredTechniques.value.length) % filteredTechniques.value.length;
    modalTechnique.value = filteredTechniques.value[prevIndex];
  });

  const touchStart = useSignal(0);
  const handleTouchStart = $((e: TouchEvent) => {
    touchStart.value = e.touches[0].clientX;
  });

  const handleTouchEnd = $((e: TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart.value - touchEnd;
    if (Math.abs(diff) > 70) { // Threshold for swipe
      if (diff > 0) nextTechnique();
      else prevTechnique();
    }
  });

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
    return match ? match[1] : null;
  };

  return (
    <div class="space-y-10 pb-20 pt-10 relative">
      {/* Search Bar & Settings Button - Aligned on the same line */}
      <header class="max-w-4xl mx-auto px-4 mt-6">
        <div class="flex items-center gap-4">
          <div class="relative flex-1 group">
            <input
              type="text"
              placeholder="Cerca una tecnica..."
              value={searchTerm.value}
              onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
              class="w-full pl-6 pr-14 py-4 rounded-[2rem] bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 focus:outline-none focus:ring-4 focus:ring-red-500/5 transition-all shadow-2xl shadow-gray-200/50 dark:shadow-none text-lg text-gray-900 dark:text-white placeholder-gray-400 font-bold"
            />
            <div class="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
              <span class="text-xl opacity-30 group-focus-within:opacity-100 group-focus-within:text-red-500 transition-all">🔍</span>
            </div>
          </div>

          <button
            onClick$={() => toggleSection('settings')}
            class={`relative flex flex-col items-center justify-center p-4 rounded-[2rem] transition-all duration-500 border h-[72px] min-w-[72px] group overflow-hidden ${openSections.settings
              ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-500/30 scale-95'
              : 'bg-white dark:bg-slate-900 text-slate-400 border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-none hover:border-red-500/30'
              }`}
          >
            {/* Technique Count Badge - Integrated */}
            <div class={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter transition-all duration-500 ${openSections.settings ? 'bg-white text-red-600' : 'bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white'
              }`}>
              {filteredTechniques.value.length}
            </div>

            <span class={`text-2xl transition-transform duration-700 ${openSections.settings ? 'rotate-90' : 'group-hover:rotate-45'}`}>
              ⚙️
            </span>
            <span class={`text-[7px] font-black uppercase tracking-[0.2em] mt-1 transition-opacity duration-500 ${openSections.settings ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
              Filtri
            </span>
          </button>
        </div>
      </header>

      {/* Filters Overlay - Premium Dictionary style */}
      <div class={`max-w-4xl mx-auto transition-all duration-500 overflow-hidden ${openSections.settings ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div class="surface-elevated p-8 mb-10">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-xl font-black uppercase tracking-widest text-red-600 dark:text-red-400 flex items-center gap-3">
              <span class="w-1.5 h-6 bg-red-600 rounded-full"></span>
              Filtra
            </h2>
            <button onClick$={resetFilters} class="text-xs font-black uppercase text-gray-400 hover:text-red-500 tracking-widest">
              Reset Filtri
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Go-Kyo Groups */}
            <div class="space-y-6">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Gokyo no Waza</h3>
              <div class="flex flex-wrap gap-2">
                {['Dai Ikkyo', 'Dai Nikyo', 'Dai Sankyo', 'Dai Yonkyo', 'Dai Gokyo'].map(g => (
                  <button
                    key={g}
                    onClick$={() => handleFilterClick('group', g)}
                    class={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${activeFilters.group === g
                      ? 'bg-red-600 text-white border-red-600 shadow-lg'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-transparent hover:border-red-500/30'
                      }`}
                  >
                    {g.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div class="space-y-6">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Classificazione</h3>
              <div class="flex flex-wrap gap-2">
                {['Te-waza', 'Koshi-waza', 'Ashi-waza', 'Ma-sutemi-waza', 'Yoko-sutemi-waza'].map(c => (
                  <button
                    key={c}
                    onClick$={() => handleFilterClick('category', c)}
                    class={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${activeFilters.category === c
                      ? 'bg-red-600 text-white border-red-600 shadow-lg'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-transparent hover:border-red-500/30'
                      }`}
                  >
                    {c.replace('-waza', '').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid - Using the standard TechniqueCard which will inherit global surface-elevated style */}
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
        {filteredTechniques.value.map(tech => (
          <TechniqueCard
            key={tech.id}
            technique={tech}
            onOpenModal={openModal}
            isTarget={tech.id === targetId.value}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTechniques.value.length === 0 && (
        <div class="text-center py-24">
          <div class="text-7xl mb-6">🥋</div>
          <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Nessuna tecnica trovata</h3>
          <p class="text-gray-500 dark:text-ice-gray mt-4 max-w-xs mx-auto">Prova a raffinare i filtri o la ricerca.</p>
          <button
            onClick$={resetFilters}
            class="mt-10 px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-red-500/20"
          >
            Resetta Filtri
          </button>
        </div>
      )}

      {/* MODAL SYSTEM - Upgraded to Premium Style */}
      <div
        class={`fixed inset-0 z-[100] transition-all duration-500 ${modalTechnique.value ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      >
        <div onClick$={closeModal} class="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" />

        {/* Navigation Arrows - Integrated into sides */}
        {modalTechnique.value && filteredTechniques.value.length > 1 && (
          <div class="fixed inset-y-0 inset-x-4 md:inset-x-10 flex justify-between items-center pointer-events-none z-[120]">
            <button
              onClick$={prevTechnique}
              class="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all pointer-events-auto shadow-2xl active:scale-90"
            >
              <svg class="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick$={nextTechnique}
              class="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all pointer-events-auto shadow-2xl active:scale-95"
            >
              <svg class="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        )}

        <div
          onTouchStart$={handleTouchStart}
          onTouchEnd$={handleTouchEnd}
          class={`relative w-full h-full bg-white dark:bg-slate-900 overflow-hidden transition-all duration-500 transform ${modalTechnique.value ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}
        >
          {modalTechnique.value && (
            <div class="flex flex-col md:flex-row h-full">
              {/* Modal Visual Area / Image */}
              <div class="w-full md:w-1/2 bg-white flex flex-col items-center justify-center relative min-h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 overflow-hidden">
                <div class="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={`/media/${modalTechnique.value.image}`}
                    alt={modalTechnique.value.nome}
                    class="relative z-10 max-w-full h-auto max-h-80 md:max-h-[70vh] object-contain transition-transform duration-700 hover:scale-105"
                    onError$={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.indexOf('kano_non_sa.webp') === -1) {
                        target.onerror = null;
                        target.src = '/media/kano_non_sa.webp';
                      }
                    }}
                  />
                  {/* Premium Contact Shadow */}
                  <div class="w-2/3 h-4 bg-black/10 blur-xl rounded-[100%] mt-4 animate-pulse" />
                </div>

                {/* Custom Close Button - Floating */}
                <button
                  onClick$={closeModal}
                  class="absolute top-8 left-8 w-12 h-12 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-red-500/20 rounded-full text-red-600 flex items-center justify-center shadow-xl z-20 active:scale-90 transition-transform"
                >
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Modal Info Area */}
              <div class="w-full md:w-1/2 flex flex-col h-full overflow-hidden">
                <div class="flex-1 p-6 md:p-16 overflow-y-auto custom-scrollbar">
                  <div class="flex items-center justify-center md:justify-start gap-3 mb-6 md:mb-8">
                    <span class="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest">
                      {modalTechnique.value.tipo}
                    </span>
                    <span class="px-3 py-1 bg-gray-500/10 text-gray-500 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest">
                      {modalTechnique.value.gruppo}
                    </span>
                  </div>

                  <h2 class="text-xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-none uppercase text-center md:text-left">
                    {modalTechnique.value.nome}
                  </h2>

                  <div class="ql-container ql-snow" style={{ border: 'none' }}>
                    <div
                      class="ql-editor !p-0 !text-inherit !text-sm md:!text-base"
                      dangerouslySetInnerHTML={modalTechnique.value.descrizione}
                    />
                  </div>

                  <div class="mt-8 md:mt-12 space-y-6 md:space-y-4">
                    {/* Audio Pronunciation */}
                    {modalTechnique.value.has_audio && (
                      <button
                        onClick$={() => {
                          const audioUrl = modalTechnique.value!.audio_file!.startsWith('http')
                            ? modalTechnique.value!.audio_file!
                            : `/media/audio/${modalTechnique.value!.audio_file}`;
                          new Audio(audioUrl).play();
                        }}
                        class="w-full py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center gap-3"
                      >
                        🔊 Ascolta Pronuncia
                      </button>
                    )}

                    {/* YouTube Video - Premium Embed */}
                    {modalTechnique.value.video_youtube && getYouTubeVideoId(modalTechnique.value.video_youtube) && (
                      <div class="animate-in fade-in slide-in-from-top-4 duration-700">
                        <div class="flex items-center gap-2 mb-4">
                          <span class="w-1 h-3 bg-red-600 rounded-full"></span>
                          <span class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Dimostrazione Video</span>
                        </div>
                        <div class="aspect-video rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 bg-slate-950 relative group">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(modalTechnique.value.video_youtube)}`}
                            title={modalTechnique.value.nome}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullscreen
                            class="w-full h-full"
                          ></iframe>
                        </div>
                      </div>
                    )}

                    {/* YouTube Redirect - Premium Button */}
                    {modalTechnique.value.video_youtube && (
                      <button
                        onClick$={() => {
                          const term = modalTechnique.value?.nome || '';
                          const cleanDesc = (modalTechnique.value?.descrizione || '').replace(/<[^>]*>?/gm, ' ').substring(0, 50);
                          const query = encodeURIComponent(`Judo ${term} ${cleanDesc}`);
                          window.open(`https://www.google.com/search?q=${query}`, '_blank');
                        }}
                        class="w-full py-5 bg-gradient-to-r from-red-600 to-red-500 text-white font-black rounded-[1.5rem] md:rounded-2xl hover:scale-[1.02] transition-transform shadow-xl shadow-red-500/20 flex flex-col items-center justify-center leading-none group"
                      >
                        <span class="text-[8px] md:text-[9px] uppercase tracking-[0.2em] mb-2 opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">Ricerca Approfondita</span>
                        <div class="flex items-center gap-2">
                          <span class="text-sm md:text-base uppercase tracking-wider">Approfondisci su Google</span>
                          <span class="text-xl">✨</span>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Spacing for mobile to avoid content cut-off by the close button if it was sticky */}
                  <div class="h-10 md:hidden" />
                </div>

                {/* Desktop Close Button */}
                <button
                  onClick$={closeModal}
                  class="absolute top-6 right-6 w-12 h-12 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white hidden md:flex items-center justify-center text-2xl transition-all"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Add global styles for Quill support
const useQuillStyles = () => {
  useStyles$(`
    @import 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    .ql-editor { 
      padding: 0 !important; 
      color: inherit !important;
      line-height: 1.8 !important;
      font-size: 1.1rem !important;
    }
    .ql-editor * { color: inherit !important; }
    .dark .ql-editor { color: #f3f4f6 !important; }
    .ql-container.ql-snow { border: none !important; font-family: inherit !important; height: auto !important; }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.2);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(156, 163, 175, 0.4);
    }
    
    .ql-color-red { color: #ef4444 !important; }
    .ql-color-green { color: #22c55e !important; }
    .ql-color-blue { color: #3b82f6 !important; }
    .ql-color-orange { color: #f97316 !important; }
  `);
};

export const head: DocumentHead = {
  title: '技 Tecniche - JudoOK Premium',
  meta: [
    {
      name: 'description',
      content: 'Database premium delle tecniche di Judo - Gokyo no Waza con design d\'avanguardia.',
    },
  ],
};
