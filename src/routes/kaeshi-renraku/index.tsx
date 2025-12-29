import {
  component$,
  useSignal,
  useStore,
  $,
  useVisibleTask$,
  useContext,
  useComputed$,
} from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, useLocation } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';

interface KaeshiRenrakuItem {
  id: string;
  name: string;
  type: 'kaeshi' | 'renraku';
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  from_technique?: string;
  to_technique?: string;
  description?: string;
  key_points?: string;
  video_url?: string;
}

interface FilterState {
  type: string | null;
  category: string | null;
  difficulty: string | null;
}

interface KaeshiRenrakuData {
  items: KaeshiRenrakuItem[];
  error?: string;
}

export const useKaeshiRenrakuData = routeLoader$<KaeshiRenrakuData>(async () => {
  try {
    console.log('[KaeshiRenraku] Fetching from PocketBase...');
    const records = await pb.collection('kaeshi_renraku').getFullList({
      sort: 'type,name',
      requestKey: null,
    });
    console.log('[KaeshiRenraku] Fetched', records.length, 'items');

    return {
      items: records as unknown as KaeshiRenrakuItem[],
    };
  } catch (err) {
    console.error('[KaeshiRenraku] Error loading items:', err);
    return {
      items: [],
      error: 'Impossibile caricare i dati. Riprova più tardi.',
    };
  }
});

