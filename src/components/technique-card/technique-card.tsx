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

  // Gokyo Color Mapping
  const getGroupColor = (group: string) => {
    const g = group.toLowerCase();
    if (g.includes('ikkyo')) return 'bg-yellow-400 text-gray-900';
    if (g.includes('nikyo')) return 'bg-orange-500 text-white';
    if (g.includes('sankyo')) return 'bg-green-500 text-white';
    if (g.includes('yonkyo')) return 'bg-blue-600 text-white';
    if (g.includes('gokyo')) return 'bg-black text-white';
    if (g.includes('atemi')) return 'bg-red-700 text-white';
    return 'bg-gray-800 text-white'; // Default for Ne-waza or others
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
      class={`bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col ${isTarget ? 'animate-term-highlight' : ''}`}
      onClick$={handleCardClick}
    >
      {/* Image Container */}
      <div class="flex-1 aspect-square bg-white dark:bg-slate-900 relative overflow-hidden">
        <img
          src={`/media/${technique.image}`}
          alt={technique.nome}
          class="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500 mix-blend-multiply dark:mix-blend-screen"
          onError$={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src.indexOf('kano_non_sa.webp') === -1) {
              target.onerror = null;
              target.src = '/media/kano_non_sa.webp';
            }
          }}
        />

        {/* Audio Button Overlay */}
        {technique.has_audio && technique.audio_file && (
          <button
            class={`absolute top-3 left-3 p-2.5 rounded-xl transition-all shadow-xl backdrop-blur-md border ${isPlaying.value
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 border-white/20 hover:bg-red-600 hover:text-white'
              }`}
            onClick$={(e) => {
              e.stopPropagation();
              playAudio(technique.audio_file!);
            }}
            title="Ascolta pronuncia"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </button>
        )}

        {/* Video Badge */}
        {technique.video_youtube && (
          <div class="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-xl text-[8px] font-black tracking-widest flex items-center gap-1.5 shadow-lg">
            <div class="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            VIDEO
          </div>
        )}
      </div>

      {/* Content - Characterized by Color at the bottom */}
      <div class={`p-4 text-center min-h-[80px] flex flex-col justify-center transition-colors duration-300 ${groupColorClass}`}>
        <h3 class="font-black text-sm md:text-base leading-tight uppercase tracking-tighter mb-1">
          {technique.nome}
        </h3>
        <p class={`text-[9px] font-bold uppercase tracking-widest opacity-60`}>
          {technique.gruppo}
        </p>
      </div>
    </div>
  );
});
