import { component$, useSignal, useVisibleTask$, $, useComputed$, useContext } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, useLocation } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';

interface HistoryItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  image?: string;
}

interface TimelineItem {
  id: string;
  year: string;
  title: string;
  description: string;
}

export const useHistoryData = routeLoader$(async () => {
  try {
    console.log('[History] Fetching from collection "storia"...');

    const storiaRecords = await pb.collection('storia').getFullList({
      sort: 'anno,ordine',
      requestKey: null,
    });

    console.log('[History] Fetched', storiaRecords.length, 'records');

    // Split into articles (have contenuto) and timeline events
    const historyItems = storiaRecords
      .filter((r: any) => r.contenuto && r.contenuto.length > 100)
      .map((r: any) => ({
        id: r.id,
        title: r.titolo || '',
        subtitle: r.titolo_secondario || '',
        content: r.contenuto || '',
        image: r.immagine_principale || '',
      }));

    const timelineItems = storiaRecords
      .filter((r: any) => r.anno || r.descrizione_breve)
      .map((r: any) => ({
        id: r.id,
        year: String(r.anno || ''),
        title: r.titolo || '',
        description: r.descrizione_breve || r.contenuto?.substring(0, 200) || '',
      }));

    return {
      historyItems,
      timelineItems,
    };
  } catch (err) {
    console.error('[History] Error loading history:', err);
    return {
      historyItems: [],
      timelineItems: [],
      error: 'Impossibile caricare la storia. Riprova più tardi.',
    };
  }
});

// Timeline component with expand/collapse
interface TimelineSectionProps {
  items: TimelineItem[];
  targetId: string | null;
}

