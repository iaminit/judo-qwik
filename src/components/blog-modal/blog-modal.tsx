import { component$, type QRL, useStyles$ } from '@builder.io/qwik';
import type { Post } from '../blog-card';

interface BlogModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: QRL<() => void>;
}

export default component$<BlogModalProps>(({ post, isOpen, onClose }) => {
  useStyles$(`
    @import 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
    
    .ql-editor { 
      padding: 0 !important; 
      color: inherit !important;
      font-size: 1.125rem !important;
      line-height: 1.75 !important;
    }
    
    .ql-editor * {
      color: inherit; 
    }

    .dark .ql-editor { 
      color: #f3f4f6 !important; 
    }

    .ql-container.ql-snow { 
      border: none !important; 
      font-family: inherit !important; 
    }
    
    /* Ensure inline styles for colors always win over Tailwind prose */
    .ql-editor span[style] {
      color: attr(style);
    }
    
    /* Fallback for Quill classes if inline styles fail */
    .ql-color-red { color: #ef4444 !important; }
    .ql-color-green { color: #22c55e !important; }
    .ql-color-blue { color: #3b82f6 !important; }
    .ql-color-orange { color: #f97316 !important; }
    .ql-color-yellow { color: #eab308 !important; }
    .ql-color-purple { color: #a855f7 !important; }
    .ql-bg-red { background-color: #fee2e2 !important; }
    .ql-bg-green { background-color: #dcfce7 !important; }
    .ql-bg-blue { background-color: #dbeafe !important; }
    .ql-bg-yellow { background-color: #fef9c3 !important; }
  `);

  if (!isOpen || !post) return null;

  // Formatta la data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Genera URL per l'immagine di copertina
  const getImageUrl = (post: Post): string => {
    if (!post.cover_image) return '/media/blog/default.webp';
    return `http://127.0.0.1:8090/api/files/${post.collectionId}/${post.id}/${post.cover_image}`;
  };

  // Estrai ID video YouTube
  const getYouTubeId = (url?: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
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

  const youtubeId = getYouTubeId(post.video_link);

  return (
    <div class="fixed inset-0 z-50 bg-black/90" onClick$={onClose}>
      {/* Modal Content */}
      <div
        class="bg-white dark:bg-gray-900 w-full h-full overflow-y-auto"
        onClick$={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div class="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white line-clamp-1">
            {post.title}
          </h2>
          <button
            onClick$={onClose}
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Chiudi"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div
          class="relative h-64 md:h-80 overflow-hidden"
          style={{ backgroundColor: getActivityBackgroundColor(post.activity) }}
        >
          <img src={getImageUrl(post)} alt={post.title} class="w-full h-full object-contain" />
        </div>

        {/* Content */}
        <div class="p-6 md:p-8">
          {/* Date */}
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatDate(post.date)}</span>
            {post.expiration_date && (
              <>
                <span>•</span>
                <span>Scade il: {formatDate(post.expiration_date)}</span>
              </>
            )}
          </div>

          {/* Full Content */}
          <div class="mb-6 max-w-none">
            <div class="ql-container ql-snow" style={{ border: 'none' }}>
              <div
                class="ql-editor"
                dangerouslySetInnerHTML={post.content}
              />
            </div>
          </div>

          {/* Video YouTube */}
          {youtubeId && (
            <div class="mb-6">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-red-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                Video
              </h3>
              <div class="aspect-w-16 aspect-h-9">
                <iframe
                  class="w-full aspect-video"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={post.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullscreen
                ></iframe>
              </div>
            </div>
          )}

          {/* Video MP4 */}
          {post.video_link && !youtubeId && post.video_link.endsWith('.mp4') && (
            <div class="mb-6">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-red-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                Video
              </h3>
              <video class="w-full" controls src={post.video_link}>
                Il tuo browser non supporta il tag video.
              </video>
            </div>
          )}

          {/* External Link */}
          {post.external_link && (
            <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <a
                href={post.external_link}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
              >
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
                Visita Link Esterno
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
