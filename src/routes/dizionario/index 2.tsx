import { component$, useSignal, useVisibleTask$, $, useComputed$, useContext, useStyles$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, useLocation } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';
import TermCard, { type Term } from '~/components/term-card';

export const useDictionaryData = routeLoader$(async () => {
  try {
    console.log('[Dictionary] Fetching from collection "dizionario"...');

    const records = await pb.collection('dizionario').getFullList({
      sort: 'titolo',
      requestKey: null,
    });

    console.log('[Dictionary] Fetched', records.length, 'records');

    const terms: Term[] = records.map((record: any) => {
      // Use new Italian field structure
      const termName = record.titolo || '';
      const termKanji = record.titolo_secondario || '';
      const termDesc = record.contenuto || '';
      const termPronunciation = record.categoria_secondaria || '';

      const normalizedName = termName.toLowerCase()
        .replace(/ /g, '')
        .replace(/-/g, '')
        .replace(/ō/g, 'o')
        .replace(/ū/g, 'u')
        .replace(/ā/g, 'a')
        .replace(/ī/g, 'i')
        .replace(/ē/g, 'e');

      const pbAudio = record.audio ? pb.files.getUrl(record, record.audio) : null;
      const fallbackAudio = `${normalizedName}.mp3`;

      return {
        id: record.id,
        termine: termName,
        pronuncia: termPronunciation,
        descrizione: termDesc,
        kanji: termKanji,
        audio_file: pbAudio || fallbackAudio,
        has_audio: !!pbAudio || true,
      };
    });

    // Extract available letters
    const letters = [...new Set(terms.map(t => t.termine.charAt(0).toUpperCase()))].sort();

    return {
      terms,
      availableLetters: letters,
    };
  } catch (err) {
    console.error('[Dictionary] Error loading dictionary:', err);
    return {
      terms: [],
      availableLetters: [] as string[],
      error: 'Impossibile caricare il dizionario. Riprova più tardi.',
    };
  }
});

