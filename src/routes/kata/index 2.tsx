import { component$, useSignal, useComputed$, $, useVisibleTask$, useContext } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, useLocation, Link } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';

interface Kata {
  id: string;
  name: string;
  japanese_name?: string;
  description?: string;
  level?: string;
  video_url?: string;
}

export const useKataData = routeLoader$(async () => {
  try {
    console.log('[Kata] Fetching from collection "kata"...');

    const records = await pb.collection('kata').getFullList({
      sort: 'ordine,titolo',
      requestKey: null,
    });

    const katas = records.map((k: any) => ({
      id: k.id,
      name: k.titolo || '',
      japanese_name: k.titolo_secondario || '',
      description: k.contenuto || '',
      level: k.livello ? `${k.livello}° Dan` : '',
      video_url: k.video_link || '',
    }));

    console.log('[Kata] Fetched', katas.length, 'katas');

    return {
      katas,
    };
  } catch (err) {
    console.error('[Kata] Error loading katas:', err);
    return {
      katas: [],
      error: 'Impossibile caricare i kata. Riprova più tardi.',
    };
  }
});

export default component$(() => {
  const loc = useLocation();
  const data = useKataData();

  const searchTerm = useSignal('');
  const appState = useContext(AppContext);

  useVisibleTask$(() => {
    appState.sectionTitle = 'Kata';
    appState.sectionIcon = '🥋';
  });

  // Handle URL params for search
  useVisibleTask$(({ track }) => {
    track(() => loc.url.searchParams);

    const searchParam = loc.url.searchParams.get('search');
    if (searchParam) {
      searchTerm.value = searchParam;
    }
  });

  // Filter katas based on search term
  const filteredKatas = useComputed$(() => {
    return data.value.katas.filter((item) => {
      const search = searchTerm.value.toLowerCase();
      return (
        item.name?.toLowerCase().includes(search) ||
        item.japanese_name?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      );
    });
  });

  const handleSearchChange = $((value: string) => {
    searchTerm.value = value;
  });

  const clearSearch = $(() => {
    searchTerm.value = '';
  });

  return (
    <div class="max-w-4xl mx-auto px-4 py-8">

      {/* Search Bar */}
      <div class="relative max-w-2xl mx-auto mb-10 px-4">
        <input
          type="text"
          placeholder="Cerca un Kata (es. Nage No Kata)..."
          value={searchTerm.value}
          onInput$={(e) => handleSearchChange((e.target as HTMLInputElement).value)}
          class="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-orange-500 outline-none transition-all text-lg shadow-sm"
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

      <div class="grid gap-6 md:grid-cols-2">
        {filteredKatas.value.length > 0 ? (
          filteredKatas.value.map((item) => {
            // Generate slug from name
            const slug = item.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            return (
              <Link
                key={item.id}
                href={`/kata/${slug}`}
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all group block"
              >
                <div class="p-6">
                  <div class="flex justify-between items-start mb-4">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {item.name}
                    </h2>
                    {item.level && (
                      <span class="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold uppercase">
                        {item.level}
                      </span>
                    )}
                  </div>

                  <h3 class="text-lg text-gray-500 dark:text-gray-400 mb-4 italic">
                    {item.japanese_name}
                  </h3>

                  {item.description && (
                    <div
                      class="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3"
                      dangerouslySetInnerHTML={item.description}
                    />
                  )}

                  <div class="flex items-center justify-between">
                    {item.video_url && (
                      <span
                        onClick$={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(item.video_url, '_blank');
                        }}
                        class="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors cursor-pointer"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M10 15l5.19-3L10 9v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                        </svg>
                        Video
                      </span>
                    )}
                    <span class="text-orange-600 dark:text-orange-400 font-medium group-hover:translate-x-1 transition-transform">
                      Scopri di più →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div class="col-span-full text-center py-12">
            <div class="text-6xl mb-4">🔍</div>
            <h3 class="text-xl font-bold text-gray-600 dark:text-gray-300">Nessun risultato</h3>
            <p class="text-gray-500 dark:text-gray-400">
              Non abbiamo trovato Kata che corrispondano a "{searchTerm.value}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: '形 Kata - JudoOK',
  meta: [
    {
      name: 'description',
      content: 'Le forme tradizionali del Judo: Nage no Kata, Katame no Kata e molto altro.',
    },
  ],
};