export default component$(() => {
  const data = useKaeshiRenrakuData();
  const loc = useLocation();
  const appState = useContext(AppContext);

  const searchTerm = useSignal('');
  const targetId = useSignal<string | null>(null);
  const activeFilters = useStore<FilterState>({
    type: null,
    category: null,
    difficulty: null,
  });
  const modalState = useStore<{ isOpen: boolean; selectedItem: KaeshiRenrakuItem | null }>({
    isOpen: false,
    selectedItem: null,
  });

  useVisibleTask$(() => {
    appState.sectionTitle = 'Kaeshi & Renraku';
    appState.sectionIcon = '🔄';
  });

  // Handle URL params
  useVisibleTask$(({ track }) => {
    track(() => loc.url.searchParams);

    const idParam = loc.url.searchParams.get('id');
    if (idParam) {
      targetId.value = idParam;
      setTimeout(() => {
        targetId.value = null;
      }, 3000);
    }
  });

  const getYouTubeVideoId = (url?: string): string | undefined => {
    if (!url) return undefined;
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : undefined;
  };

  const handleFilterClick = $((type: keyof FilterState, value: string) => {
    if (activeFilters[type] === value) {
      activeFilters[type] = null;
    } else {
      activeFilters[type] = value;
    }
  });

  const resetFilters = $(() => {
    activeFilters.type = null;
    activeFilters.category = null;
    activeFilters.difficulty = null;
    searchTerm.value = '';
  });

  const openModal = $((item: KaeshiRenrakuItem) => {
    modalState.selectedItem = item;
    modalState.isOpen = true;
  });

  const closeModal = $(() => {
    modalState.isOpen = false;
    setTimeout(() => {
      modalState.selectedItem = null;
    }, 300);
  });

  // Get unique categories from data
  const categories = useComputed$(() => {
    const cats = new Set(data.value.items.filter((i) => i.category).map((i) => i.category!));
    return Array.from(cats);
  });

  // Filter items
  const filteredItems = useComputed$(() => {
    return data.value.items.filter((item) => {
      const matchesSearch =
        searchTerm.value === '' ||
        item.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        (item.from_technique &&
          item.from_technique.toLowerCase().includes(searchTerm.value.toLowerCase())) ||
        (item.to_technique &&
          item.to_technique.toLowerCase().includes(searchTerm.value.toLowerCase()));

      const matchesType = !activeFilters.type || item.type === activeFilters.type;
      const matchesCategory = !activeFilters.category || item.category === activeFilters.category;
      const matchesDifficulty =
        !activeFilters.difficulty || item.difficulty === activeFilters.difficulty;

      return matchesSearch && matchesType && matchesCategory && matchesDifficulty;
    });
  });

  const hasActiveFilters =
    activeFilters.type || activeFilters.category || activeFilters.difficulty || searchTerm.value;

  return (
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">Kaeshi & Renraku</h1>
        <p class="text-gray-600 dark:text-gray-400">Contrattacchi e Combinazioni</p>
      </div>

      {/* Search Bar */}
      <div class="relative max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Cerca contrattacco o combinazione..."
          value={searchTerm.value}
          onInput$={(e) => (searchTerm.value = (e.target as HTMLInputElement).value)}
          class="w-full pl-12 pr-12 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
        />
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
        {searchTerm.value && (
          <button
            onClick$={() => (searchTerm.value = '')}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filters */}
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span class="text-xl">⚡</span> Filtri
          </h2>
          {hasActiveFilters && (
            <button
              onClick$={resetFilters}
              class="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-full transition-colors"
            >
              Resetta tutto
            </button>
          )}
        </div>

        {/* Type Filter */}
        <div class="mb-4">
          <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Tipo
          </h3>
          <div class="flex gap-2 flex-wrap">
            <button
              onClick$={() => handleFilterClick('type', 'kaeshi')}
              class={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                activeFilters.type === 'kaeshi'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-md transform scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              🔄 Kaeshi (Contrattacchi)
            </button>
            <button
              onClick$={() => handleFilterClick('type', 'renraku')}
              class={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                activeFilters.type === 'renraku'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-md transform scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              🔗 Renraku (Combinazioni)
            </button>
          </div>
        </div>

        {/* Category Filter */}
        {categories.value.length > 0 && (
          <div class="mb-4">
            <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Categoria
            </h3>
            <div class="flex gap-2 flex-wrap">
              {categories.value.map((cat) => (
                <button
                  key={cat}
                  onClick$={() => handleFilterClick('category', cat)}
                  class={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    activeFilters.category === cat
                      ? 'bg-orange-600 text-white border-orange-600 shadow-md transform scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Filter */}
        <div>
          <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Difficoltà
          </h3>
          <div class="flex gap-2 flex-wrap">
            {['easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick$={() => handleFilterClick('difficulty', diff)}
                class={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  activeFilters.difficulty === diff
                    ? 'bg-orange-600 text-white border-orange-600 shadow-md transform scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {diff === 'easy' ? 'Facile' : diff === 'medium' ? 'Medio' : 'Difficile'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredItems.value.length > 0 ? (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.value.map((item) => (
            <div
              key={item.id}
              onClick$={() => openModal(item)}
              class={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all cursor-pointer group ${
                item.id === targetId.value ? 'animate-pulse border-orange-500' : ''
              }`}
            >
              <div class="flex items-start gap-3">
                <div class="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-2xl shrink-0">
                  {item.type === 'kaeshi' ? '🔄' : '🔗'}
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {item.name}
                  </h3>

                  {item.category && (
                    <span class="inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full mb-1">
                      {item.category}
                    </span>
                  )}

                  {item.from_technique && (
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Da: <span class="font-medium">{item.from_technique}</span>
                    </p>
                  )}

                  {item.to_technique && (
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      A: <span class="font-medium">{item.to_technique}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div class="text-center py-12">
          <div class="text-6xl mb-4">🥋</div>
          <h3 class="text-xl font-bold text-gray-600 dark:text-gray-300">
            Nessuna tecnica trovata
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mt-2">
            Prova a modificare i filtri o la ricerca.
          </p>
          <button
            onClick$={resetFilters}
            class="mt-6 px-6 py-2 bg-orange-600 text-white rounded-full font-medium hover:bg-orange-700 transition-colors"
          >
            Resetta filtri
          </button>
        </div>
      )}

      {/* Modal */}
      {modalState.isOpen && modalState.selectedItem && (
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 md:p-4"
          onClick$={closeModal}
        >
          <div
            class="bg-white dark:bg-gray-800 md:rounded-2xl max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick$={(e) => e.stopPropagation()}
          >
            <div class="p-4 md:p-8">
              {/* Close button */}
              <button
                onClick$={closeModal}
                class="float-right p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Chiudi"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Header */}
              <div class="mb-6">
                <div
                  class="inline-block px-3 py-1 rounded-full text-sm font-bold mb-3"
                  style={{
                    backgroundColor:
                      modalState.selectedItem.type === 'kaeshi'
                        ? 'rgba(234, 88, 12, 0.1)'
                        : 'rgba(59, 130, 246, 0.1)',
                    color:
                      modalState.selectedItem.type === 'kaeshi' ? '#ea580c' : '#3b82f6',
                  }}
                >
                  {modalState.selectedItem.type === 'kaeshi'
                    ? '🔄 Kaeshi (Contrattacco)'
                    : '🔗 Renraku (Combinazione)'}
                </div>

                <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {modalState.selectedItem.name}
                </h2>

                {modalState.selectedItem.category && (
                  <p class="text-lg text-gray-600 dark:text-gray-400">
                    {modalState.selectedItem.category}
                  </p>
                )}
              </div>

              {/* Techniques Flow */}
              {(modalState.selectedItem.from_technique ||
                modalState.selectedItem.to_technique) && (
                <div class="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <div class="flex items-center justify-center gap-4">
                    {modalState.selectedItem.from_technique && (
                      <div class="text-center">
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Da</div>
                        <div class="font-bold text-lg text-gray-900 dark:text-white">
                          {modalState.selectedItem.from_technique}
                        </div>
                      </div>
                    )}

                    {modalState.selectedItem.from_technique &&
                      modalState.selectedItem.to_technique && (
                        <div class="text-3xl text-orange-600">→</div>
                      )}

                    {modalState.selectedItem.to_technique && (
                      <div class="text-center">
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">A</div>
                        <div class="font-bold text-lg text-gray-900 dark:text-white">
                          {modalState.selectedItem.to_technique}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Difficulty Badge */}
              {modalState.selectedItem.difficulty && (
                <div class="mb-6">
                  <span
                    class={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                      modalState.selectedItem.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : modalState.selectedItem.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    Difficoltà:{' '}
                    {modalState.selectedItem.difficulty === 'easy'
                      ? 'Facile'
                      : modalState.selectedItem.difficulty === 'medium'
                        ? 'Media'
                        : 'Difficile'}
                  </span>
                </div>
              )}

              {/* YouTube Embed */}
              {modalState.selectedItem.video_url &&
                getYouTubeVideoId(modalState.selectedItem.video_url) && (
                  <div class="mb-6 aspect-video rounded-xl overflow-hidden bg-gray-900">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(modalState.selectedItem.video_url)}`}
                      title={modalState.selectedItem.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullscreen
                    ></iframe>
                  </div>
                )}

              {/* YouTube Link */}
              {modalState.selectedItem.video_url && (
                <div class="mb-6">
                  <a
                    href={modalState.selectedItem.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Guarda su YouTube
                  </a>
                </div>
              )}

              {/* Description */}
              {modalState.selectedItem.description && (
                <div
                  class="text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none mb-6"
                  dangerouslySetInnerHTML={modalState.selectedItem.description}
                />
              )}

              {/* Key Points */}
              {modalState.selectedItem.key_points && (
                <div class="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                  <h3 class="font-bold text-blue-900 dark:text-blue-300 mb-3">Punti Chiave</h3>
                  <div
                    class="text-blue-800 dark:text-blue-200 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={modalState.selectedItem.key_points}
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

export const head: DocumentHead = {
  title: 'Kaeshi & Renraku - JudoOK',
  meta: [
    {
      name: 'description',
      content:
        'Kaeshi (contrattacchi) e Renraku (combinazioni) del Judo: tecniche, video e spiegazioni dettagliate.',
    },
  ],
};
