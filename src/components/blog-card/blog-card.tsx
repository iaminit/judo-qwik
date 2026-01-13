import { component$, type QRL, useStyles$ } from '@builder.io/qwik';
import { getPBFileUrl, getMediaUrl } from '~/lib/pocketbase';

export interface Post {
  id: string;
  title: string;
  content: string;
  date: string;
  expiration_date?: string;
  cover_image?: string;
  video_link?: string;
  external_link?: string;
  activity?: string;
  collectionId?: string;
}

interface BlogCardProps {
  post: Post;
  onClick: QRL<(post: Post) => void>;
  viewMode?: 'grid' | 'list';
}

export default component$<BlogCardProps>(({ post, onClick, viewMode = 'grid' }) => {
  useStyles$(`
    @import 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    .ql-container.ql-snow { border: none !important; font-family: inherit !important; }
    .ql-editor { padding: 0 !important; overflow: hidden; color: inherit !important; }
    .ql-editor * { color: inherit; }
    .ql-color-red { color: #ef4444 !important; }
    .ql-color-green { color: #22c55e !important; }
    .ql-color-blue { color: #3b82f6 !important; }
    .ql-color-orange { color: #f97316 !important; }
  `);

  // Formatta la data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Genera URL per l'immagine di copertina - uses getMediaUrl for APK compatibility
  const getImageUrl = (post: Post): string => {
    if (!post.cover_image) return getMediaUrl('/media/blog/default.webp');
    if (post.cover_image.startsWith('media/')) return getMediaUrl('/' + post.cover_image);
    if (post.cover_image.startsWith('/media')) return getMediaUrl(post.cover_image);

    return getPBFileUrl(post.collectionId!, post.id, post.cover_image);
  };

  // Colore di sfondo in base all'attività
  const getActivityBackgroundColor = (activity?: string): string => {
    const colors: Record<string, string> = {
      JUDO: '#fff',
      BJJ: '#ddd',
      JJ: '#eee',
      'Krav Maga': '#ccc',
    };
    return colors[activity || ''] || '#fff';
  };

  // Funzione per generare un estratto di testo puro limitato a 25 parole
  const getExcerpt = (html: string, limit: number = 25) => {
    if (!html) return '';
    const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plainText.split(' ');
    if (words.length <= limit) return plainText;
    return words.slice(0, limit).join(' ') + '...';
  };

  const excerpt = getExcerpt(post.content);

  // Modalità lista: solo data e titolo
  if (viewMode === 'list') {
    return (
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
        onClick$={() => onClick(post)}
      >
        {/* Data */}
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-2" style={{ fontWeight: 200 }}>
          {formatDate(post.date)}
        </div>

        {/* Titolo */}
        <h3
          class="text-xl text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
          style={{ fontWeight: 400 }}
        >
          {post.title}
        </h3>
      </div>
    );
  }

  // Modalità griglia: visualizzazione completa
  return (
    <div
      class="surface-elevated rounded-2xl cursor-pointer group"
      onClick$={() => onClick(post)}
    >
      {/* Immagine di copertina */}
      <div
        class="relative h-48 overflow-hidden"
        style={{ backgroundColor: getActivityBackgroundColor(post.activity) }}
      >
        <img
          src={getImageUrl(post)}
          alt={post.title}
          class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        {post.video_link && (
          <div class="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Contenuto */}
      <div class="p-5">
        {/* Data */}
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatDate(post.date)}</span>
        </div>

        {/* Titolo */}
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
          {post.title}
        </h3>

        {/* Contenuto troncato (25 parole) */}
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed">
          {excerpt}
        </p>

        {/* Pulsante "Leggi di più" */}
        <div class="flex items-center justify-between">
          <button class="inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-bold hover:gap-3 transition-all">
            <span>Leggi di più</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {post.external_link && (
            <div class="text-blue-600 dark:text-blue-400" title="Link esterno disponibile">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
