import { component$, useSignal, $, type QRL } from '@builder.io/qwik';

export interface Technique {
  id: string;
  nome: string;
  gruppo: string;
  tipo: string;
  descrizione?: string;
  video_youtube?: string;
  audio_file?: string;
  has_audio: boolean;
  dan_level: number;
  image: string;
}

interface TechniqueCardProps {
  technique: Technique;
  onOpenModal: QRL<(technique: Technique) => void>;
  isTarget?: boolean;
}

export default component$<TechniqueCardProps>(({ technique, onOpenModal, isTarget }) => {
  const isPlaying = useSignal(false);

  // Gokyo Color Mapping - Updated to match the reference image exactly
  const getGroupColor = (group: string) => {
    const g = group.toLowerCase();
    if (g.includes('ikkyo')) return 'bg-[#ffd700] text-gray-900'; // Yellow
    if (g.includes('nikyo')) return 'bg-[#ff8c00] text-white';    // Orange
    if (g.includes('sankyo')) return 'bg-[#4ade80] text-white';    // Green
    if (g.includes('yonkyo')) return 'bg-[#3b82f6] text-white';    // Blue
    if (g.includes('gokyo')) return 'bg-[#000000] text-white';     // Black
    if (g.includes('atemi')) return 'bg-red-700 text-white';       // Atemi
    return 'bg-[#2d2d2d] text-white'; // Ne-waza/Others
  };

  const groupColorClass = getGroupColor(technique.gruppo);

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
    onOpenModal(technique);
  });

  return (
    <div
      class={`bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:scale-[1.03] transition-all duration-500 cursor-pointer group flex flex-col ${isTarget ? 'animate-term-highlight ring-4 ring-red-500/20' : ''}`}
      onClick$={handleCardClick}
    >
      {/* Image Container - White background like in the physical cards */}
      <div class="flex-1 aspect-square bg-white relative overflow-hidden flex items-center justify-center">
        <img
          src={`/media/${technique.image}`}
          alt={technique.nome}
          class="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700 mix-blend-multiply"
          onError$={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src.indexOf('kano_non_sa.webp') === -1) {
              target.onerror = null;
              target.src = '/media/kano_non_sa.webp';
            }
          }}
        />

        {/* Audio Button Overlay - Subtle */}
        {technique.has_audio && technique.audio_file && (
          <button
            class={`absolute top-4 left-4 p-2 rounded-xl transition-all shadow-lg backdrop-blur-md border ${isPlaying.value
              ? 'bg-red-600 text-white border-red-500'
              : 'bg-white/90 text-gray-700 border-white/20 hover:bg-red-600 hover:text-white'
              }`}
            onClick$={(e) => {
              e.stopPropagation();
              playAudio(technique.audio_file!);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </button>
        )}

        {/* Video Badge - Minimalist */}
        {technique.video_youtube && (
          <div class="absolute top-4 right-4 bg-red-600 text-[8px] font-black text-white px-2 py-1 rounded-lg tracking-tighter shadow-lg opacity-80 group-hover:opacity-100 transition-opacity">
            TV
          </div>
        )}
      </div>

      {/* Footer - The iconic colored bar from the reference image */}
      <div class={`py-3 px-2 text-center transition-colors duration-500 ${groupColorClass}`}>
        <h3 class="font-black text-[10px] md:text-xs uppercase tracking-tight leading-none truncate">
          {technique.nome}
        </h3>
      </div>
    </div>
  );
});
