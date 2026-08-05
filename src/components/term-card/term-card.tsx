import { component$, useSignal, $, type QRL } from '@builder.io/qwik';

export interface Term {
  id: string;
  termine: string;
  pronuncia: string;
  descrizione: string;
  kanji?: string;
  audio_file?: string;
  has_audio: boolean;
  image_url?: string;
}

interface TermCardProps {
  term: Term;
  onOpenModal: QRL<(term: Term) => void>;
  isTarget?: boolean;
}

export default component$<TermCardProps>(({ term, onOpenModal, isTarget }) => {
  const isPlaying = useSignal(false);

  const playAudio = $((audioFile: string) => {
    if (!audioFile) return;

    const audioUrl = audioFile.startsWith('http') ? audioFile : `/media/audio/${audioFile}`;
    const audio = new Audio(audioUrl);
    audio.volume = 1.0;

    audio.onplay = () => { isPlaying.value = true; };
    audio.onended = () => { isPlaying.value = false; };
    audio.onerror = () => {
      console.error('Audio playback failed');
      isPlaying.value = false;
    };

    audio.play().catch(error => {
      console.error('Audio playback error:', error);
      isPlaying.value = false;
    });
  });

  const handleCardClick = $(() => {
    onOpenModal(term);
  });

  return (
    <div
      class={`rounded-2xl border p-5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 pressable relative ${isTarget ? 'animate-term-highlight' : ''}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
      onClick$={handleCardClick}
    >
      {/* Modal trigger button */}
      <button
        class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        onClick$={(e) => {
          e.stopPropagation();
          handleCardClick();
        }}
        title="Apri in modal"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </button>

      <div class="flex justify-between items-start mb-2">
        <div class="flex items-center gap-2">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white m-0">
            {term.termine}
          </h3>

          {/* Audio button */}
          {term.has_audio && term.audio_file && (
            <button
              class={`p-2 rounded-xl transition-all shadow-sm border ${
                isPlaying.value
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
              }`}
              onClick$={(e) => {
                e.stopPropagation();
                playAudio(term.audio_file!);
              }}
              title="Ascolta pronuncia"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>
          )}
        </div>

        {/* Kanji badge */}
        {term.kanji && (
          <span class="text-2xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
            {term.kanji}
          </span>
        )}
      </div>

      {/* Pronunciation subtitle */}
      {term.termine && (
        <p class="text-sm italic text-gray-500 dark:text-gray-400 mb-3">
          {term.termine.toLowerCase().replace(/ /g, '-')}
        </p>
      )}

      {/* Description */}
      {term.descrizione && (
        <div
          class="text-gray-700 dark:text-gray-300 text-sm line-clamp-3"
          dangerouslySetInnerHTML={term.descrizione}
        />
      )}

      {/* Thumbnail Image for Dictionary Term — only shown if server resolved an image */}
      {term.image_url && (
        <div class="mt-3 flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700 thumb-box">
          <img
            src={term.image_url}
            alt={term.termine}
            class="w-14 h-14 object-contain rounded-lg bg-white p-1 border border-gray-200 dark:border-gray-600 shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
            onError$={(e) => {
              const imgEl = e.target as HTMLImageElement;
              const container = imgEl.closest('.thumb-box') as HTMLElement;
              if (container) container.style.display = 'none';
            }}
            onClick$={(e) => {
              e.stopPropagation();
              if ((window as any).openImageZoom) {
                (window as any).openImageZoom(term.image_url!, term.termine);
              }
            }}
            title="Clicca per ingrandire"
          />
          <div class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">
            Tavola Illustrata di <strong class="text-gray-800 dark:text-gray-200">{term.termine}</strong>
          </div>
        </div>
      )}
    </div>
  );
});
