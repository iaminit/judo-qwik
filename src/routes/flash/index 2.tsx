import { component$, useSignal, $, useVisibleTask$, useContext } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';

interface FlashCard {
  id: string;
  term: string;
  kanji?: string;
  description: string;
}

interface FlashCardData {
  cards: FlashCard[];
  error?: string;
}

export const useFlashCardData = routeLoader$<FlashCardData>(async () => {
  try {
    console.log('[FlashCard] Fetching from collection "dizionario"...');
    const records = await pb.collection('dizionario').getFullList({
      requestKey: null,
    });

    // Map fields to FlashCard interface
    const mappedCards: FlashCard[] = records.map((r: any) => ({
      id: r.id,
      term: r.titolo || '',
      kanji: r.titolo_secondario || '',
      description: r.contenuto || '',
    }));

    // Shuffle client side and limit to 50
    const shuffled = mappedCards.sort(() => 0.5 - Math.random()).slice(0, 50);
    console.log('[FlashCard] Prepared', shuffled.length, 'flash cards');

    return {
      cards: shuffled,
    };
  } catch (err) {
    console.error('[FlashCard] Error loading flash cards:', err);
    return {
      cards: [],
      error: 'Impossibile caricare le flash cards. Riprova più tardi.',
    };
  }
});

export default component$(() => {
  const data = useFlashCardData();
  const appState = useContext(AppContext);

  const currentIndex = useSignal(0);
  const isFlipped = useSignal(false);

  useVisibleTask$(() => {
    appState.sectionTitle = 'Flash Cards';
    appState.sectionIcon = '🎴';
  });

  const handleNext = $(() => {
    isFlipped.value = false;
    setTimeout(() => {
      currentIndex.value = (currentIndex.value + 1) % data.value.cards.length;
    }, 200);
  });

  const handlePrev = $(() => {
    isFlipped.value = false;
    setTimeout(() => {
      currentIndex.value = (currentIndex.value - 1 + data.value.cards.length) % data.value.cards.length;
    }, 200);
  });

  const toggleFlip = $(() => {
    isFlipped.value = !isFlipped.value;
  });

  if (data.value.cards.length === 0) {
    return (
      <div class="max-w-2xl mx-auto text-center py-16">
        <div class="text-6xl mb-4">🎴</div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Nessuna flash card disponibile
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {data.value.error || 'Nessun termine trovato nel dizionario.'}
        </p>
      </div>
    );
  }

  const currentCard = data.value.cards[currentIndex.value];

  return (
    <div class="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Header */}
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Flash Cards</h1>
        <p class="text-gray-500 dark:text-gray-400">Clicca sulla carta per girarla</p>
      </div>

      {/* Card Container */}
      <div
        onClick$={toggleFlip}
        class="relative w-full h-80 cursor-pointer group"
        style="perspective: 1000px;"
      >
        <div
          class={`relative w-full h-full text-center transition-transform duration-500 ${isFlipped.value ? 'rotate-y-180' : ''
            }`}
          style="transform-style: preserve-3d;"
        >
          {/* Front */}
          <div
            class="absolute w-full h-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 border-2 border-green-500"
            style="backface-visibility: hidden;"
          >
            <span class="text-6xl mb-6">🇯🇵</span>
            <h2 class="text-4xl font-black text-gray-900 dark:text-white mb-2">
              {currentCard.term}
            </h2>
            {currentCard.kanji && (
              <p class="text-2xl text-gray-400">{currentCard.kanji}</p>
            )}
          </div>

          {/* Back */}
          <div
            class="absolute w-full h-full bg-green-600 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 rotate-y-180"
            style="backface-visibility: hidden; transform: rotateY(180deg);"
          >
            <span class="text-6xl mb-6">🇮🇹</span>
            <div
              class="text-xl font-medium leading-relaxed prose prose-invert max-w-none"
              dangerouslySetInnerHTML={currentCard.description}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div class="flex gap-4 mt-10 items-center">
        <button
          onClick$={handlePrev}
          class="px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← Precedente
        </button>
        <div class="px-6 py-3 font-mono text-gray-500 dark:text-gray-400">
          {currentIndex.value + 1} / {data.value.cards.length}
        </div>
        <button
          onClick$={handleNext}
          class="px-6 py-3 rounded-full bg-green-600 text-white font-bold hover:bg-green-700 transition-colors"
        >
          Prossima →
        </button>
      </div>

      {/* CSS for 3D Flip */}
      <style>
        {`
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
        `}
      </style>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Flash Cards - JudoOK',
  meta: [
    {
      name: 'description',
      content: 'Flash cards per studiare i termini del Judo in modo rapido e divertente.',
    },
  ],
};
