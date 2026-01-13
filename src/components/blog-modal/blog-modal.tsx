import { component$, type QRL, useStyles$, useVisibleTask$ } from '@builder.io/qwik';
import { getPBFileUrl, getMediaUrl } from '~/lib/pocketbase';
import type { Post } from '../blog-card/blog-card';

interface BlogModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: QRL<() => void>;
}

export default component$<BlogModalProps>(({ post, isOpen, onClose }) => {
  useVisibleTask$(({ track }) => {
    track(() => isOpen);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

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
      height: auto !important;
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
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.2);
      border-radius: 10px;
    }
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
    if (!post.cover_image) return getMediaUrl('/media/blog/default.webp');
    if (post.cover_image.startsWith('media/')) return getMediaUrl('/' + post.cover_image);
    if (post.cover_image.startsWith('/media')) return getMediaUrl(post.cover_image);

    return getPBFileUrl(post.collectionId!, post.id, post.cover_image);
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
        class="bg-white dark:bg-gray-900 w-full h-full overflow-hidden"
        onClick$={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick$={onClose}
          class="fixed top-8 left-8 w-12 h-12 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-blue-500/20 rounded-full text-blue-600 flex items-center justify-center shadow-xl z-50 active:scale-90 transition-transform"
          aria-label="Chiudi"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>

        <div class="h-full overflow-y-auto custom-scrollbar">
          {/* Hero Section */}
          <div class="relative h-[40vh] md:h-[60vh] overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img src={getImageUrl(post)} alt={post.title} class="w-full h-full object-contain" />
            <div class="absolute inset-x-0 bottom-0 p-8 md:p-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent">
              <div class="max-w-4xl mx-auto">
                <h2 class="text-3xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">
                  {post.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div class="max-w-4xl mx-auto p-8 md:p-16">
            {/* Date */}
            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 font-bold uppercase tracking-widest">
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
                  <span class="mx-2">•</span>
                  <span>Scade il: {formatDate(post.expiration_date)}</span>
                </>
              )}
            </div>

            {/* Full Content */}
            <div class="mb-12 max-w-none">
              <div class="ql-container ql-snow" style={{ border: 'none' }}>
                <div
                  class="ql-editor !text-lg md:!text-xl !leading-relaxed"
                  dangerouslySetInnerHTML={post.content}
                />
              </div>
            </div>

            {/* Video YouTube */}
            {youtubeId && (
              <div class="mb-12">
                <div class="flex items-center gap-2 mb-6">
                  <span class="w-2 h-6 bg-red-600 rounded-full"></span>
                  <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Video</h3>
                </div>
                <div class="rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-950">
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

            {/* External Link */}
            {post.external_link && (
              <div class="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800">
                <a
                  href={post.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-4 px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-blue-500/20 uppercase tracking-widest"
                >
                  <span>Visita Link Esterno</span>
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
