import { component$, type Signal } from '@builder.io/qwik';

interface ImageZoomModalProps {
  isOpen: Signal<boolean>;
  src: Signal<string>;
  alt?: Signal<string>;
}

export const ImageZoomModal = component$<ImageZoomModalProps>(({ isOpen, src, alt }) => {
  if (!isOpen.value || !src.value) return null;

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick$={() => (isOpen.value = false)}
    >
      <div class="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center">
        {/* Close Button */}
        <button
          onClick$={(e) => {
            e.stopPropagation();
            isOpen.value = false;
          }}
          class="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white font-bold text-xl flex items-center justify-center transition-all cursor-pointer border border-white/30"
          title="Chiudi ingrandimento"
        >
          ✕
        </button>

        {/* Zoomed Image */}
        <div
          class="bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20 p-2 max-h-[85vh] max-w-full flex items-center justify-center"
          onClick$={(e) => e.stopPropagation()}
        >
          <img
            src={src.value}
            alt={alt?.value || 'Ingrandimento Immagine'}
            class="max-h-[80vh] max-w-full object-contain rounded-xl shadow-inner"
          />
        </div>

        {alt?.value && (
          <div class="mt-3 text-center text-white font-bold text-sm bg-black/60 px-4 py-1.5 rounded-full border border-white/10 shadow">
            {alt.value}
          </div>
        )}
      </div>
    </div>
  );
});
