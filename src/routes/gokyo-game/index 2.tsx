import { component$, useStore, $, useVisibleTask$, useContext } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';

interface Technique {
  id: string;
  name: string;
  kanji?: string;
  group: string;
}

interface GameData {
  techniques: Technique[];
  error?: string;
}

interface GameState {
  currentRound: number;
  score: number;
  gameState: 'playing' | 'feedback' | 'finished';
  currentTech: Technique | null;
  selectedGroup: string | null;
  isCorrect: boolean | null;
}

const GOKYO_GROUPS = ['Dai Ikkyo', 'Dai Nikyo', 'Dai Sankyo', 'Dai Yonkyo', 'Dai Gokyo'];

export const useGokyoGameData = routeLoader$<GameData>(async () => {
  try {
    console.log('[GokyoGame] Fetching techniques from PocketBase...');
    const records = await pb.collection('techniques').getFullList({
      filter: 'group != "" && group != "Altre"',
      requestKey: null,
    });

    // Filter to only valid Gokyo groups
    const gokyoTechs = records.filter((t: any) =>
      GOKYO_GROUPS.includes(t.group)
    );

    // Shuffle and take 10 random techniques
    const shuffled = gokyoTechs.sort(() => 0.5 - Math.random()).slice(0, 10);
    console.log('[GokyoGame] Prepared', shuffled.length, 'techniques for quiz');

    return {
      techniques: shuffled as unknown as Technique[],
    };
  } catch (err) {
    console.error('[GokyoGame] Error loading techniques:', err);
    return {
      techniques: [],
      error: 'Impossibile caricare il gioco. Riprova più tardi.',
    };
  }
});

