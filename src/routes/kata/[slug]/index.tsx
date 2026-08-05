import { component$, useContext, useVisibleTask$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, Link, useLocation } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';
import { ImageZoomModal } from '~/components/image-zoom-modal/image-zoom-modal';

interface Kata {
  id: string;
  name: string;
  japanese_name?: string;
  description?: string;
  level?: string;
  video_url?: string;
  tecniche_singole?: { name: string; file: string }[];
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

    let parsedSingole = null;
    if (record.tecniche_singole) {
      try {
        parsedSingole = typeof record.tecniche_singole === 'string' ? JSON.parse(record.tecniche_singole) : record.tecniche_singole;
      } catch (e) {
        console.warn('[KataDetail] Failed to parse tecniche_singole JSON:', e);
      }
    }

    const kata: Kata = {
      id: record.id,
      name: record.titolo || '',
      japanese_name: record.titolo_secondario || '',
      description: record.contenuto || '',
      level: record.livello ? `${record.livello}° Dan` : '',
      video_url: record.video_link || '',
      tecniche_singole: parsedSingole,
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
  const loc = useLocation();
  const slug = loc.params.slug;

  const isZoomOpen = useSignal(false);
  const zoomSrc = useSignal('');
  const zoomAlt = useSignal('');

  useVisibleTask$(() => {
    if (data.value.kata) {
      appState.sectionTitle = data.value.kata.name;
      appState.sectionIcon = '🥋';
    }

    (window as any).openImageZoom = (src: string, alt: string) => {
      zoomSrc.value = src;
      zoomAlt.value = alt || 'Tecnica Kata';
      isZoomOpen.value = true;
    };
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
          <div class="p-6 sm:p-8">
            {/* Master Poster Image with Zoom Trigger */}
            {(() => {
              const posterMap: Record<string, string> = {
                'ju-no-kata': '/media/ju-no-kata.webp',
                'kodokan-goshin-jutsu': '/media/goshin-jutsu.webp',
                'katame-no-kata': '/media/katame.webp',
                'nage-no-kata': '/media/nage.webp',
              };
              const posterSrc = posterMap[kata.id] || posterMap[slug] || '/media/kata.webp';
              return (
                <div class="mb-8 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md bg-gray-900 group relative">
                  <img
                    src={posterSrc}
                    alt={`Tavola Illustrata ${kata.name}`}
                    class="w-full max-h-[450px] object-contain cursor-pointer group-hover:scale-105 transition-transform duration-500"
                    onClick$={() => {
                      zoomSrc.value = posterSrc;
                      zoomAlt.value = `Tavola Ufficiale ${kata.name}`;
                      isZoomOpen.value = true;
                    }}
                  />
                  <div
                    onClick$={() => {
                      zoomSrc.value = posterSrc;
                      zoomAlt.value = `Tavola Ufficiale ${kata.name}`;
                      isZoomOpen.value = true;
                    }}
                    class="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white font-extrabold text-xs backdrop-blur-sm border border-white/20 flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <span>🔍</span> Ingrandisci Tavola
                  </div>
                </div>
              );
            })()}

            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Descrizione e Tecniche</h3>

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
                  class="inline-flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold shadow-lg no-underline"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 15l5.19-3L10 9v6zm11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
                  </svg>
                  Guarda Video Ufficiale
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Individual Technique Thumbnails Grid */}
      {(() => {
        const kataThumbnailMap: Record<string, { name: string; file: string }[]> = {
          'katame-no-kata': [
            { name: 'Kesa Gatame', file: 'katame-kesa-gatame.webp' },
            { name: 'Kata Gatame', file: 'katame-kata-gatame.webp' },
            { name: 'Kami Shiho Gatame', file: 'katame-kami-shiho-gatame.webp' },
            { name: 'Yoko Shiho Gatame', file: 'katame-yoko-shiho-gatame.webp' },
            { name: 'Kuzure Kami Shiho Gatame', file: 'katame-kuzure-kami-shiho-gatame.webp' },
            { name: 'Kata Juji Jime', file: 'katame-kata-juji-jime.webp' },
            { name: 'Hadaka Jime', file: 'katame-hadaka-jime.webp' },
            { name: 'Okuri Eri Jime', file: 'katame-okuri-eri-jime.webp' },
            { name: 'Kata Ha Jime', file: 'katame-kata-ha-jime.webp' },
            { name: 'Gyaku Juji Jime', file: 'katame-gyaku-juji-jime.webp' },
            { name: 'Ude Garami', file: 'katame-ude-garami.webp' },
            { name: 'Ude Hishigi Juji Gatame', file: 'katame-ude-hishigi-juji-gatame.webp' },
            { name: 'Ude Hishigi Ude Gatame', file: 'katame-ude-hishigi-ude-gatame.webp' },
            { name: 'Ude Hishigi Hiza Gatame', file: 'katame-ude-hishigi-hiza-gatame.webp' },
            { name: 'Ashi Garami', file: 'katame-ashi-garami.webp' },
          ],
          'ju-no-kata': [
            { name: 'Tsuki Dashi', file: 'ju-no-kata-tsuki-dashi.webp' },
            { name: 'Kata Oshi', file: 'ju-no-kata-kata-oshi.webp' },
            { name: 'Ryote Dori', file: 'ju-no-kata-ryote-dori.webp' },
            { name: 'Kata Mawashi', file: 'ju-no-kata-kata-mawashi.webp' },
            { name: 'Ago Oshi', file: 'ju-no-kata-ago-oshi.webp' },
            { name: 'Kiri Oroshi', file: 'ju-no-kata-kiri-oroshi.webp' },
            { name: 'Ryokata Oshi', file: 'ju-no-kata-ryokata-oshi.webp' },
            { name: 'Naname Uchi', file: 'ju-no-kata-naname-uchi.webp' },
            { name: 'Katate Dori', file: 'ju-no-kata-katate-dori.webp' },
            { name: 'Katate Age', file: 'ju-no-kata-katate-age.webp' },
            { name: 'Obi Tori', file: 'ju-no-kata-obi-tori.webp' },
            { name: 'Mune Oshi', file: 'ju-no-kata-mune-oshi.webp' },
            { name: 'Tsuki Age', file: 'ju-no-kata-tsuki-age.webp' },
            { name: 'Uchi Oroshi', file: 'ju-no-kata-uchi-oroshi.webp' },
            { name: 'Ryogan Tsuki', file: 'ju-no-kata-ryogan-tsuki.webp' },
          ],
          'kodokan-goshin-jutsu': [
            { name: 'Ryote Dori', file: 'goshin-ryote-dori.webp' },
            { name: 'Hidari Eri Dori', file: 'goshin-hidari-eri-dori.webp' },
            { name: 'Migi Eri Dori', file: 'goshin-migi-eri-dori.webp' },
            { name: 'Kataude Dori', file: 'goshin-kataude-dori.webp' },
            { name: 'Ushiro Eri Dori', file: 'goshin-ushiro-eri-dori.webp' },
            { name: 'Ushiro Jime', file: 'goshin-ushiro-jime.webp' },
            { name: 'Kakae Dori', file: 'goshin-kakae-dori.webp' },
            { name: 'Naname Uchi', file: 'goshin-naname-uchi.webp' },
            { name: 'Ago Tsuki', file: 'goshin-ago-tsuki.webp' },
            { name: 'Gammen Tsuki', file: 'goshin-gammen-tsuki.webp' },
            { name: 'Mae Geri', file: 'goshin-mae-geri.webp' },
            { name: 'Yoko Geri', file: 'goshin-yoko-geri.webp' },
            { name: 'Daga Tsukkake', file: 'goshin-daga-tsukkake.webp' },
            { name: 'Daga Choku Tsuki', file: 'goshin-daga-choku-tsuki.webp' },
            { name: 'Daga Naname Tsuki', file: 'goshin-daga-naname-tsuki.webp' },
            { name: 'Bastone Furiage', file: 'goshin-bastone-furiage.webp' },
            { name: 'Bastone Furioroshi', file: 'goshin-bastone-furioroshi.webp' },
            { name: 'Bastone Morote Tsuki', file: 'goshin-bastone-morote-tsuki.webp' },
            { name: 'Pistola Shomen Zuke', file: 'goshin-pistola-shomen-zuke.webp' },
            { name: 'Pistola Koshi Gamae', file: 'goshin-pistola-koshi-gamae.webp' },
            { name: 'Pistola Haimen Zuke', file: 'goshin-pistola-haimen-zuke.webp' },
          ],
        };

        const thumbs = (kata.tecniche_singole && kata.tecniche_singole.length > 0)
          ? kata.tecniche_singole
          : (kataThumbnailMap[slug] || kataThumbnailMap[kata.id] || []);
        if (thumbs.length === 0) return null;

        const resolveThumbUrl = (filePath: string) => {
          if (!filePath) return '/media/kano_non_sa.webp';
          if (filePath.startsWith('http') || filePath.startsWith('/')) return filePath;
          return `/media/kata_thumbs/${filePath}`;
        };

        return (
          <section class="mb-12">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <span class="text-3xl">🎯</span> Tecniche Singole ({thumbs.length})
            </h3>
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {thumbs.map((t) => {
                const imgUrl = resolveThumbUrl(t.file);
                return (
                  <div
                    key={t.file + t.name}
                    class="group rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick$={() => {
                      zoomSrc.value = imgUrl;
                      zoomAlt.value = t.name;
                      isZoomOpen.value = true;
                    }}
                  >
                    <div class="aspect-square bg-white flex items-center justify-center p-1 overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={t.name}
                        class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        width={200}
                        height={200}
                      />
                    </div>
                    <div class="px-2 py-1.5 text-center bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700">
                      <p class="text-[10px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight truncate">
                        {t.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

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

      {/* Fullscreen Image Zoom Modal */}
      <ImageZoomModal isOpen={isZoomOpen} src={zoomSrc} alt={zoomAlt} />
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
