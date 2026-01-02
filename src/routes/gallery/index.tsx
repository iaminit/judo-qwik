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

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  type: 'photo' | 'video';
  image?: string;
  video_url?: string;
  link?: string;
  date?: string;
  collectionId?: string;
}

interface GalleryData {
  items: GalleryItem[];
  error?: string;
}

export const useGalleryData = routeLoader$<GalleryData>(async () => {
  try {
    console.log('[Gallery] Fetching from PocketBase (unified)...');
    const records = await pb.collection('galleria').getFullList({
      sort: '-data_riferimento,-created',
      requestKey: null,
    });
    console.log('[Gallery] Fetched', records.length, 'items');

    const items = records.map((r: any) => ({
      id: r.id,
      title: r.titolo,
      description: r.descrizione_breve || r.contenuto,
      type: (r.tags?.includes('video') || (r.video_link && !r.immagine_principale)) ? 'video' : 'photo',
      image: r.immagine_principale,
      video_url: r.video_link,
      link: r.link_esterno,
      date: r.data_riferimento,
      collectionId: r.collectionId
    }));

    return {
      items: items as GalleryItem[],
    };
  } catch (err) {
    console.error('[Gallery] Error loading gallery:', err);
    return {
      items: [],
      error: 'Impossibile caricare la galleria. Riprova più tardi.',
    };
  }
});

export default component$(() => {
  const data = useGalleryData();
  const loc = useLocation();
  const appState = useContext(AppContext);

  const searchTerm = useSignal('');
  const targetId = useSignal<string | null>(null);
  const modalState = useStore<{ isOpen: boolean; selectedItem: GalleryItem | null }>({
    isOpen: false,
    selectedItem: null,
  });

  useVisibleTask$(() => {
    appState.sectionTitle = 'Galleria';
    appState.sectionIcon = '🖼️';
  });

  // Handle URL params
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

  const getYouTubeVideoId = (url?: string): string | undefined => {
    if (!url) return undefined;
    const match = url.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    );
    return match ? match[1] : undefined;
  };

  const getImageUrl = (item: GalleryItem): string | undefined => {
    if (!item || !item.image) return undefined;

    // If it's a full URL, return it
    if (item.image.startsWith('http')) return item.image;

    // If it's an item from PocketBase (has collectionId and id)
    if (item.collectionId && item.id) {
      return `http://127.0.0.1:8090/api/files/${item.collectionId}/${item.id}/${item.image}`;
    }

    // Fallback
    return item.image.startsWith('/') ? item.image : `/media/${item.image}`;
  };

  const openModal = $((item: GalleryItem) => {
    modalState.selectedItem = item;
    modalState.isOpen = true;
  });

  const closeModal = $(() => {
    modalState.isOpen = false;
    setTimeout(() => {
      modalState.selectedItem = null;
    }, 300);
  });

  const clearSearch = $(() => {
    searchTerm.value = '';
  });

  // Filter items based on search term
  const filteredItems = useComputed$(() => {
    return data.value.items.filter(
      (item) =>
        item.title?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
  });

  return (
    <div class="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">Galleria</h1>
        <p class="text-gray-600 dark:text-gray-400">Momenti e ricordi dal tatami</p>
      </div>

      {/* Search Bar */}
      <div class="relative max-w-2xl mx-auto mb-10 px-4">
        <input
          type="text"
          placeholder="Cerca foto o video..."
          value={searchTerm.value}
          onInput$={(e) => (searchTerm.value = (e.target as HTMLInputElement).value)}
          class="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
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

      {/* Gallery Grid */}
      {filteredItems.value.length > 0 ? (
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.value.map((item) => (
            <div
              key={item.id}
              class={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full ${item.id === targetId.value ? 'animate-pulse border-pink-500' : ''
                }`}
            >
              {/* Media Preview */}
              <div class="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {item.type === 'photo' && item.image ? (
                  <img
                    src={getImageUrl(item)}
                    alt={item.title}
                    class="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : item.type === 'video' && item.video_url ? (
                  <img
                    src={`https://img.youtube.com/vi/${getYouTubeVideoId(item.video_url)}/hqdefault.jpg`}
                    alt={item.title}
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div class="w-full h-full flex items-center justify-center text-4xl text-gray-300 dark:text-gray-600">
                    {item.type === 'photo' ? '📷' : '🎥'}
                  </div>
                )}

                {/* Type Badge */}
                <div class="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded text-xs font-bold uppercase">
                  {item.type === 'video' ? 'Video' : 'Foto'}
                </div>
              </div>

              {/* Content */}
              <div class="p-3 flex-1 flex flex-col relative">
                <div class="mb-2">
                  <h3
                    class="font-bold text-gray-900 dark:text-white text-sm line-clamp-1"
                    title={item.title}
                  >
                    {item.title}
                  </h3>
                  {item.date && (
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(item.date).toLocaleDateString('it-IT')}
                    </p>
                  )}
                </div>

                {item.description && (
                  <p class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 flex-1">
                    {item.description}
                  </p>
                )}

                <div class="flex items-center justify-between mt-auto">
                  {/* External Link */}
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Link esterno"
                      onClick$={(e) => e.stopPropagation()}
                    >
                      🔗
                    </a>
                  )}

                  {/* Expand Icon */}
                  <button
                    onClick$={() => openModal(item)}
                    class="ml-auto p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                    title="Espandi"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <polyline points="9 21 3 21 3 15"></polyline>
                      <line x1="21" y1="3" x2="14" y2="10"></line>
                      <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div class="text-center py-16">
          <div class="text-6xl mb-4">🖼️</div>
          <h3 class="text-xl font-bold text-gray-600 dark:text-gray-300">Galleria vuota</h3>
          <p class="text-gray-500 dark:text-gray-400">Non ci sono contenuti da mostrare.</p>
        </div>
      )}

      {/* Modal */}
      {modalState.isOpen && modalState.selectedItem && (
        <div
          class="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick$={closeModal}
        >
          <div
            class="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            onClick$={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  {modalState.selectedItem.title}
                </h2>
                {modalState.selectedItem.date && (
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(modalState.selectedItem.date).toLocaleDateString('it-IT', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <button
                onClick$={closeModal}
                class="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
            </div>

            {/* Media Content */}
            <div class="bg-black flex items-center justify-center min-h-[300px]">
              {modalState.selectedItem.type === 'photo' && modalState.selectedItem.image && (
                <img
                  src={getImageUrl(modalState.selectedItem)}
                  alt={modalState.selectedItem.title}
                  class="max-w-full max-h-[80vh] object-contain shadow-2xl"
                />
              )}
              {modalState.selectedItem.type === 'video' &&
                modalState.selectedItem.video_url &&
                getYouTubeVideoId(modalState.selectedItem.video_url) && (
                  <div class="w-full aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(modalState.selectedItem.video_url)}?autoplay=1`}
                      title={modalState.selectedItem.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullscreen
                    ></iframe>
                  </div>
                )}
            </div>

            {/* Details */}
            {(modalState.selectedItem.description || modalState.selectedItem.link) && (
              <div class="p-6">
                {modalState.selectedItem.description && (
                  <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {modalState.selectedItem.description}
                  </p>
                )}
                {modalState.selectedItem.link && (
                  <a
                    href={modalState.selectedItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    🔗 Visita Link Esterno
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Galleria - JudoOK',
  meta: [
    {
      name: 'description',
      content: 'Galleria foto e video: momenti e ricordi dal tatami della palestra di Judo.',
    },
  ],
};