export default component$(() => {
  const data = useGokyoGameData();
  const appState = useContext(AppContext);

  const gameStore = useStore<GameState>({
    currentRound: 0,
    score: 0,
    gameState: 'playing',
    currentTech: data.value.techniques[0] || null,
    selectedGroup: null,
    isCorrect: null,
  });

  useVisibleTask$(() => {
    appState.sectionTitle = 'Gokyo Game';
    appState.sectionIcon = '🎮';
  });

  const handleGuess = $((group: string) => {
    if (!gameStore.currentTech) return;

    const correct = group === gameStore.currentTech.group;
    gameStore.selectedGroup = group;
    gameStore.isCorrect = correct;
    gameStore.gameState = 'feedback';

    if (correct) {
      gameStore.score++;
    }

    // After 1.5s, move to next round or finish
    setTimeout(() => {
      if (gameStore.currentRound < data.value.techniques.length - 1) {
        gameStore.currentRound++;
        gameStore.currentTech = data.value.techniques[gameStore.currentRound];
        gameStore.selectedGroup = null;
        gameStore.isCorrect = null;
        gameStore.gameState = 'playing';
      } else {
        gameStore.gameState = 'finished';
      }
    }, 1500);
  });

  const restartGame = $(() => {
    gameStore.currentRound = 0;
    gameStore.score = 0;
    gameStore.gameState = 'playing';
    gameStore.currentTech = data.value.techniques[0] || null;
    gameStore.selectedGroup = null;
    gameStore.isCorrect = null;
  });

  if (data.value.techniques.length === 0) {
    return (
      <div class="max-w-2xl mx-auto text-center py-16">
        <div class="text-6xl mb-4">🎮</div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Gioco non disponibile
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {data.value.error || 'Nessuna tecnica trovata per il gioco.'}
        </p>
      </div>
    );
  }

  return (
    <div class="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">Gokyo Game</h1>
        <p class="text-gray-600 dark:text-gray-400">
          Indovina il gruppo Gokyo di ogni tecnica!
        </p>
      </div>

      {/* Playing State */}
      {gameStore.gameState === 'playing' && gameStore.currentTech && (
        <div class="space-y-8">
          {/* Round Counter */}
          <div class="text-center">
            <div class="inline-block bg-gray-100 dark:bg-gray-800 px-6 py-2 rounded-full">
              <span class="font-bold text-gray-900 dark:text-white">
                Round {gameStore.currentRound + 1} / {data.value.techniques.length}
              </span>
              <span class="ml-4 text-gray-600 dark:text-gray-400">
                Punteggio: {gameStore.score}
              </span>
            </div>
          </div>

          {/* Technique Card */}
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
            <div class="text-center mb-8">
              <h2 class="text-3xl font-black text-gray-900 dark:text-white mb-2">
                {gameStore.currentTech.name}
              </h2>
              {gameStore.currentTech.kanji && (
                <p class="text-xl text-gray-500 dark:text-gray-400">
                  {gameStore.currentTech.kanji}
                </p>
              )}
            </div>

            <div class="text-center mb-6">
              <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">
                A quale gruppo appartiene questa tecnica?
              </p>
            </div>

            {/* Group Buttons */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOKYO_GROUPS.map((group) => (
                <button
                  key={group}
                  onClick$={() => handleGuess(group)}
                  class="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feedback State */}
      {gameStore.gameState === 'feedback' && gameStore.currentTech && (
        <div class="space-y-8">
          {/* Round Counter */}
          <div class="text-center">
            <div class="inline-block bg-gray-100 dark:bg-gray-800 px-6 py-2 rounded-full">
              <span class="font-bold text-gray-900 dark:text-white">
                Round {gameStore.currentRound + 1} / {data.value.techniques.length}
              </span>
              <span class="ml-4 text-gray-600 dark:text-gray-400">
                Punteggio: {gameStore.score}
              </span>
            </div>
          </div>

          {/* Feedback Card */}
          <div
            class={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-4 p-8 animate-bounce ${
              gameStore.isCorrect
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <div class="text-center mb-6">
              <div class="text-6xl mb-4">{gameStore.isCorrect ? '✅' : '❌'}</div>
              <h2 class="text-3xl font-black mb-2">
                <span class={gameStore.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {gameStore.isCorrect ? 'Corretto!' : 'Sbagliato!'}
                </span>
              </h2>
              <p class="text-xl text-gray-900 dark:text-white font-bold">
                {gameStore.currentTech.name}
              </p>
              {gameStore.currentTech.kanji && (
                <p class="text-lg text-gray-500 dark:text-gray-400">
                  {gameStore.currentTech.kanji}
                </p>
              )}
            </div>

            <div class="text-center">
              <p class="text-lg text-gray-700 dark:text-gray-300">
                {gameStore.isCorrect ? (
                  <>Appartiene a <span class="font-bold text-green-600">{gameStore.currentTech.group}</span></>
                ) : (
                  <>
                    Hai scelto <span class="font-bold text-red-600">{gameStore.selectedGroup}</span>, ma appartiene a <span class="font-bold text-green-600">{gameStore.currentTech.group}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Finished State */}
      {gameStore.gameState === 'finished' && (
        <div class="text-center space-y-8">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-12">
            <div class="text-6xl mb-6">🏆</div>
            <h2 class="text-4xl font-black text-gray-900 dark:text-white mb-4">
              Gioco Completato!
            </h2>
            <div class="text-center mb-8">
              <p class="text-2xl text-gray-600 dark:text-gray-400 mb-2">
                Il tuo punteggio finale:
              </p>
              <p class="text-6xl font-black text-blue-600 dark:text-blue-400">
                {gameStore.score} / {data.value.techniques.length}
              </p>
              <p class="text-xl text-gray-500 dark:text-gray-400 mt-4">
                {gameStore.score === data.value.techniques.length
                  ? 'Perfetto! Sei un maestro del Gokyo! 🥋'
                  : gameStore.score >= data.value.techniques.length * 0.7
                  ? 'Ottimo lavoro! Continua così! 👏'
                  : gameStore.score >= data.value.techniques.length * 0.5
                  ? 'Buon lavoro! Studia ancora un po\'. 📚'
                  : 'Non scoraggiarti, riprova! 💪'}
              </p>
            </div>
            <button
              onClick$={restartGame}
              class="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-lg"
            >
              🔄 Gioca Ancora
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Gokyo Game - JudoOK',
  meta: [
    {
      name: 'description',
      content: 'Quiz interattivo per imparare i gruppi del Gokyo del Judo.',
    },
  ],
};