const TimelineSection = component$<TimelineSectionProps>(({ items, targetId }) => {
  const isExpanded = useSignal(false);

  const toggleExpanded = $(() => {
    isExpanded.value = !isExpanded.value;
  });

  return (
    <>
      {/* Show timeline only when expanded */}
      {isExpanded.value && (
        <div class="relative border-l-4 border-red-200 dark:border-red-900/50 ml-6 md:ml-12 space-y-10 pb-8 animate-in fade-in slide-in-from-top duration-500">
          {items.map((item, index) => (
            <div
              key={item.id}
              class="relative pl-8 md:pl-12 group animate-in fade-in slide-in-from-left duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Dot */}
              <div class="absolute -left-[11px] top-2 w-6 h-6 rounded-full bg-red-600 border-4 border-white dark:border-gray-900 group-hover:scale-125 transition-transform"></div>

              <div
                class={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all ${item.id === targetId ? 'animate-term-highlight' : ''
                  }`}
              >
                <span class="inline-block px-4 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold mb-3 shadow-md">
                  {item.year}
                </span>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expand/Collapse Button */}
      <div class="text-center mt-8">
        <button
          onClick$={toggleExpanded}
          class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <span>
            {isExpanded.value
              ? 'Nascondi cronologia'
              : `Mostra cronologia (${items.length} eventi)`}
          </span>
          <svg
            class={`w-5 h-5 transition-transform duration-300 ${isExpanded.value ? 'rotate-180' : ''
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </>
  );
});

export default component$(() => {
  const loc = useLocation();
  const data = useHistoryData();

  const selectedTab = useSignal<'storia' | 'valori'>('storia');
  const searchTerm = useSignal('');
  const targetId = useSignal<string | null>(null);
  const appState = useContext(AppContext);

  useVisibleTask$(() => {
    appState.sectionTitle = 'Storia del Judo';
    appState.sectionIcon = '🥋';
  });

  // Handle URL params for search and highlight
  useVisibleTask$(({ track }) => {
    track(() => loc.url.searchParams);

    const idParam = loc.url.searchParams.get('id');
    const searchParam = loc.url.searchParams.get('search');

    if (idParam) {
      targetId.value = idParam;
      if (idParam === 'h4') {
        selectedTab.value = 'valori';
      }
      setTimeout(() => {
        targetId.value = null;
      }, 3000);
    }

    if (searchParam) {
      searchTerm.value = searchParam;
    }
  });

  // Filter items based on search term
  const filteredHistory = useComputed$(() => {
    return data.value.historyItems.filter((item) => {
      const search = searchTerm.value.toLowerCase();
      return (
        item.title?.toLowerCase().includes(search) ||
        item.subtitle?.toLowerCase().includes(search) ||
        item.content?.toLowerCase().includes(search)
      );
    });
  });

  const valuesItem = useComputed$(() => {
    return filteredHistory.value.find((item) => item.id === 'h4');
  });

  const otherHistoryItems = useComputed$(() => {
    return filteredHistory.value.filter((item) => item.id !== 'h4');
  });

  const handleSearchChange = $((value: string) => {
    searchTerm.value = value;
  });

  const clearSearch = $(() => {
    searchTerm.value = '';
  });

  return (
    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Search Bar */}
      <div class="relative max-w-2xl mx-auto px-4">
        <input
          type="text"
          placeholder="Cerca nella storia, date o valori..."
          value={searchTerm.value}
          onInput$={(e) => handleSearchChange((e.target as HTMLInputElement).value)}
          class="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-red-500 outline-none transition-all text-lg shadow-sm"
        />
        <span class="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
        {searchTerm.value && (
          <button
            onClick$={clearSearch}
            class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div class="flex justify-center gap-2">
        <button
          onClick$={() => {
            selectedTab.value = 'storia';
          }}
          class={`px-6 py-3 rounded-full font-bold transition-all ${selectedTab.value === 'storia'
            ? 'bg-red-600 text-white shadow-lg'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          📖 Storia
        </button>
        <button
          onClick$={() => {
            selectedTab.value = 'valori';
          }}
          class={`px-6 py-3 rounded-full font-bold transition-all ${selectedTab.value === 'valori'
            ? 'bg-red-600 text-white shadow-lg'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
          🎯 Valori
        </button>
      </div>

      {/* Content based on selected tab */}
      {selectedTab.value === 'storia' ? (
        <>
          {/* History Articles */}
          <section class="space-y-8">
            <div class="grid gap-8">
              {otherHistoryItems.value.map((item, index) => (
                <article
                  key={item.id}
                  class={`surface-elevated rounded-3xl overflow-hidden hover:scale-[1.01] ${item.id === targetId.value ? 'animate-term-highlight' : ''
                    }`}
                >
                  {item.image && (
                    <div class="relative h-80 flex items-center justify-center border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                      <img
                        src={`/media/${item.image}`}
                        alt={item.title}
                        class="max-w-full max-h-full object-contain p-6 mix-blend-multiply dark:mix-blend-screen"
                        onError$={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div class="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md">
                        Capitolo {index + 1}
                      </div>
                    </div>
                  )}

                  <div class="p-8">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {item.title}
                    </h2>
                    {item.subtitle && (
                      <h3 class="text-lg text-red-600 dark:text-red-400 font-medium mb-6">
                        {item.subtitle}
                      </h3>
                    )}

                    <div
                      class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                      dangerouslySetInnerHTML={item.content}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Timeline */}
          {data.value.timelineItems.length > 0 && (
            <section class="mt-16">
              <div class="text-center mb-12">
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Cronologia Storica
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                  Le tappe fondamentali del Judo nel mondo
                </p>
              </div>

              <TimelineSection items={data.value.timelineItems} targetId={targetId.value} />
            </section>
          )}
        </>
      ) : (
        /* Values Section */
        valuesItem.value && (
          <article class="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {valuesItem.value.title}
            </h2>
            {valuesItem.value.subtitle && (
              <h3 class="text-lg text-red-600 dark:text-red-400 font-medium mb-6">
                {valuesItem.value.subtitle}
              </h3>
            )}

            <div
              class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
              dangerouslySetInnerHTML={valuesItem.value.content}
            />
          </article>
        )
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Storia del Judo - JudoOK',
  meta: [
    {
      name: 'description',
      content: 'La storia del Judo dalle origini ad oggi: fondatore Jigoro Kano, valori e cronologia storica.',
    },
  ],
};