export default component$(() => {
  useQuillStyles();
  const loc = useLocation();
  const data = useDictionaryData();

  const searchTerm = useSignal('');
  const activeLetter = useSignal<string | null>(null);
  const modalTerm = useSignal<Term | null>(null);
  const targetTermId = useSignal<string | null>(null);
  const appState = useContext(AppContext);

  useVisibleTask$(({ track }) => {
    track(() => modalTerm.value);
    if (modalTerm.value) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  useVisibleTask$(() => {
    appState.sectionTitle = 'Dizionario';
    appState.sectionIcon = '📚';
  });

  // Handle URL params for search and highlight
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => loc.url.searchParams);

    const searchParam = loc.url.searchParams.get('search');
    if (searchParam) {
      searchTerm.value = searchParam;
      activeLetter.value = null;

      // Look for exact match to highlight
      const exactMatch = data.value.terms.find(
        t => t.termine.toLowerCase() === searchParam.toLowerCase()
      );
      if (exactMatch) {
        targetTermId.value = exactMatch.id;
        setTimeout(() => { targetTermId.value = null; }, 3000);
      }
    }
  });

  // Filtered results based on search and letter filter
  const filteredResults = useComputed$(() => {
    let results = data.value.terms;

    if (searchTerm.value.trim()) {
      const normalizedSearch = searchTerm.value.toLowerCase();
      results = results.filter(term => {
        const originalTerm = term.termine.toLowerCase();
        const normalizedTerm = originalTerm.replace(/-/g, ' ');
        return originalTerm.includes(normalizedSearch) || normalizedTerm.includes(normalizedSearch);
      });
    } else if (activeLetter.value) {
      results = results.filter(term => {
        return term.termine.charAt(0).toUpperCase() === activeLetter.value;
      });
    }

    return results;
  });

  const handleSearchChange = $((value: string) => {
    searchTerm.value = value;
    activeLetter.value = null;
  });

  const clearSearch = $(() => {
    searchTerm.value = '';
    activeLetter.value = null;
  });

  const handleLetterClick = $((letter: string) => {
    searchTerm.value = '';
    activeLetter.value = letter === activeLetter.value ? null : letter;
  });

  const clearAllFilters = $(() => {
    searchTerm.value = '';
    activeLetter.value = null;
  });

  const openModal = $((term: Term) => {
    modalTerm.value = term;
  });

  const closeModal = $(() => {
    modalTerm.value = null;
  });

  // Keyboard shortcuts
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('.search-input') as HTMLInputElement;
        input?.focus();
      }

      // Escape to clear search or close modal
      if (e.key === 'Escape') {
        if (modalTerm.value) {
          closeModal();
        } else if (searchTerm.value) {
          clearSearch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  if (data.value.error) {
    return (
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <p class="text-red-600 dark:text-red-400 text-xl mb-4">{data.value.error}</p>
          <button
            onClick$={() => window.location.reload()}
            class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="max-w-7xl mx-auto px-4 py-8">

      {/* Search Section */}
      <div class="mb-6">
        <div class="relative">
          <input
            type="text"
            class="search-input w-full px-6 py-4 text-lg rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition-all"
            placeholder="Cerca un termine... (Cmd/Ctrl + K)"
            value={searchTerm.value}
            onInput$={(e) => handleSearchChange((e.target as HTMLInputElement).value)}
            autoComplete="off"
          />
          {searchTerm.value && (
            <button
              onClick$={clearSearch}
              class="absolute right-4 top-1/2 transform -translate-y-1/2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
              title="Cancella ricerca"
            >
              Pulisci
            </button>
          )}
        </div>
      </div>

      {/* Alphabet Filter */}
      <div class="mb-8">
        <div class="flex flex-wrap gap-2">
          {alphabet.map(letter => {
            const isAvailable = data.value.availableLetters.includes(letter);
            const isActive = activeLetter.value === letter;

            return (
              <button
                key={letter}
                onClick$={() => isAvailable && handleLetterClick(letter)}
                disabled={!isAvailable || !!searchTerm.value}
                class={`px-4 py-2 rounded-lg font-medium transition-all ${isActive
                  ? 'bg-red-600 text-white shadow-lg'
                  : isAvailable && !searchTerm.value
                    ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
              >
                {letter}
              </button>
            );
          })}
          <button
            onClick$={clearAllFilters}
            class="px-6 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Tutti
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div class="mb-4">
        {(searchTerm.value || activeLetter.value) && (
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm.value
              ? `Risultati per "${searchTerm.value}"`
              : `Termini che iniziano con "${activeLetter.value}"`
            }
          </h2>
        )}
        <p class="text-gray-600 dark:text-gray-400">
          {filteredResults.value.length} termin{filteredResults.value.length === 1 ? 'e' : 'i'} trovat{filteredResults.value.length === 1 ? 'o' : 'i'}
        </p>
      </div>

      {/* Results Grid */}
      {filteredResults.value.length > 0 ? (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.value.map((term) => (
            <TermCard
              key={term.id}
              term={term}
              onOpenModal={openModal}
              isTarget={term.id === targetTermId.value}
            />
          ))}
        </div>
      ) : (
        <div class="text-center py-16">
          <div class="text-6xl mb-4">📚</div>
          <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Nessun risultato trovato
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Prova a modificare i criteri di ricerca o seleziona una lettera diversa.
          </p>
        </div>
      )}

      {/* Modal - Fullscreen */}
      <div
        class={`fixed inset-0 z-[100] transition-all duration-500 ${modalTerm.value ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      >
        <div onClick$={closeModal} class="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" />

        <div
          class={`relative w-full h-full bg-white dark:bg-gray-900 overflow-hidden transition-all duration-500 transform ${modalTerm.value ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}
          onClick$={(e) => e.stopPropagation()}
        >
          {modalTerm.value && (
            <div class="flex flex-col h-full">
              {/* Floating Close Button */}
              <button
                onClick$={closeModal}
                class="absolute top-8 left-8 w-12 h-12 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-red-500/20 rounded-full text-red-600 flex items-center justify-center shadow-xl z-20 active:scale-90 transition-transform"
                title="Chiudi"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <div class="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-20 pt-24 md:pt-32">
                <div class="max-w-4xl mx-auto">
                  {/* Header */}
                  <div class="mb-12 text-center md:text-left">
                    <h2 class="text-4xl md:text-7xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter uppercase">
                      {modalTerm.value.termine}
                    </h2>
                    {modalTerm.value.kanji ? (
                      <p class="text-2xl md:text-4xl text-red-600 font-medium">
                        {modalTerm.value.kanji}
                      </p>
                    ) : (
                      <p class="text-xl italic text-gray-400">
                        {modalTerm.value.termine.toLowerCase().replace(/ /g, '-')}
                      </p>
                    )}
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Actions / Side */}
                    <div class="lg:col-span-1 space-y-6">
                      {modalTerm.value.has_audio && modalTerm.value.audio_file && (
                        <button
                          onClick$={() => {
                            const audioUrl = modalTerm.value!.audio_file!.startsWith('http')
                              ? modalTerm.value!.audio_file!
                              : `/media/audio/${modalTerm.value!.audio_file}`;
                            const audio = new Audio(audioUrl);
                            audio.volume = 1.0;
                            audio.play().catch(err => console.error('Audio error:', err));
                          }}
                          class="w-full py-6 bg-red-600 text-white rounded-3xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 flex flex-col items-center gap-2 group overflow-hidden relative"
                        >
                          <div class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                          <span class="text-2xl relative z-10">🔊</span>
                          <span class="text-xs font-black uppercase tracking-widest relative z-10">Ascolta pronuncia</span>
                        </button>
                      )}

                      <div class="p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2">Categoria</span>
                        <p class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                          {modalTerm.value.pronuncia || 'Termine Generale'}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <div class="lg:col-span-2">
                      {modalTerm.value.descrizione && (
                        <div class="ql-container ql-snow" style={{ border: 'none' }}>
                          <div
                            class="ql-editor !p-0 !text-inherit !text-lg md:!text-xl !leading-relaxed"
                            dangerouslySetInnerHTML={modalTerm.value.descrizione}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
    
    .ql-color-red { color: #ef4444 !important; }
    .ql-color-green { color: #22c55e !important; }
    .ql-color-blue { color: #3b82f6 !important; }
    .ql-color-orange { color: #f97316 !important; }
  `);
};


export const head: DocumentHead = {
  title: '辞書 Dizionario - JudoOK',
  meta: [
    {
      name: 'description',
      content: 'Dizionario completo dei termini giapponesi del Judo con pronuncia audio e descrizioni dettagliate',
    },
  ],
};
