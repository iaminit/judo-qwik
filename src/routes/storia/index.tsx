import { component$, useSignal, useVisibleTask$, $, useComputed$, useContext } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, useLocation } from '@builder.io/qwik-city';
import { getPBFileUrl, pb } from '~/lib/pocketbase';
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
  image?: string;
}

const hasHistoryTag = (record: Record<string, any>, expectedTag: string) => {
  const tags = Array.isArray(record.tags)
    ? record.tags
    : String(record.tags || '').split(',');

  return tags.some((tag) => String(tag).trim().toLowerCase() === expectedTag);
};

const toPlainText = (content: string) =>
  content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

const getRecordImageUrl = (record: Record<string, any>) => {
  const image = String(record.immagine_principale || '');
  if (!image) return '';
  if (image.startsWith('http')) return image;
  if (image.startsWith('/media/')) return image;
  if (image.startsWith('media/')) return `/${image}`;
  return getPBFileUrl(record.collectionId, record.id, image);
};

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
      .filter((r: any) =>
        !hasHistoryTag(r, 'timeline') &&
        r.contenuto &&
        r.contenuto.length > 100
      )
      .map((r: any) => ({
        id: r.id,
        title: r.titolo || '',
        subtitle: r.titolo_secondario || '',
        content: r.contenuto || '',
        image: getRecordImageUrl(r),
      }));

    const timelineItems = storiaRecords
      .filter((r: any) => hasHistoryTag(r, 'timeline'))
      .map((r: any) => ({
        id: r.id,
        year: String(r.anno || ''),
        title: r.titolo || '',
        description: r.descrizione_breve || toPlainText(r.contenuto || ''),
        image: getRecordImageUrl(r),
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
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    class="w-full max-h-72 object-cover rounded-xl mb-4 border border-gray-100 dark:border-gray-700"
                    onError$={(event) => {
                      (event.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
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

  const historyItems = useComputed$(() => {
    return filteredHistory.value;
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
      <div class="max-w-4xl mx-auto mb-8 px-2">
        <div class="relative w-full group">
          <input
            type="text"
            placeholder="Cerca nella storia (es. Jigoro Kano, 1882, Kodokan)..."
            value={searchTerm.value}
            onInput$={(e) => handleSearchChange((e.target as HTMLInputElement).value)}
            class="w-full pl-6 pr-14 py-3.5 md:py-4 rounded-2xl md:rounded-[2rem] border transition-all shadow-sm text-base md:text-lg outline-none font-bold"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
          <div class="absolute inset-y-0 right-0 pr-5 flex items-center gap-2">
            {searchTerm.value && (
              <button
                onClick$={clearSearch}
                class="px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text-muted)',
                }}
                title="Cancella ricerca"
              >
                ✕
              </button>
            )}
            <span class="text-xl opacity-40 group-focus-within:opacity-100 transition-opacity pointer-events-none">🔍</span>
          </div>
        </div>
      </div>



      {/* Timeline */}
      {data.value.timelineItems.length > 0 && (
        <section class="mt-8 mb-16 px-4">
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

      {/* History Articles */}
      <section class="space-y-8">
        <div class="grid gap-8">
          {historyItems.value.map((item, index) => (
            <article
              key={item.id}
              class={`surface-elevated rounded-3xl overflow-hidden hover:scale-[1.01] ${item.id === targetId.value ? 'animate-term-highlight' : ''
                }`}
            >
              {item.image && (
                <div class="relative h-80 flex items-center justify-center border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                  <img
                    src={item.image}
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
