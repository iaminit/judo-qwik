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
      requestKey: null,
    });

    const katas = records.map((k: any) => ({
      id: k.id,
      name: k.titolo || '',
      japanese_name: k.titolo_secondario || '',
      description: k.contenuto || k.descrizione_breve || '',
      level: k.livello ? `${k.livello}° Dan` : '',
      video_url: k.video_link || '',
      slug: k.slug || k.titolo?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '',
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
  const clientKatas = useSignal<Kata[]>(data.value.katas || []);

  useVisibleTask$(async () => {
    appState.sectionTitle = 'Kata';
    appState.sectionIcon = '🥋';

    if (clientKatas.value.length === 0) {
      try {
        console.log('[Kata Client] Refetching katas on client...');
        const records = await pb.collection('kata').getFullList({ requestKey: null });
        clientKatas.value = records.map((k: any) => ({
          id: k.id,
          name: k.titolo || '',
          japanese_name: k.titolo_secondario || '',
          description: k.contenuto || k.descrizione_breve || '',
          level: k.livello ? `${k.livello}° Dan` : '',
          video_url: k.video_link || '',
          slug: k.slug || k.titolo?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '',
        }));
      } catch (err) {
        console.error('[Kata Client] Refetch failed:', err);
      }
    }
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
    const list = clientKatas.value.length > 0 ? clientKatas.value : data.value.katas;
    return list.filter((item) => {
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
    <div class="max-w-4xl mx-auto px-4 pt-3 md:pt-5 pb-8">

      {/* Search Bar */}
      <div class="max-w-4xl mx-auto mb-8 px-2">
        <div class="relative w-full group">
          <input
            type="text"
            placeholder="Cerca un Kata (es. Nage no Kata, Katame no Kata)..."
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

      <div class="grid gap-6 md:grid-cols-2">
        {filteredKatas.value.length > 0 ? (
          filteredKatas.value.map((item) => {
            const slug = item.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            return (
              <Link
                key={item.id}
                href={`/kata/${slug}`}
                class="rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 pressable group block no-underline"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div class="p-6">
                  <div class="flex justify-between items-start mb-3">
                    <h2
                      class="text-xl md:text-2xl font-bold tracking-tight transition-colors group-hover:text-[var(--color-action)]"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {item.name}
                    </h2>
                    {item.level && (
                      <span
                        class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ml-2"
                        style={{
                          backgroundColor: 'rgba(180, 35, 45, 0.1)',
                          color: 'var(--color-action)',
                        }}
                      >
                        {item.level}
                      </span>
                    )}
                  </div>

                  <h3 class="text-sm md:text-base font-medium mb-3 italic" style={{ color: 'var(--color-text-muted)' }}>
                    {item.japanese_name}
                  </h3>

                  {item.description && (
                    <div
                      class="text-sm mb-5 line-clamp-3 leading-relaxed"
                      style={{ color: 'var(--color-text-muted)' }}
                      dangerouslySetInnerHTML={item.description}
                    />
                  )}

                  <div class="flex items-center justify-between pt-2">
                    {item.video_url && (
                      <span
                        onClick$={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(item.video_url, '_blank');
                        }}
                        class="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer"
                        style={{ color: 'var(--color-action)' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M10 15l5.19-3L10 9v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                        </svg>
                        Video
                      </span>
                    )}
                    <span
                      class="text-sm font-bold group-hover:translate-x-1 transition-transform ml-auto"
                      style={{ color: 'var(--color-action)' }}
                    >
                      Scopri di più →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div class="col-span-full text-center py-12">
            <div class="text-5xl mb-3">🔍</div>
            <h3 class="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Nessun risultato</h3>
            <p class="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
