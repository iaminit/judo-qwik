import { component$, useSignal, useStore, useComputed$, useVisibleTask$, $, useContext, useStyles$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, useLocation } from '@builder.io/qwik-city';
import { pb, getPBFileUrl } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';
import TechniqueCard, { type Technique } from '~/components/technique-card';
import fs from 'node:fs';
import path from 'node:path';

export const useTechniquesData = routeLoader$(async () => {
  try {
    console.log('[Techniques] Fetching techniques records from collection "tecniche"...');

    const records = await pb.collection('tecniche').getFullList({
      sort: 'ordine,titolo',
      requestKey: null,
    });

    console.log('[Techniques] Fetched', records.length, 'techniques');

    // Read media files from all possible server locations safely
    const mediaFiles = await new Promise<string[]>((resolve) => {
      const pathsToTry = [
        path.join(process.cwd(), 'public', 'media'),
        path.join(process.cwd(), 'dist', 'media'),
        path.join(process.cwd(), 'pb_data', 'media'),
        path.join(process.cwd(), 'media'),
      ];

      const allFiles = new Set<string>();
      let pending = pathsToTry.length;

      pathsToTry.forEach((p) => {
        fs.readdir(p, (err, files) => {
          if (!err && files) {
            files.forEach((f) => allFiles.add(f));
          }
          pending--;
          if (pending === 0) {
            resolve(Array.from(allFiles));
          }
        });
      });
    });

    // Read kata_thumbs directory for fallback technique images
    const kataThumbFiles = await new Promise<string[]>((resolve) => {
      const thumbPaths = [
        path.join(process.cwd(), 'public', 'media', 'kata_thumbs'),
        path.join(process.cwd(), 'dist', 'media', 'kata_thumbs'),
      ];
      const thumbFiles = new Set<string>();
      let pending = thumbPaths.length;
      thumbPaths.forEach((p) => {
        fs.readdir(p, (err, files) => {
          if (!err && files) {
            files.forEach((f) => thumbFiles.add(f));
          }
          pending--;
          if (pending === 0) {
            resolve(Array.from(thumbFiles));
          }
        });
      });
    });
    const kataThumbSet = new Set(kataThumbFiles);

    const mediaFileSet = new Set(mediaFiles);

    const techniques: Technique[] = records.map((t: any) => {
      const techName = t.titolo || '';
      const techGroup = t.tags?.split(',')[0] || '';
      const techCategory = t.categoria_secondaria || '';
      const techDescription = t.contenuto || '';
      const techVideo = t.video_link || '';
      const techDanLevel = t.livello || 1;

      // 1. Direct PocketBase file field
      let imageUrl = '';
      if (t.immagine_principale) {
        imageUrl = getPBFileUrl(t.collectionId, t.id, t.immagine_principale);
      }

      // 2. Slug & Title variations check
      const normSlug = (t.slug || '').toLowerCase().trim()
        .replace(/ō/g, 'o').replace(/ū/g, 'u').replace(/ā/g, 'a').replace(/ī/g, 'i').replace(/ē/g, 'e');
      const normTitle = techName.toLowerCase().trim()
        .replace(/ō/g, 'o').replace(/ū/g, 'u').replace(/ā/g, 'a').replace(/ī/g, 'i').replace(/ē/g, 'e');

      const cleanSlug = normSlug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      const cleanTitle = normTitle.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');

      const bases = [cleanSlug, cleanTitle].filter(Boolean);
      const variations: string[] = [];

      for (const b of bases) {
        variations.push(
          b,
          b.replace(/tsurikomi/g, 'tsuri-komi'),
          b.replace(/tsuri-komi/g, 'tsurikomi'),
          b.replace(/makikomi/g, 'maki-komi'),
          b.replace(/maki-komi/g, 'makikomi'),
          b.replace(/shiho/g, 'shio'),
          b.replace(/shio/g, 'shiho'),
          b.replace(/hishigi-/g, ''),
          b.replace(/hisiji/g, 'hishigi'),
          b.replace(/hishigi/g, 'hisiji'),
          b.replace(/kata-ha/g, 'katah-ha'),
          b.replace(/fumi-komi/g, 'fumi'),
          b.replace(/yoko-tomoe/g, 'tomoe'),
          b.replace(/kiri-komi/g, '').replace(/^-+|-+$/g, ''),
          b.replace(/ganmen-tsuki/g, '').replace(/^-+|-+$/g, ''),
          b.replace(/ago-tsuki/g, '').replace(/^-+|-+$/g, ''),
          b.replace(/mae-hiza-ate-keage/g, 'hiza-gatame'),
          b.replace(/ude-hishigi-ude-gatame/g, 'ude-gatame'),
          b.replace(/ude-hishigi-hiza-gatame/g, 'hiza-gatame'),
          b.replace(/ude-hishigi-waki-gatame/g, 'waki-gatame'),
          b.replace(/kakato-fumi-komi-geri/g, 'kakato-fumi'),
          b.replace(/^shintai$/g, 'shintai-ayumi-ashi'),
          b.replace(/^tsukidashi$/, 'tsuki-dashi'),
        );
      }

      const extensions = ['.webp', '.svg', '.jpg', '.jpeg', '.png', '.gif', ''];
      let foundImage = '';

      // Build lowerCaseMap for case-insensitive file matching (e.g. Ushiro-geri.webp)
      const mediaLowerMap = new Map<string, string>();
      mediaFileSet.forEach((file) => {
        mediaLowerMap.set(file.toLowerCase(), file);
      });

      search_loop: for (const variant of variations) {
        if (!variant) continue;
        for (const ext of extensions) {
          const fn = variant + ext;
          if (mediaLowerMap.has(fn.toLowerCase())) {
            foundImage = mediaLowerMap.get(fn.toLowerCase())!;
            break search_loop;
          }
          const fnUnderscore = variant.replace(/-/g, '_') + ext;
          if (mediaLowerMap.has(fnUnderscore.toLowerCase())) {
            foundImage = mediaLowerMap.get(fnUnderscore.toLowerCase())!;
            break search_loop;
          }
          const fnNoHyphen = variant.replace(/-/g, '') + ext;
          if (mediaLowerMap.has(fnNoHyphen.toLowerCase())) {
            foundImage = mediaLowerMap.get(fnNoHyphen.toLowerCase())!;
            break search_loop;
          }
        }
      }

      // 3. Audio URL
      const normalizedName = techName.toLowerCase()
        .replace(/[\s-]/g, '')
        .replace(/ō/g, 'o').replace(/ū/g, 'u').replace(/ā/g, 'a').replace(/ī/g, 'i').replace(/ē/g, 'e');

      const pbAudio = t.audio ? pb.files.getUrl(t, t.audio) : null;
      const fallbackAudio = `${normalizedName}.mp3`;

      // 4. Kata thumbs fallback — try matching with kata-prefixed filenames
      if (!foundImage && !imageUrl) {
        const kataPrefixes = ['katame-', 'goshin-', 'ju-no-kata-'];
        kata_search: for (const variant of variations) {
          if (!variant) continue;
          for (const prefix of kataPrefixes) {
            for (const ext of extensions) {
              const fn = prefix + variant + ext;
              if (kataThumbSet.has(fn)) {
                foundImage = 'kata_thumbs/' + fn;
                break kata_search;
              }
            }
          }
        }
      }

      // 5. Category Fallback if still no image found
      if (!foundImage && !imageUrl) {
        const catLower = (techCategory + ' ' + techGroup).toLowerCase();
        if (catLower.includes('goshin') || catLower.includes('atemi')) {
          foundImage = 'goshin-jutsu.webp';
        } else if (catLower.includes('katame') || catLower.includes('ne-waza')) {
          foundImage = 'katame.webp';
        } else if (catLower.includes('nage') || catLower.includes('tachi-waza')) {
          foundImage = 'nage.webp';
        } else {
          foundImage = 'kano_non_sa.webp';
        }
      }

      return {
        id: t.id,
        nome: techName,
        gruppo: techGroup,
        tipo: techCategory,
        descrizione: techDescription,
        video_youtube: techVideo,
        audio_file: pbAudio || fallbackAudio,
        has_audio: !!pbAudio || true,
        dan_level: techDanLevel,
        image: foundImage,
        image_url: imageUrl
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
  const viewMode = useSignal<'grid' | 'board'>('board');
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
    <div class="space-y-6 pb-20 pt-2 relative">
      {/* Search Bar & Settings Controls - Responsive 2 rows on mobile, 1 row on desktop */}
      <header class="max-w-4xl mx-auto px-4 mt-2 md:mt-4">
        <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
          {/* Row 1 (Mobile full width): Search input */}
          <div class="relative w-full flex-1 group">
            <input
              type="text"
              placeholder="Cerca una tecnica..."
              value={searchTerm.value}
              onInput$={(e) => {
                searchTerm.value = (e.target as HTMLInputElement).value;
                if (searchTerm.value) viewMode.value = 'grid';
              }}
              class="w-full pl-6 pr-14 py-3.5 md:py-4 rounded-2xl md:rounded-[2rem] border transition-all shadow-sm text-base md:text-lg outline-none font-bold"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
            <div class="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
              <span class="text-xl opacity-40 group-focus-within:opacity-100 transition-opacity">🔍</span>
            </div>
          </div>

          {/* Row 2 (Mobile): Controls (Board/Grid toggle + Filtri button) */}
          <div class="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* View Mode Toggle */}
            <div
              class="flex rounded-2xl md:rounded-[2rem] p-1 border shadow-sm"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <button
                onClick$={() => viewMode.value = 'board'}
                class={`px-4 py-2.5 rounded-xl md:rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                  viewMode.value === 'board' ? 'bg-[var(--color-action)] text-white shadow-md' : 'text-[var(--color-text-muted)]'
                }`}
              >
                Board
              </button>
              <button
                onClick$={() => viewMode.value = 'grid'}
                class={`px-4 py-2.5 rounded-xl md:rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                  viewMode.value === 'grid' ? 'bg-[var(--color-action)] text-white shadow-md' : 'text-[var(--color-text-muted)]'
                }`}
              >
                Grid
              </button>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick$={() => toggleSection('settings')}
              class={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl md:rounded-[2rem] transition-all duration-300 border h-11 pressable cursor-pointer ${
                openSections.settings
                  ? 'bg-[var(--color-action)] text-white border-transparent shadow-md'
                  : 'text-[var(--color-text)] border-[var(--color-border)]'
              }`}
              style={!openSections.settings ? { backgroundColor: 'var(--color-surface)' } : {}}
            >
              <span class={`text-lg transition-transform duration-300 ${openSections.settings ? 'rotate-90' : ''}`}>
                ⚙️
              </span>
              <span class="text-xs font-extrabold uppercase tracking-wider">
                Filtri
              </span>
              <span
                class={`px-2 py-0.5 rounded-full text-xs font-black transition-all ${
                  openSections.settings ? 'bg-white text-[var(--color-action)]' : 'bg-red-500/10 text-red-500'
                }`}
              >
                {filteredTechniques.value.length}
              </span>
            </button>
          </div>
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
                {['Dai Ikkyo', 'Dai Nikyo', 'Dai Sankyo', 'Dai Yonkyo', 'Dai Gokyo'].map(g => {
                  const isActive = activeFilters.group === g;
                  let colorClass = 'bg-red-600 border-red-600 text-white';
                  if (g.includes('Ikkyo')) colorClass = 'bg-yellow-400 border-yellow-400 text-gray-900 shadow-yellow-500/20';
                  if (g.includes('Nikyo')) colorClass = 'bg-orange-500 border-orange-500 text-white shadow-orange-500/20';
                  if (g.includes('Sankyo')) colorClass = 'bg-green-500 border-green-500 text-white shadow-green-500/20';
                  if (g.includes('Yonkyo')) colorClass = 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20';
                  if (g.includes('Gokyo')) colorClass = 'bg-black border-black text-white shadow-black/20';

                  return (
                    <button
                      key={g}
                      onClick$={() => handleFilterClick('group', g)}
                      class={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isActive
                        ? `${colorClass} shadow-lg scale-95`
                        : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-transparent hover:border-red-500/30'
                        }`}
                    >
                      {g}
                    </button>
                  );
                })}
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

      {/* Results Rendering System */}
      <div class="max-w-[1400px] mx-auto px-4">
        {viewMode.value === 'board' && !searchTerm.value ? (
          <div class="space-y-16">
            {['Dai Ikkyo', 'Dai Nikyo', 'Dai Sankyo', 'Dai Yonkyo', 'Dai Gokyo'].map((group) => (
              <div key={group} class="space-y-6">
                <div class="flex items-center gap-4">
                  <div class={`w-2 h-8 rounded-full ${group.includes('Ikkyo') ? 'bg-[#ffd700]' : group.includes('Nikyo') ? 'bg-[#ff8c00]' : group.includes('Sankyo') ? 'bg-[#4ade80]' : group.includes('Yonkyo') ? 'bg-[#3b82f6]' : 'bg-black'}`}></div>
                  <h3 class="text-2xl font-black uppercase tracking-widest text-gray-900 dark:text-white">{group}</h3>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {data.value.techniques
                    .filter(t => t.gruppo === group)
                    .map(tech => (
                      <TechniqueCard
                        key={tech.id}
                        technique={tech}
                        onOpenModal={openModal}
                        isTarget={tech.id === targetId.value}
                      />
                    ))}
                </div>
              </div>
            ))}

            {/* Ne-waza / Others */}
            {data.value.techniques.some(t => !t.gruppo.includes('Dai')) && (
              <div class="space-y-6">
                <div class="flex items-center gap-4">
                  <div class="w-2 h-8 rounded-full bg-gray-400"></div>
                  <h3 class="text-2xl font-black uppercase tracking-widest text-gray-900 dark:text-white">Altre Tecniche</h3>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {data.value.techniques
                    .filter(t => !t.gruppo.includes('Dai'))
                    .map(tech => (
                      <TechniqueCard
                        key={tech.id}
                        technique={tech}
                        onOpenModal={openModal}
                        isTarget={tech.id === targetId.value}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredTechniques.value.map(tech => (
              <TechniqueCard
                key={tech.id}
                technique={tech}
                onOpenModal={openModal}
                isTarget={tech.id === targetId.value}
              />
            ))}
          </div>
        )}
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
              class="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900/5 backdrop-blur-xl border border-slate-900/10 text-slate-900 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all pointer-events-auto shadow-xl active:scale-90"
            >
              <svg class="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick$={nextTechnique}
              class="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900/5 backdrop-blur-xl border border-slate-900/10 text-slate-900 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all pointer-events-auto shadow-xl active:scale-95"
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
                    src={modalTechnique.value.image_url || (modalTechnique.value.image?.startsWith('http') || modalTechnique.value.image?.startsWith('media/') || modalTechnique.value.image?.startsWith('/') ? (modalTechnique.value.image.startsWith('/') ? modalTechnique.value.image : '/' + modalTechnique.value.image) : `/media/${modalTechnique.value.image}`)}
                    alt={modalTechnique.value.nome}
                    class="relative z-10 max-w-full h-auto max-h-80 md:max-h-[70vh] object-contain transition-transform duration-700 hover:scale-105"
                    onError$={(e) => {
                      const target = e.target as HTMLImageElement;
                      const attempts = parseInt(target.dataset.modalAttempts || '0');
                      const name = modalTechnique.value?.nome.toLowerCase() || '';
                      const slug = name.replace(/ /g, '-').replace(/'/g, '');

                      if (attempts === 0) {
                        target.dataset.modalAttempts = '1';
                        target.src = `/media/${slug}.webp`;
                      } else if (attempts === 1) {
                        target.dataset.modalAttempts = '2';
                        target.src = `/media/${slug.replace('tsukidashi', 'tsuki-dashi')}.webp`;
                      } else if (attempts === 2) {
                        target.dataset.modalAttempts = '3';
                        target.src = `/media/kata_thumbs/ju-no-kata-${slug.replace('tsukidashi', 'tsuki-dashi')}.webp`;
                      } else if (attempts === 3) {
                        target.dataset.modalAttempts = '4';
                        target.src = `/media/kata_thumbs/goshin-${slug}.webp`;
                      } else if (attempts === 4) {
                        target.dataset.modalAttempts = '5';
                        if (target.src.indexOf('kano_non_sa.webp') === -1) {
                          target.src = '/media/kano_non_sa.webp';
                        }
                      } else {
                        target.onerror = null;
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
