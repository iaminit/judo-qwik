import { component$, useContext, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, Link } from '@builder.io/qwik-city';
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

interface KataDetailData {
  kata: Kata | null;
  error?: string;
}

export const useKataDetail = routeLoader$<KataDetailData>(async ({ params }) => {
  const { slug } = params;

  try {
    console.log('[KataDetail] Fetching kata with slug:', slug);

    // Helper to generate slug from name
    const generateSlug = (name: string) => name?.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-');

    const records = await pb.collection('kata').getFullList({
      requestKey: null,
    });

    console.log('[KataDetail] Loaded', records.length, 'records from "kata"');

    const record = records.find((k: any) => {
      const kSlug = k.slug || generateSlug(k.titolo);
      return kSlug === slug;
    });

    if (!record) {
      console.log('[KataDetail] Kata not found for slug:', slug);
      return { kata: null };
    }

    const kata: Kata = {
      id: record.id,
      name: record.titolo || '',
      japanese_name: record.titolo_secondario || '',
      description: record.contenuto || '',
      level: record.livello ? `${record.livello}° Dan` : '',
      video_url: record.video_link || '',
    };

    console.log('[KataDetail] Found kata:', kata.name);

    return { kata };
  } catch (err) {
    console.error('[KataDetail] Error loading kata detail:', err);
    return {
      kata: null,
      error: 'Impossibile caricare il kata. Riprova più tardi.',
    };
  }
});

export default component$(() => {
  const data = useKataDetail();
  const appState = useContext(AppContext);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    if (data.value.kata) {
      appState.sectionTitle = data.value.kata.name;
      appState.sectionIcon = '🥋';
    }
  });

  if (!data.value.kata) {
    return (
      <div class="max-w-4xl mx-auto px-4 py-8 text-center py-16">
        <div class="text-6xl mb-4">🥋</div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Kata non trovato</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-8">Il kata non è stato trovato.</p>
        <Link
          href="/kata"
          class="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-bold"
        >
          ← Torna ai Kata
        </Link>
      </div>
    );
  }

  const kata = data.value.kata;

  return (
    <div class="max-w-5xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/kata"
        class="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium mb-8 transition-colors"
      >
        ← Torna ai Kata
      </Link>


      {/* Content Card */}
      <section class="mb-12">
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="p-8">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Descrizione</h3>

            {kata.description && (
              <div
                class="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 mb-6"
                dangerouslySetInnerHTML={kata.description}
              />
            )}

            {/* Video Button */}
            {kata.video_url && (
              <div class="mt-8">
                <a
                  href={kata.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold shadow-lg"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 15l5.19-3L10 9v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                  </svg>
                  Guarda Video
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Info Box */}
      <div class="bg-orange-50 dark:bg-orange-900/20 rounded-3xl p-8 border border-orange-200 dark:border-orange-800/30">
        <h3 class="text-xl font-bold text-orange-900 dark:text-orange-300 mb-3 flex items-center gap-2">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          Informazioni
        </h3>
        <div class="text-orange-800 dark:text-orange-200">
          <p>
            Il {kata.name} è una delle forme tradizionali del Judo che rappresenta i principi
            fondamentali dell'arte marziale.
          </p>
          {kata.level && (
            <p class="mt-2">
              <strong>Livello richiesto:</strong> {kata.level}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useKataDetail);
  const title = data.kata?.name || 'Kata';

  return {
    title: `${title} - JudoOK`,
    meta: [
      {
        name: 'description',
        content: `Dettagli del kata ${title}: spiegazioni e video.`,
      },
    ],
  };
};
