import { component$, useSignal, useStore, useVisibleTask$, $, type QRL } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';

interface SearchModalProps {
  isOpen: boolean;
  onClose: QRL<() => void>;
}

interface SearchResult {
  id: string;
  _collection: string;
  _collectionLabel: string;
  _collectionIcon: string;
  _collectionColor: string;
  [key: string]: any;
}

interface Collection {
  name: string;
  label: string;
  icon: string;
  color: string;
  fields: string[];
}

const collections: Collection[] = [
  { name: 'dizionario', label: 'Dizionario', icon: '📖', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', fields: ['titolo', 'contenuto'] },
  { name: 'tecniche', label: 'Tecniche', icon: '🥋', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', fields: ['titolo', 'contenuto', 'categoria_secondaria'] },
  { name: 'domande_quiz', label: 'Quiz', icon: '❓', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', fields: ['domanda', 'spiegazione'] },
  { name: 'kata', label: 'Kata', icon: '形', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', fields: ['titolo', 'contenuto', 'titolo_secondario'] },
  { name: 'storia', label: 'Storia', icon: '📜', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', fields: ['titolo', 'contenuto'] },
  { name: 'fijlkam', label: 'FIJLKAM', icon: '🇮🇹', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', fields: ['titolo', 'contenuto'] },
  { name: 'bacheca', label: 'Bacheca', icon: '📌', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', fields: ['titolo', 'contenuto'] },
  { name: 'galleria', label: 'Galleria', icon: '📸', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300', fields: ['titolo', 'contenuto'] },
];

const generateVariations = (term: string): string[] => {
  const t = term.toLowerCase().trim();
  const variations = new Set([t]);

  const stripped = t.replace(/[\s-]/g, '');
  if (stripped !== t && stripped.length > 1) {
    variations.add(stripped);
  }

  const prefixes = ['o', 'ko', 'ju', 'uki'];
  prefixes.forEach(prefix => {
    if (stripped.startsWith(prefix) && stripped.length > prefix.length) {
      const suffix = stripped.slice(prefix.length);
      if (suffix.length > 2) {
        variations.add(`${prefix} ${suffix}`);
        variations.add(`${prefix}-${suffix}`);
      }
    }
  });

  const suffixes = ['guruma', 'goshi', 'gari', 'nage', 'otoshi', 'gatame', 'waza', 'no'];
  suffixes.forEach(suffix => {
    if (stripped.endsWith(suffix) && stripped !== suffix) {
      const prefix = stripped.slice(0, -suffix.length);
      if (prefix.length > 1) {
        variations.add(`${prefix} ${suffix}`);
        variations.add(`${prefix}-${suffix}`);
      }
    }
  });

  return Array.from(variations);
};

export default component$<SearchModalProps>(({ isOpen, onClose }) => {
  const nav = useNavigate();
  const searchQuery = useSignal('');
  const results = useSignal<SearchResult[]>([]);
  const loading = useSignal(false);
  const expandedId = useSignal<string | null>(null);
  const selectedFilter = useSignal('all');
  const searchTimerRef = useSignal<number | null>(null);
  const inputRef = useSignal<HTMLInputElement>();

  // Debounced search
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => searchQuery.value);

    if (searchTimerRef.value) {
      clearTimeout(searchTimerRef.value);
    }

    if (searchQuery.value.length < 2) {
      results.value = [];
      return;
    }

    searchTimerRef.value = window.setTimeout(async () => {
      const cacheKey = `search_cache_${searchQuery.value.trim().toLowerCase()}`;

      // Check Cache
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          results.value = JSON.parse(cached);
          loading.value = false;
          return;
        }
      } catch (e) { /* ignore */ }

      loading.value = true;
      const allResults: SearchResult[] = [];
      const searchTerms = generateVariations(searchQuery.value);

      try {
        const searchPromises = collections.map(async (collection) => {
          try {
            const fieldFilters = collection.fields.map(field => {
              const termFilters = searchTerms.map(term => `${field} ~ "${term}"`).join(' || ');
              return `(${termFilters})`;
            }).join(' || ');

            const records = await pb.collection(collection.name).getList(1, 10, {
              filter: fieldFilters,
              requestKey: `search-${collection.name}`,
            });

            return records.items.map(record => ({
              ...record,
              _collection: collection.name,
              _collectionLabel: collection.label,
              _collectionIcon: collection.icon,
              _collectionColor: collection.color,
            }));
          } catch (err: any) {
            if (err.isAbort) return [];
            console.error(`Error searching in ${collection.name}:`, err);
            return [];
          }
        });

        const resultsArrays = await Promise.all(searchPromises);
        resultsArrays.forEach(arr => allResults.push(...arr));

        results.value = allResults;

        // Save to Cache (limit size? for now simple set)
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(allResults));
        } catch (e) { /* quota exceeded? clear? */ }

      } catch (err: any) {
        console.error('Search error:', err);
        // Debug for APK: Show error to user
        if (typeof window !== 'undefined') {
          window.alert('Search Error: ' + (err.message || String(err)));
        }
      } finally {
        loading.value = false;
      }
    }, 300);
  });

  // Reset when modal closes and focus when opens
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => isOpen);

    if (!isOpen) {
      searchQuery.value = '';
      results.value = [];
      expandedId.value = null;
      selectedFilter.value = 'all';
    } else {
      // Force focus on mount/open
      setTimeout(() => {
        inputRef.value?.focus();
      }, 100);
    }
  });

  // ESC key handler
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => isOpen);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  });

  const toggleExpand = $((id: string) => {
    expandedId.value = expandedId.value === id ? null : id;
  });

  const getResultTitle = $((result: SearchResult) => {
    if (result.domanda) return result.domanda.substring(0, 60) + '...';
    if (result.titolo) return result.titolo;
    return 'Risultato';
  });

  const handleNavigate = $((result: SearchResult) => {
    const routes: Record<string, string> = {
      dizionario: `/dizionario?search=${encodeURIComponent(result.titolo || '')}&id=${result.id}`,
      tecniche: `/tecniche?search=${encodeURIComponent(result.titolo || '')}&id=${result.id}`,
      domande_quiz: '/quiz',
      storia: `/storia?search=${encodeURIComponent(result.titolo || '')}&id=${result.id}`,
      kata: `/kata?search=${encodeURIComponent(result.titolo || '')}&id=${result.id}`,
      fijlkam: `/fijlkam?id=${result.id}`,
      bacheca: `/bacheca?search=${encodeURIComponent(result.titolo || '')}&id=${result.id}`,
      galleria: `/gallery?search=${encodeURIComponent(result.titolo || '')}&id=${result.id}`,
    };
    const route = routes[result._collection] || '/';
    onClose();
    nav(route);
  });

  const filteredResults = selectedFilter.value === 'all'
    ? results.value
    : results.value.filter(result => result._collection === selectedFilter.value);

  if (!isOpen) return null;

  return (
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8 transition-all duration-500"
      onClick$={onClose}
    >
      <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500" />

      <div
        class="relative w-full max-w-4xl h-full md:h-auto max-h-screen md:max-h-[90vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl md:rounded-[2.5rem] shadow-2xl border-x-0 md:border border-white/10 flex flex-col overflow-hidden animate-in fade-in md:zoom-in md:slide-in-from-bottom-12 duration-500"
        onClick$={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div class="p-8 md:p-10 shrink-0 relative bg-gradient-to-b from-red-500/5 to-transparent">
          <div class="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
            <div class="hidden md:flex w-14 h-14 bg-red-600 rounded-2xl items-center justify-center text-3xl shadow-lg shadow-red-500/30">
              🔍
            </div>
            <div class="flex-1">
              <h2 class="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                Ricerca <span class="text-red-600 md:inline">Globale</span>
              </h2>
              <p class="hidden md:block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mt-2">
                Esplora l'ecosistema JudoOK
              </p>
            </div>
            <button
              onClick$={onClose}
              class="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-red-500/10 dark:hover:bg-red-500/10 rounded-full text-gray-400 hover:text-red-500 transition-all active:scale-90"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Input Container */}
          <div class="relative group">
            <input
              ref={inputRef}
              type="text"
              placeholder="Cerca termini, tecniche, storie..."
              value={searchQuery.value}
              onInput$={(e) => searchQuery.value = (e.target as HTMLInputElement).value}
              class="w-full pl-8 pr-16 py-5 rounded-[1.5rem] bg-gray-50/50 dark:bg-white/5 border-2 border-transparent focus:border-red-500/50 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-xl font-medium text-gray-900 dark:text-white placeholder-gray-400 shadow-inner"
              autoFocus
            />
            <div class="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
              {loading.value && (
                <div class="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
              )}
              <span class="text-2xl opacity-30 group-focus-within:opacity-100 transition-opacity">✨</span>
            </div>
          </div>

          {/* Filter Buttons System */}
          {searchQuery.value.length >= 2 && results.value.length > 0 && (
            <div class="mt-8 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-4 duration-500 delay-150">
              <button
                onClick$={() => selectedFilter.value = 'all'}
                class={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedFilter.value === 'all'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
              >
                🌐 Tutti ({results.value.length})
              </button>
              {collections
                .filter(col => results.value.some(r => r._collection === col.name))
                .map(collection => {
                  const count = results.value.filter(r => r._collection === collection.name).length;
                  const isActive = selectedFilter.value === collection.name;
                  return (
                    <button
                      key={collection.name}
                      onClick$={() => selectedFilter.value = collection.name}
                      class={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                    >
                      <span>{collection.icon}</span>
                      <span>{collection.label}</span>
                      <span class="opacity-50">({count})</span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Dynamic Results Area */}
        <div class="flex-1 overflow-y-auto p-8 md:p-10 space-y-6 min-h-[300px]">
          {searchQuery.value.length < 2 && (
            <div class="h-full flex flex-col items-center justify-center opacity-40 py-20">
              <div class="text-[120px] mb-8 animate-float">🔎</div>
              <h3 class="text-xl font-black uppercase tracking-[0.4em] text-gray-900 dark:text-white">Inizia a Digitare</h3>
              <p class="text-sm font-medium text-gray-500 mt-4 max-w-xs text-center leading-relaxed">
                Esplora il database completo di JudoOK in tempo reale
              </p>
            </div>
          )}

          {searchQuery.value.length >= 2 && filteredResults.length === 0 && !loading.value && (
            <div class="text-center py-12 max-w-md mx-auto">
              <div
                class="mb-10 cursor-pointer group relative inline-block"
                onClick$={() => {
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery.value + ' judo')}`, '_blank');
                }}
              >
                <div class="relative w-56 h-auto transition-all duration-700 group-hover:scale-110">
                  <img
                    src="/media/kano_non_sa.webp"
                    alt="Empty State"
                    class="w-full h-auto drop-shadow-2xl rounded-[2rem] grayscale contrast-125 opacity-40 group-hover:opacity-0 transition-opacity duration-500"
                  />
                  <img
                    src="/media/kano_via.webp"
                    alt="Google Search"
                    class="absolute inset-0 w-full h-auto drop-shadow-2xl rounded-[2rem] opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500"
                  />
                  <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 w-full opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <span class="px-5 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl shadow-red-500/40">
                      Cerca su Google ✨
                    </span>
                  </div>
                </div>
              </div>
              <p class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Nessun match locale</p>
              <p class="text-sm text-gray-500 dark:text-ice-gray mt-4 leading-relaxed font-medium">
                Non abbiamo trovato corrispondenze per "{searchQuery.value}" all'interno del portale.
              </p>
            </div>
          )}

          <div class="grid grid-cols-1 gap-4">
            {filteredResults.map((result) => (
              <div
                key={`${result._collection}-${result.id}`}
                class="surface-elevated group"
              >
                <div
                  onClick$={() => handleNavigate(result)}
                  class="p-6 cursor-pointer overflow-hidden relative"
                >
                  <div class="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

                  <div class="flex items-start justify-between gap-4 relative z-10">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-4">
                        <span class="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/10 flex items-center gap-2">
                          <span>{result._collectionIcon} {result._collectionLabel}</span>
                          {result._collection === 'tecniche' && (
                            <span class="flex items-center gap-1 opacity-60">
                              {(result.audio || result.audio_file) && <span>🔊</span>}
                              {(result.video_link || result.video_youtube) && <span>🎥</span>}
                            </span>
                          )}
                        </span>
                        {result.kanji && (
                          <span class="text-red-500/40 font-serif text-lg leading-none">
                            {result.kanji}
                          </span>
                        )}
                      </div>
                      <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight group-hover:text-red-600 transition-colors">
                        {getResultTitle(result)}
                      </h3>
                      {result.contenuto && (
                        <div
                          class="mt-4 text-sm text-gray-500 dark:text-ice-gray line-clamp-2 leading-relaxed"
                          dangerouslySetInnerHTML={result.contenuto.replace(/<[^>]*>?/gm, ' ')}
                        />
                      )}
                    </div>

                    <div class="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Footer */}
        <div class="hidden md:block p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 shrink-0">
          <div class="max-w-4xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-8">
              <div class="flex items-center gap-2">
                <kbd class="bg-gray-200 dark:bg-white/10 px-2 py-1 rounded-md text-[9px] font-black">ESC</kbd>
                <span class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Chiudi</span>
              </div>
              <div class="flex items-center gap-2">
                <kbd class="bg-gray-200 dark:bg-white/10 px-2 py-1 rounded-md text-[9px] font-black">ENTER</kbd>
                <span class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Seleziona</span>
              </div>
            </div>
            <div class="text-[10px] font-black uppercase tracking-[0.3em] text-red-600/50">
              Judook Intelligence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
