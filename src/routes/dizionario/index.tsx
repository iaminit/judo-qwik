import { component$, useSignal, useVisibleTask$, $, useComputed$, useContext, useStyles$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, useLocation } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';
import TermCard, { type Term } from '~/components/term-card';

export const useDictionaryData = routeLoader$(async () => {
  try {
    console.log('[Dictionary] Fetching from PocketBase...');
    const records = await pb.collection('dictionary').getFullList({
      sort: 'term',
      requestKey: null,
    });
    console.log('[Dictionary] Fetched', records.length, 'records');

    const terms: Term[] = records.map((record: any) => {
      const normalizedName = record.term.toLowerCase()
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
        termine: record.term,
        pronuncia: record.pronunciation,
        descrizione: record.description,
        kanji: record.kanji,
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

      {/* Modal */}
      {modalTerm.value && (
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 md:p-4"
          onClick$={closeModal}
        >
          <div
            class="bg-white dark:bg-gray-800 md:rounded-2xl max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick$={(e) => e.stopPropagation()}
          >
            <div class="p-4 md:p-8">
              {/* Close button */}
              <button
                onClick$={closeModal}
                class="float-right p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Chiudi"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Header */}
              <div class="mb-6">
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {modalTerm.value.termine}
                </h2>
                {modalTerm.value.kanji ? (
                  <p class="text-xl text-gray-600 dark:text-gray-400">
                    {modalTerm.value.kanji}
                  </p>
                ) : (
                  <p class="text-xl italic text-gray-500 dark:text-gray-400">
                    {modalTerm.value.termine.toLowerCase().replace(/ /g, '-')}
                  </p>
                )}
              </div>

              {/* Audio button in modal */}
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
                  class="mb-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                  Ascolta pronuncia
                </button>
              )}

              {/* Content */}
              {modalTerm.value.descrizione && (
                <div class="ql-container ql-snow" style={{ border: 'none' }}>
                  <div
                    class="ql-editor !p-0 !text-inherit"
                    dangerouslySetInnerHTML={modalTerm.value.descrizione}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
      font-size: 1.125rem !important;
      line-height: 1.75 !important;
    }
    .ql-editor * { color: inherit; }
    .dark .ql-editor { color: #f3f4f6 !important; }
    .ql-container.ql-snow { border: none !important; font-family: inherit !important; }
    
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
