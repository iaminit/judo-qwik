import { component$, useSignal, useStore, $, useComputed$, useContext, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { Link } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  image_path?: string;
  category: string;
  dan_level: string;
}

interface QuizSettings {
  danLevel: string;
  questionCount: string;
  category: string;
}

export default component$(() => {
  const gameState = useSignal<'setup' | 'playing' | 'results'>('setup');
  const settings = useStore<QuizSettings>({
    danLevel: '1',
    questionCount: '10',
    category: 'mista',
  });
  const questions = useSignal<Question[]>([]);
  const currentIndex = useSignal(0);
  const answers = useStore<Record<number, number>>({});
  const score = useSignal(0);
  const consecutiveErrors = useSignal(0);
  const isHansokuMake = useSignal(false);
  const appState = useContext(AppContext);

  useVisibleTask$(() => {
    appState.sectionTitle = 'Quiz Esame';
    appState.sectionIcon = '📝';
  });

  const handleStart = $(async () => {
    try {
      const filters = [];

      // Dan Level Filter
      if (settings.danLevel !== 'musashi' && settings.danLevel !== 'mifune' && settings.danLevel !== 'kano') {
        filters.push(`livello_dan="${settings.danLevel}"`);
      }

      // Category Filter
      if (settings.category !== 'mista' && settings.category !== 'generale') {
        filters.push(`categoria="${settings.category}"`);
      }

      const filterString = filters.join(' && ');

      // Fetch questions from PocketBase (new unified collection)
      const records = await pb.collection('domande_quiz').getFullList({
        filter: filterString,
        sort: '@random',
        requestKey: null,
      });

      if (records.length === 0) {
        alert('Nessuna domanda trovata per i criteri selezionati.');
        return;
      }

      // Shuffle and slice to count
      const shuffled = records.sort(() => 0.5 - Math.random());
      const count = Math.min(parseInt(settings.questionCount), shuffled.length);
      const selectedQuestions = shuffled.slice(0, count).map((q: any) => ({
        id: q.id,
        question: q.domanda,
        options: [q.opzione_a, q.opzione_b, q.opzione_c, q.opzione_d],
        correctAnswer: q.risposta_corretta,
        explanation: q.spiegazione,
        image_path: q.immagine,
        category: q.categoria,
        dan_level: q.livello_dan,
      }));

      questions.value = selectedQuestions;
      gameState.value = 'playing';
      currentIndex.value = 0;
      Object.keys(answers).forEach(key => delete answers[Number(key)]);
      score.value = 0;
      consecutiveErrors.value = 0;
      isHansokuMake.value = false;
    } catch (e) {
      console.error(e);
      alert('Errore nel caricamento del quiz. Verifica la connessione.');
    }
  });

  const handleAnswer = $((optionIndex: number) => {
    // 1-based index to match DB
    const selectedAnswer = optionIndex + 1;
    answers[currentIndex.value] = selectedAnswer;
  });

  const nextQuestion = $(() => {
    const currentQ = questions.value[currentIndex.value];
    const userAns = answers[currentIndex.value];

    if (!userAns) return; // Must select

    const isCorrect = userAns === currentQ.correctAnswer;

    if (isCorrect) {
      score.value++;
      consecutiveErrors.value = 0;
    } else {
      consecutiveErrors.value++;
    }

    // Check Hansoku-make (3 errors in a row)
    const nextErrors = isCorrect ? 0 : consecutiveErrors.value;

    if (nextErrors >= 3) {
      isHansokuMake.value = true;
      gameState.value = 'results';
      return;
    }

    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++;
    } else {
      gameState.value = 'results';
    }
  });


  const gradeResult = useComputed$(() => {
    if (isHansokuMake.value) {
      return {
        text: 'HANSOKU-MAKE',
        score: 'Squalifica',
        color: 'text-red-600',
        msg: 'Preparazione insufficiente!',
      };
    }

    const percentage = Math.round((score.value / questions.value.length) * 100);
    if (percentage === 100) {
      return { text: 'IPPON', color: 'text-yellow-500', msg: 'Prestazione perfetta!' };
    }
    if (percentage >= 70) {
      return { text: 'WAZA-ARI', color: 'text-blue-600', msg: 'Buona prestazione!' };
    }
    if (percentage >= 50) {
      return { text: 'YUKO', color: 'text-green-600', msg: 'Prestazione sufficiente' };
    }
    if (percentage >= 30) {
      return { text: 'SHIDO', color: 'text-orange-500', msg: 'Devi studiare di più' };
    }
    return { text: 'HANSOKU-MAKE', color: 'text-red-600', msg: 'Preparazione insufficiente!' };
  });

  const currentQuestion = useComputed$(() => {
    return questions.value[currentIndex.value] || null;
  });

  return (
    <div class="max-w-3xl mx-auto px-4 py-8">
      {/* SETUP SCREEN */}
      {gameState.value === 'setup' && (
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
          <div class="text-center mb-10">
            {/* eslint-disable-next-line qwik/jsx-img */}
            <img
              src="/media/mifune_sorride.webp"
              alt="Kyuzo Mifune"
              class="w-40 h-auto object-contain mx-auto mb-4 drop-shadow-lg"
            />
            <h1 class="text-3xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
              Preparazione Esame
            </h1>
            <p class="text-gray-500 dark:text-gray-400">
              Seleziona il tuo livello e mettiti alla prova
            </p>
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Livello Dan
              </label>
              <select
                value={settings.danLevel}
                onChange$={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  let count = '10';
                  if (val === '2') count = '20';
                  if (val === '3') count = '30';
                  if (val === '4') count = '40';
                  if (val === '5') count = '50';
                  if (val === 'mifune') count = '99';
                  if (val === 'kano') count = '100';
                  if (val === 'musashi') count = '50';
                  settings.danLevel = val;
                  settings.questionCount = count;
                }}
                class="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-black transition-all font-bold text-lg outline-none"
              >
                <option value="1">1° Dan (Shodan)</option>
                <option value="2">2° Dan (Nidan)</option>
                <option value="3">3° Dan (Sandan)</option>
                <option value="4">4° Dan (Yodan)</option>
                <option value="5">5° Dan (Godan)</option>
                <option value="musashi">Miyamoto Musashi (Custom)</option>
                <option value="mifune">Kyuzo Mifune (Master)</option>
                <option value="kano">Jigoro Kano (Legend)</option>
              </select>
            </div>

            {settings.danLevel === 'musashi' ? (
              <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Numero Domande:{' '}
                  <span class="text-red-500 text-lg">{settings.questionCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={settings.questionCount}
                  onInput$={(e) => {
                    settings.questionCount = (e.target as HTMLInputElement).value;
                  }}
                  class="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>
            ) : (
              <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Numero Domande
                </label>
                <div class="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed">
                  {settings.questionCount} Domande
                </div>
              </div>
            )}

            <button
              onClick$={handleStart}
              class="w-full py-5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white font-black text-xl shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all duration-200 mt-4 flex items-center justify-center gap-3"
            >
              <span>🚀 INIZIA QUIZ</span>
            </button>
          </div>
        </div>
      )}

      {/* GAME SCREEN */}
      {gameState.value === 'playing' && currentQuestion.value && (
        <div class="animate-in slide-in-from-right duration-300">
          {/* Header / Progress */}
          <div class="flex justify-between items-end mb-6">
            <div>
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Domanda
              </span>
              <div class="text-3xl font-black text-gray-800 dark:text-white leading-none">
                <span class="text-red-600">{currentIndex.value + 1}</span>
                <span class="text-lg text-gray-300 mx-1">/</span>
                <span class="text-gray-400">{questions.value.length}</span>
              </div>
            </div>
            <div class="text-right">
              {consecutiveErrors.value > 0 && (
                <div class="text-xs font-bold text-red-500 animate-pulse">
                  {consecutiveErrors.value} errori consecutivi!
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div class="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
            <div
              class="h-full bg-red-500 transition-all duration-500 ease-out"
              style={{
                width: `${((currentIndex.value + 1) / questions.value.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Card */}
          <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            {/* Question Text */}
            <h2 class="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-8 leading-relaxed">
              {currentQuestion.value.question}
            </h2>

            {/* Image if exists */}
            {currentQuestion.value.image_path &&
              typeof currentQuestion.value.image_path === 'string' && (
                <div class="mb-6 rounded-xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50 flex justify-center">
                  <img
                    src={`/media/${currentQuestion.value.image_path.split('/').pop()}`}
                    alt="Domanda"
                    class="max-h-64 object-contain"
                    onError$={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                </div>
              )}

            {/* Options */}
            <div class="space-y-3">
              {currentQuestion.value.options.map((opt, idx) => {
                const isSelected = answers[currentIndex.value] === idx + 1;
                return (
                  <button
                    key={idx}
                    onClick$={() => handleAnswer(idx)}
                    class={`w-full p-4 md:p-5 text-left rounded-xl border-2 transition-all duration-200 flex items-start gap-4 group ${isSelected
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 shadow-md transform scale-[1.01]'
                      : 'border-transparent bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750'
                      }`}
                  >
                    <div
                      class={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isSelected
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 group-hover:bg-gray-300'
                        }`}
                    >
                      {['A', 'B', 'C', 'D'][idx]}
                    </div>
                    <span class="font-medium text-lg pt-0.5">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div class="mt-8 flex justify-end">
            <button
              onClick$={nextQuestion}
              disabled={!answers[currentIndex.value]}
              class={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2 transition-all duration-300 ${answers[currentIndex.value]
                ? 'bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-105 hover:shadow-xl'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
            >
              {currentIndex.value === questions.value.length - 1 ? 'Termina' : 'Prossima'}
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* RESULTS SCREEN */}
      {gameState.value === 'results' && (
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700 text-center animate-in zoom-in-95 duration-500">
          <div class="inline-block p-4 rounded-full bg-gray-50 dark:bg-gray-900 mb-6 relative">
            <span class="text-6xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {gradeResult.value.text === 'IPPON'
                ? '🏆'
                : gradeResult.value.text === 'HANSOKU-MAKE'
                  ? '🛑'
                  : '🥋'}
            </span>
            <svg class="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                stroke-width="8"
                fill="transparent"
                class="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="currentColor"
                stroke-width="8"
                fill="transparent"
                stroke-dasharray={377}
                stroke-dashoffset={
                  377 - (377 * (isHansokuMake.value ? 0 : score.value)) / questions.value.length
                }
                class={gradeResult.value.color}
              />
            </svg>
          </div>

          <h2 class={`text-4xl md:text-5xl font-black mb-2 ${gradeResult.value.color}`}>
            {gradeResult.value.text}
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-400 font-medium mb-8">
            {gradeResult.value.msg}
          </p>

          <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-10">
            <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
              <div class="text-sm text-gray-500 uppercase tracking-wide font-bold mb-1">
                Punteggio
              </div>
              <div class="text-2xl font-black text-gray-900 dark:text-white">
                {score.value}
                <span class="text-gray-400 text-base">/{questions.value.length}</span>
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
              <div class="text-sm text-gray-500 uppercase tracking-wide font-bold mb-1">
                Precisione
              </div>
              <div class="text-2xl font-black text-gray-900 dark:text-white">
                {Math.round((score.value / questions.value.length) * 100)}%
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <button
              onClick$={() => {
                gameState.value = 'setup';
              }}
              class="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-lg shadow-lg hover:transform hover:scale-105 transition-all"
            >
              🔄 Nuova Partita
            </button>
            <Link
              href="/"
              class="w-full py-4 rounded-xl bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-center"
            >
              Torna alla Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Quiz Esame - JudoOK',
  meta: [
    {
      name: 'description',
      content:
        'Mettiti alla prova con il quiz di preparazione agli esami di judo. Domande per tutti i livelli Dan.',
    },
  ],
};
