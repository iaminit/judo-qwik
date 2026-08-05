import {
  component$,
  useSignal,
  useStore,
  $,
  useComputed$,
  useContext,
  useVisibleTask$,
  useTask$,
  useOnWindow,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";
import { pb } from "~/lib/pocketbase";
import { AppContext } from "~/context/app-context";
import {
  playQuizFeedbackSound as playSound,
  triggerQuizConfetti as triggerConfetti,
} from "~/lib/quiz-feedback";

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

const FIXED_QUESTION_COUNTS: Record<string, number> = {
  "1": 10,
  "2": 20,
  "3": 30,
  "4": 40,
  "5": 50,
  mifune: 99,
  kano: 100,
};

const getQuestionCountForLevel = (danLevel: string, customCount: string) => {
  const fixedCount = FIXED_QUESTION_COUNTS[danLevel];
  if (fixedCount) return fixedCount;

  const parsedCount = Number.parseInt(customCount, 10);
  if (!Number.isFinite(parsedCount)) return 50;
  return Math.min(100, Math.max(1, parsedCount));
};

const normalizeDanLevel = (value: unknown) => {
  return String(value || "").match(/\d+/)?.[0] || "";
};

// Normalize string for search (strips accents, hyphens, punctuation)
const normalizeText = (str: string) => {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-'’_]/g, " ")
    .replace(/\s+/g, " ");
};

const getQuizImageUrl = (value: string) => {
  const image = (value || "").trim();
  if (!image) return "";
  if (/^(?:https?:|data:|blob:)/i.test(image)) return image;
  return `/media/${image.replace(/^\/?media\//i, "").replace(/^\/+/, "")}`;
};

// Fisher-Yates Shuffle algorithm for true uniform randomization of questions and options
const shuffleArray = <T,>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const DEFAULT_FALLBACK_QUESTIONS: Question[] = [
  {
    id: "f1",
    question:
      "Nel Nage-no-Kata, qual è la prima tecnica del gruppo Te-Waza (tecniche di braccia)?",
    options: ["Seoi Nage", "Uki Otoshi", "Kata Guruma", "Tai Otoshi"],
    correctAnswer: 2,
    explanation:
      "Uki Otoshi è la prima tecnica eseguita nel Nage-no-Kata e la prima del gruppo Te-Waza.",
    image_path: "uki-otoshi.webp",
    category: "Kata",
    dan_level: "1° Dan",
  },
  {
    id: "f2",
    question:
      'Cosa indica il termine "Kuzushi" nella teoria del Judo di Jigoro Kano?',
    options: [
      "Il caricamento",
      "Lo squilibrio dell'avversario",
      "La proiezione finale",
      "Il controllo a terra",
    ],
    correctAnswer: 2,
    explanation:
      "Kuzushi è lo squilibrio, la prima fase fondamentale di ogni tecnica di proiezione (Nage-Waza).",
    image_path: "kusushi.webp",
    category: "Principi",
    dan_level: "1° Dan",
  },
  {
    id: "f3",
    question: "Nel Katame-no-Kata, qual è la prima tecnica di Osaekomi-waza?",
    options: [
      "Kata Gatame",
      "Kesa Gatame (Hon Kesa Gatame)",
      "Kami Shiho Gatame",
      "Yoko Shiho Gatame",
    ],
    correctAnswer: 2,
    explanation:
      "Kesa Gatame (o Hon Kesa Gatame) è la prima immobilizzazione del Katame-no-Kata.",
    image_path: "kuzure-kesa-gatame.webp",
    category: "Kata",
    dan_level: "1° Dan",
  },
  {
    id: "f4",
    question:
      "Quale tra le seguenti proiezioni appartiene al primo gruppo (Dai-Ikkyo) del Go-Kyo no Waza?",
    options: ["Tai Otoshi", "De Ashi Barai", "Harai Goshi", "Tomoe Nage"],
    correctAnswer: 2,
    explanation:
      "De Ashi Barai è la primissima tecnica del Dai-Ikkyo nel Go-Kyo ufficiale.",
    image_path: "de-ashi-barai.webp",
    category: "Tecniche",
    dan_level: "1° Dan",
  },
  {
    id: "f5",
    question: "In quale anno Jigoro Kano fondò il Kodokan Judo a Tokyo?",
    options: ["1872", "1882", "1892", "1902"],
    correctAnswer: 2,
    explanation:
      "Il Kodokan è stato fondato nel febbraio 1882 presso il tempio Eisho-ji di Tokyo.",
    image_path: "kano_i.webp",
    category: "Storia",
    dan_level: "1° Dan",
  },
  {
    id: "f6",
    question: 'Cosa significa la massima del Judo "Seiryoku Zenyo"?',
    options: [
      "Tutti insieme per crescere",
      "Miglior uso dell'energia spirituale e fisica",
      "Cedevolezza vincente",
      "Vittoria senza sforzo",
    ],
    correctAnswer: 2,
    explanation:
      'Seiryoku Zenyo significa "Massimo risultato con il minimo sforzo" o miglior uso dell\'energia.',
    image_path: "kano_via.webp",
    category: "Principi",
    dan_level: "2° Dan",
  },
  {
    id: "f7",
    question:
      "Nel Kodokan Goshin Jutsu, come sono suddivise le 21 tecniche di difesa personale?",
    options: [
      "10 a mani nude, 11 con armi",
      "12 a mani nude, 9 con armi",
      "15 a mani nude, 6 con armi",
      "7 a mani nude, 14 con armi",
    ],
    correctAnswer: 2,
    explanation:
      "Il Goshin Jutsu comprende 12 tecniche contro attacchi a mani nude e 9 contro armi (bode, dagger, pistola).",
    image_path: "goshin-jutsu.webp",
    category: "Kata",
    dan_level: "3° Dan",
  },
  {
    id: "f8",
    question: "Che cos'è uno Shido nel regolamento arbitrale FIJLKAM / IJF?",
    options: [
      "La squalifica diretta",
      "Una sanzione per infrazione minore",
      "L'assegnazione di un punto",
      "La vittoria per Ippon",
    ],
    correctAnswer: 2,
    explanation:
      "Lo Shido è una sanzione disciplinare formale per scorrettezze o passività nel combattimento.",
    image_path: "shido.webp",
    category: "Regolamenti",
    dan_level: "1° Dan",
  },
];

export default component$(() => {
  const gameState = useSignal<"setup" | "playing" | "results">("setup");
  const settings = useStore<QuizSettings>({
    danLevel: "1",
    questionCount: "10",
    category: "mista",
  });
  const questions = useSignal<Question[]>([]);
  const currentIndex = useSignal(0);
  const answers = useStore<Record<number, number>>({});
  const score = useSignal(0);
  const consecutiveErrors = useSignal(0);
  const isHansokuMake = useSignal(false);
  const showFeedback = useSignal(false);
  const appState = useContext(AppContext);

  const allQuestions = useSignal<Question[]>(DEFAULT_FALLBACK_QUESTIONS);
  const searchQuery = useSignal("");
  const selectedQuestionModal = useSignal<Question | null>(null);
  const isSearchDrawerOpen = useSignal(false);
  const isCorrelatedModalOpen = useSignal(false);
  const selectedCategoryForCorrelated = useSignal("");
  const kanoHelpStep = useSignal<0 | 1 | 2>(0);

  const handleKanoHelpClick = $(() => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(25);
    }

    if (kanoHelpStep.value === 0) {
      // 1° Tocco: Attiva Kano Help ROSSO + attiva miniatura rimbalzante
      kanoHelpStep.value = 1;
      isSearchDrawerOpen.value = false;
    } else if (kanoHelpStep.value === 1) {
      // 2° Tocco: Apre il motore di ricerca
      kanoHelpStep.value = 2;
      isSearchDrawerOpen.value = true;
    } else {
      // 3° Tocco: Azzera e torna in modalità normale (OFF)
      kanoHelpStep.value = 0;
      isSearchDrawerOpen.value = false;
    }
  });

  const currentQuestion = useComputed$(() => {
    return questions.value[currentIndex.value] || null;
  });

  const correlatedQuestions = useComputed$(() => {
    const targetCat = (
      selectedCategoryForCorrelated.value ||
      currentQuestion.value?.category ||
      ""
    ).toLowerCase();
    if (!targetCat) return [];

    return allQuestions.value.filter((q) => {
      const qCat = (q.category || "").toLowerCase();
      const qDan = (q.dan_level || "").toLowerCase();
      return (
        q.id !== currentQuestion.value?.id &&
        (qCat.includes(targetCat) ||
          targetCat.includes(qCat) ||
          qDan.includes(targetCat))
      );
    });
  });

  useVisibleTask$(({ cleanup }) => {
    const handleOpenKano = () => {
      console.log(
        "[Quiz] open-kano-help event triggered from global top header!",
      );
      handleKanoHelpClick();
    };
    window.addEventListener("open-kano-help", handleOpenKano);
    cleanup(() => window.removeEventListener("open-kano-help", handleOpenKano));
  });

  useTask$(({ track }) => {
    track(() => gameState.value);
    track(() => kanoHelpStep.value);
    if (appState) {
      appState.isQuizPlaying = gameState.value === "playing";
      appState.kanoHelpStep =
        gameState.value === "playing" ? kanoHelpStep.value : 0;
      appState.hideNav = false;
    }
  });

  useVisibleTask$(async ({ track }) => {
    track(() => isSearchDrawerOpen.value);
    appState.sectionTitle = "Quiz Esame";
    appState.sectionIcon = "📝";

    if (allQuestions.value.length === 0 || isSearchDrawerOpen.value) {
      try {
        const records = await pb.collection("domande_quiz").getFullList({
          requestKey: null,
        });
        allQuestions.value = records.map((q: any) => ({
          id: q.id,
          question: q.domanda,
          options: [q.opzione_a, q.opzione_b, q.opzione_c, q.opzione_d],
          correctAnswer: q.risposta_corretta,
          explanation: q.spiegazione || "",
          image_path: q.immagine,
          category: q.categoria || "Generale",
          dan_level: q.livello_dan
            ? q.livello_dan.toString().includes("Dan")
              ? q.livello_dan
              : `${q.livello_dan}° Dan`
            : "1° Dan",
        }));
        console.log(
          "[Quiz KanoHelp] Preloaded questions:",
          allQuestions.value.length,
        );
      } catch (err) {
        console.error("[Quiz KanoHelp] Error loading questions:", err);
      }
    }
  });

  // Preload all questions for instant search

  const searchResults = useComputed$(() => {
    const rawQuery = searchQuery.value.trim();
    if (!rawQuery) return [];

    const normQuery = normalizeText(rawQuery);
    const tokens = normQuery.split(" ").filter((t) => t.length > 0);

    if (tokens.length === 0) return [];

    const scoredResults: Array<{ q: Question; score: number }> = [];

    for (const q of allQuestions.value) {
      const normDomanda = normalizeText(q.question);
      const normSpiegazione = normalizeText(q.explanation);
      const normCategoria = normalizeText(q.category);
      const normDan = normalizeText(
        q.dan_level.length === 1
          ? `${q.dan_level} dan shodan nidan sandan yodan godan`
          : q.dan_level,
      );
      const normOpzioni = q.options.map((opt) => normalizeText(opt));

      let matchCount = 0;
      let score = 0;

      for (const token of tokens) {
        let tokenMatched = false;

        // Title match (High priority)
        if (normDomanda.includes(token)) {
          tokenMatched = true;
          score += normDomanda.startsWith(token) ? 150 : 100;
        }

        // Correct answer match
        const correctOptText = normOpzioni[q.correctAnswer - 1] || "";
        if (correctOptText.includes(token)) {
          tokenMatched = true;
          score += 80;
        }

        // Other options match
        if (normOpzioni.some((o) => o.includes(token))) {
          tokenMatched = true;
          score += 40;
        }

        // Category / Dan level match
        if (normCategoria.includes(token) || normDan.includes(token)) {
          tokenMatched = true;
          score += 50;
        }

        // Explanation match
        if (normSpiegazione.includes(token)) {
          tokenMatched = true;
          score += 30;
        }

        if (tokenMatched) {
          matchCount++;
        }
      }

      // Require ALL tokens to match for multi-word queries (AND logic)
      // or at least matching most tokens if query is long
      if (
        matchCount === tokens.length ||
        (tokens.length > 2 && matchCount >= tokens.length - 1)
      ) {
        scoredResults.push({ q, score });
      }
    }

    // Sort by highest relevance score
    return scoredResults
      .sort((a, b) => b.score - a.score)
      .map((item) => item.q);
  });

  const handleStart = $(async () => {
    try {
      let records: any[] = [];
      try {
        records = await pb
          .collection("domande_quiz")
          .getFullList({ requestKey: null });
      } catch (err) {
        console.error("Error fetching questions from PB:", err);
      }

      if (!records || records.length === 0) {
        const preloadedQuestions = allQuestions.value;
        const hasCompletePreloadedPool =
          preloadedQuestions.length > DEFAULT_FALLBACK_QUESTIONS.length;

        if (hasCompletePreloadedPool) {
          records = preloadedQuestions;
        } else {
          alert(
            "Impossibile caricare le domande del quiz. Verifica la connessione e riprova.",
          );
          return;
        }
      }

      const targetCount = getQuestionCountForLevel(
        settings.danLevel,
        settings.questionCount,
      );

      // Prefer the selected Dan, then fill from the other available levels.
      let filtered = records;

      if (
        settings.danLevel !== "musashi" &&
        settings.danLevel !== "mifune" &&
        settings.danLevel !== "kano"
      ) {
        const targetDan = normalizeDanLevel(settings.danLevel);
        filtered = filtered.filter((q: any) => {
          const questionDan = normalizeDanLevel(
            q.livello_dan || q.dan_level,
          );
          return questionDan === targetDan;
        });
      }

      if (settings.category !== "mista" && settings.category !== "generale") {
        filtered = filtered.filter((q: any) => {
          const c = (q.categoria || q.category || "").toString().toLowerCase();
          const target = settings.category.toLowerCase();
          return c.includes(target) || target.includes(c);
        });
      }

      const preferredQuestions = shuffleArray(filtered || []);
      const preferredRecords = new Set(filtered || []);
      const otherQuestions = shuffleArray(
        records.filter((question) => !preferredRecords.has(question)),
      );
      const shuffledPool = [...preferredQuestions, ...otherQuestions];

      if (shuffledPool.length < targetCount) {
        alert(
          `Sono disponibili solo ${shuffledPool.length} domande, ma ne hai richieste ${targetCount}.`,
        );
        return;
      }

      const selectedQuestions = shuffledPool
        .slice(0, targetCount)
        .map((q: any) => {
          const rawOpts = q.options || [
            q.opzione_a,
            q.opzione_b,
            q.opzione_c,
            q.opzione_d,
          ];
          const safeRaw =
            Array.isArray(rawOpts) && rawOpts.length >= 4
              ? rawOpts.map((o, idx) =>
                  String(o || `Opzione ${["A", "B", "C", "D"][idx]}`),
                )
              : ["Opzione A", "Opzione B", "Opzione C", "Opzione D"];

          const rawCorrectIdx =
            (typeof q.risposta_corretta === "number"
              ? q.risposta_corretta
              : parseInt(q.risposta_corretta || q.correctAnswer) || 1) - 1;

          // Pair each option text with its correctness status
          const pairedOpts = safeRaw.map((text, idx) => ({
            text,
            isCorrect: idx === rawCorrectIdx,
          }));

          // Fisher-Yates shuffle the options for high variance
          const shuffledPaired = shuffleArray(pairedOpts);
          const safeOpts = shuffledPaired.map((p) => p.text);
          const newCorrectAnswer = Math.max(
            1,
            shuffledPaired.findIndex((p) => p.isCorrect) + 1,
          );

          return {
            id: q.id || String(Math.random()),
            question: q.domanda || q.question || "Domanda di esame Judo",
            options: safeOpts,
            correctAnswer: newCorrectAnswer,
            explanation: q.spiegazione || q.explanation || "",
            image_path: q.immagine || q.image_path || "",
            category: q.categoria || q.category || "Generale",
            dan_level: (q.livello_dan || q.dan_level || "1").toString(),
          };
        });

      questions.value = selectedQuestions;
      gameState.value = "playing";
      currentIndex.value = 0;
      Object.keys(answers).forEach((key) => delete answers[Number(key)]);
      score.value = 0;
      consecutiveErrors.value = 0;
      isHansokuMake.value = false;
      showFeedback.value = false;
      console.log(
        "[Quiz] Started quiz successfully with",
        selectedQuestions.length,
        "questions",
      );
    } catch (e) {
      console.error("[Quiz handleStart error]", e);
      alert("Errore nell'avvio del quiz. Riprova.");
    }
  });

  const handleAnswer = $((optionIndex: number) => {
    if (showFeedback.value) return; // Prevent changing answer after selection

    const selectedAnswer = optionIndex + 1;
    answers[currentIndex.value] = selectedAnswer;
    showFeedback.value = true;

    const currentQ = questions.value[currentIndex.value];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;

    if (isCorrect) {
      score.value++;
      consecutiveErrors.value = 0;
      triggerConfetti();
      playSound("correct");
    } else {
      consecutiveErrors.value++;
      playSound("wrong");
    }
  });

  const nextQuestion = $(() => {
    if (!showFeedback.value) return; // Must select an answer

    const userAns = answers[currentIndex.value];
    const currentQ = questions.value[currentIndex.value];
    const isCorrect = userAns === currentQ.correctAnswer;

    const nextErrors = isCorrect ? 0 : consecutiveErrors.value;

    if (nextErrors >= 3) {
      isHansokuMake.value = true;
      gameState.value = "results";
      return;
    }

    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++;
      showFeedback.value = false;
    } else {
      gameState.value = "results";
    }
  });

  const gradeResult = useComputed$(() => {
    if (isHansokuMake.value) {
      return {
        text: "HANSOKU-MAKE",
        score: "Squalifica",
        color: "text-red-600",
        msg: "Preparazione insufficiente!",
      };
    }

    const percentage = Math.round((score.value / questions.value.length) * 100);
    if (percentage === 100) {
      return {
        text: "IPPON",
        color: "text-yellow-500",
        msg: "Prestazione perfetta!",
      };
    }
    if (percentage >= 70) {
      return {
        text: "WAZA-ARI",
        color: "text-blue-600",
        msg: "Buona prestazione!",
      };
    }
    if (percentage >= 50) {
      return {
        text: "YUKO",
        color: "text-green-600",
        msg: "Prestazione sufficiente",
      };
    }
    if (percentage >= 30) {
      return {
        text: "SHIDO",
        color: "text-orange-500",
        msg: "Devi studiare di più",
      };
    }
    return {
      text: "HANSOKU-MAKE",
      color: "text-red-600",
      msg: "Preparazione insufficiente!",
    };
  });

  return (
    <div class="max-w-xl mx-auto px-3 py-2 md:py-4">
      {/* SETUP SCREEN */}
      {gameState.value === "setup" && (
        <>
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
            <div class="text-center mb-4">
              <img
                src="/media/mifune_sorride.webp"
                alt="Kyuzo Mifune"
                class="w-20 sm:w-24 h-auto object-contain mx-auto mb-2 drop-shadow-md"
                width={96}
                height={96}
              />
              <h1 class="text-xl sm:text-2xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-1">
                Preparazione Esame
              </h1>
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 m-0">
                Seleziona il tuo livello e mettiti alla prova
              </p>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                  Livello Dan
                </label>
                <select
                  value={settings.danLevel}
                  onChange$={(e) => {
                    const val = (e.target as HTMLSelectElement).value;
                    settings.danLevel = val;
                    settings.questionCount = String(
                      FIXED_QUESTION_COUNTS[val] || 50,
                    );
                  }}
                  class="w-full py-2.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-red-500 focus:bg-white dark:focus:bg-black transition-all font-bold text-sm sm:text-base outline-none"
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

              {settings.danLevel === "musashi" ? (
                <div>
                  <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                    Numero Domande:{" "}
                    <span class="text-red-500 font-extrabold">
                      {settings.questionCount}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={settings.questionCount}
                    onInput$={(e) => {
                      settings.questionCount = (
                        e.target as HTMLInputElement
                      ).value;
                    }}
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>
              ) : (
                <div>
                  <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                    Numero Domande
                  </label>
                  <div class="w-full py-2.5 px-3 rounded-lg bg-gray-100 dark:bg-gray-700/60 font-bold text-sm text-gray-600 dark:text-gray-300 cursor-not-allowed">
                    {settings.questionCount} Domande
                  </div>
                </div>
              )}

              <button
                onClick$={handleStart}
                class="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-black text-base shadow-md shadow-red-500/20 pressable transition-all duration-200 mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🚀 INIZIA QUIZ</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* GAME SCREEN */}
      {gameState.value === "playing" && currentQuestion.value && (
        <div class="animate-in slide-in-from-right duration-300">
          {/* Inline Header & Progress Bar */}
          <div class="flex items-center gap-3 mb-3">
            <div class="shrink-0 flex items-baseline gap-1">
              <span class="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                DOMANDA
              </span>
              <div class="text-xl font-black text-gray-800 dark:text-white leading-none">
                <span class="text-red-600">{currentIndex.value + 1}</span>
                <span class="text-xs text-gray-400 mx-0.5">/</span>
                <span class="text-gray-400 text-base">
                  {questions.value.length}
                </span>
              </div>
            </div>

            {/* Inline Progress Bar */}
            <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700/80 rounded-full overflow-hidden">
              <div
                class="h-full bg-red-600 transition-all duration-500 ease-out rounded-full"
                style={{
                  width: `${((currentIndex.value + 1) / questions.value.length) * 100}%`,
                }}
              />
            </div>

            {consecutiveErrors.value > 0 && (
              <div class="text-[11px] font-bold text-red-500 animate-pulse shrink-0">
                {consecutiveErrors.value} errori!
              </div>
            )}
          </div>

          {/* Question Card */}
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-3 md:p-6 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            {/* Question Text */}
            <h2 class="text-lg md:text-xl font-bold text-gray-800 dark:text-white mb-3.5 leading-snug">
              {currentQuestion.value.question}
            </h2>

            {/* Image if exists */}
            {currentQuestion.value.image_path &&
              typeof currentQuestion.value.image_path === "string" && (
                <div class="mb-3 md:mb-4 rounded-xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50 flex justify-center">
                  <img
                    src={getQuizImageUrl(currentQuestion.value.image_path)}
                    alt="Domanda"
                    class="max-h-[10.2rem] h-auto w-auto max-w-full object-contain"
                    onError$={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")
                    }
                  />
                </div>
              )}

            {/* Options */}
            <div class="space-y-1.5 md:space-y-2">
              {currentQuestion.value.options.map((opt, idx) => {
                const optionNum = idx + 1;
                const isSelected = answers[currentIndex.value] === optionNum;
                const isCorrectAnswer =
                  currentQuestion.value.correctAnswer === optionNum;
                const hasAnswered = showFeedback.value;

                let buttonStyle =
                  "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer";
                let badgeStyle =
                  "bg-gray-200 dark:bg-gray-700 text-gray-500 group-hover:bg-red-500 group-hover:text-white";
                let badgeText: string = ["A", "B", "C", "D"][idx];

                if (hasAnswered) {
                  if (isCorrectAnswer) {
                    buttonStyle =
                      "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-bold shadow-sm scale-[1.005]";
                    badgeStyle = "bg-green-500 text-white font-black text-sm";
                    badgeText = "✓";
                  } else if (isSelected) {
                    buttonStyle =
                      "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 font-bold shadow-sm";
                    badgeStyle = "bg-red-500 text-white font-black text-sm";
                    badgeText = "✕";
                  } else {
                    buttonStyle =
                      "border-transparent bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed";
                    badgeStyle =
                      "bg-gray-200/50 dark:bg-gray-800/50 text-gray-400";
                  }
                }

                return (
                  <div key={idx} class="relative w-full flex items-center">
                    <button
                      onClick$={() => {
                        if (
                          typeof window !== "undefined" &&
                          "vibrate" in navigator
                        ) {
                          navigator.vibrate(15);
                        }
                        handleAnswer(idx);
                      }}
                      disabled={hasAnswered}
                      class={`w-full py-2 px-3 md:py-2.5 md:px-3.5 text-left rounded-xl border-2 transition-all duration-200 flex items-center justify-between gap-2.5 md:gap-3 group ${buttonStyle}`}
                    >
                      <div class="flex items-center gap-3 flex-1 pr-2">
                        <div
                          class={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${badgeStyle}`}
                        >
                          {badgeText}
                        </div>
                        <span class="font-medium text-[0.7rem] md:text-[0.8rem] leading-tight">
                          {opt}
                        </span>
                      </div>

                      {/* Bouncing Kano Thumbnail next to Correct Answer Choice (Only on 1° or 2° Tocco) */}
                      {kanoHelpStep.value > 0 && isCorrectAnswer && (
                        <div
                          onClick$={(e) => {
                            e.stopPropagation();
                            if (
                              typeof window !== "undefined" &&
                              "vibrate" in navigator
                            ) {
                              navigator.vibrate([20, 50, 20]);
                            }
                            selectedCategoryForCorrelated.value =
                              currentQuestion.value.category || "Generale";
                            isCorrelatedModalOpen.value = true;
                          }}
                          class="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white pl-1.5 pr-2.5 py-1 rounded-full shadow-md animate-bounce hover:scale-105 cursor-pointer border border-white/40 transition-transform"
                          title="Aiuto Kano: Clicca per vedere tutte le domande correlate!"
                        >
                          <img
                            src="/media/kano_i.webp"
                            alt="Kano Tips!"
                            class="w-6 h-6 rounded-full object-cover border border-white shrink-0"
                            width={24}
                            height={24}
                          />
                          <span class="text-[10px] font-black uppercase tracking-tight whitespace-nowrap">
                            Kano Tips!
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Explanation box when answered */}
            {showFeedback.value && currentQuestion.value.explanation && (
              <div class="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 animate-in fade-in duration-300">
                <div class="font-bold text-blue-800 dark:text-blue-300 mb-0.5 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <span>💡</span> Spiegazione:
                </div>
                <div
                  class="text-blue-900 dark:text-blue-200 text-xs md:text-sm leading-snug [&>p]:mb-1 [&>p:last-child]:mb-0"
                  dangerouslySetInnerHTML={currentQuestion.value.explanation}
                />
              </div>
            )}
          </div>

          {/* Centered Bottom Action Bar */}
          <div class="mt-2.5 md:mt-3.5 flex justify-center items-center w-full">
            <button
              onClick$={nextQuestion}
              disabled={!showFeedback.value}
              class={`w-full max-w-md py-2.5 md:py-3 px-6 rounded-xl font-black text-sm md:text-base shadow-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                showFeedback.value
                  ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white hover:scale-[1.01] active:scale-95 cursor-pointer shadow-red-500/25"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-300/30 dark:border-gray-700/50"
              }`}
            >
              <span>
                {currentIndex.value === questions.value.length - 1
                  ? "Termina Quiz"
                  : "Prossima Domanda"}
              </span>
              <span class="text-lg">→</span>
            </button>
          </div>
        </div>
      )}

      {/* RESULTS SCREEN */}
      {gameState.value === "results" && (
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700 text-center animate-in zoom-in-95 duration-500">
          <div class="inline-block p-4 rounded-full bg-gray-50 dark:bg-gray-900 mb-6 relative">
            <span class="text-6xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {gradeResult.value.text === "IPPON"
                ? "🏆"
                : gradeResult.value.text === "HANSOKU-MAKE"
                  ? "🛑"
                  : "🥋"}
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
                  377 -
                  (377 * (isHansokuMake.value ? 0 : score.value)) /
                    questions.value.length
                }
                class={gradeResult.value.color}
              />
            </svg>
          </div>

          <h2
            class={`text-4xl md:text-5xl font-black mb-2 ${gradeResult.value.color}`}
          >
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
                <span class="text-gray-400 text-base">
                  /{questions.value.length}
                </span>
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
                gameState.value = "setup";
              }}
              class="w-full py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-lg shadow-lg hover:transform hover:scale-105 transition-all"
            >
              🔄 Nuovo Test
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

      {/* QUESTION DETAIL MODAL FOR SEARCH TOOL */}
      {selectedQuestionModal.value && (
        <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick$={() => (selectedQuestionModal.value = null)}
              class="absolute top-5 right-5 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-lg transition-colors"
            >
              ✕
            </button>

            {/* Header tags */}
            <div class="flex items-center gap-2 mb-4 pr-12">
              <span class="text-xs px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-black">
                {selectedQuestionModal.value.dan_level.length === 1
                  ? `${selectedQuestionModal.value.dan_level}° Dan`
                  : selectedQuestionModal.value.dan_level}
              </span>
              <span class="text-xs px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold">
                {selectedQuestionModal.value.category}
              </span>
            </div>

            {/* Question */}
            <h3 class="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-6 leading-relaxed">
              {selectedQuestionModal.value.question}
            </h3>

            {/* Image if present */}
            {selectedQuestionModal.value.image_path && (
              <div class="mb-6 rounded-xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50 flex justify-center">
                <img
                  src={getQuizImageUrl(selectedQuestionModal.value.image_path)}
                  alt="Domanda"
                  class="max-h-64 object-contain"
                  onError$={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              </div>
            )}

            {/* Options list with correct answer highlighted */}
            <div class="space-y-3 mb-6">
              {selectedQuestionModal.value.options.map((opt, idx) => {
                const isCorrect =
                  selectedQuestionModal.value!.correctAnswer === idx + 1;
                return (
                  <div
                    key={idx}
                    class={`p-4 rounded-2xl border-2 flex items-start gap-4 transition-all ${
                      isCorrect
                        ? "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-900 dark:text-green-200 font-bold shadow-md scale-[1.01]"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 opacity-60"
                    }`}
                  >
                    <div
                      class={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isCorrect
                          ? "bg-green-500 text-white font-black"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                      }`}
                    >
                      {isCorrect ? "✓" : ["A", "B", "C", "D"][idx]}
                    </div>
                    <div class="flex-1 pt-0.5">
                      <span class="text-base font-medium">{opt}</span>
                      {isCorrect && (
                        <span class="ml-2 text-xs uppercase tracking-wider font-extrabold text-green-600 dark:text-green-400 bg-green-200/60 dark:bg-green-900/60 px-2 py-0.5 rounded">
                          ✓ Risposta Corretta
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {selectedQuestionModal.value.explanation && (
              <div class="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 mb-6">
                <div class="font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <span>💡</span> Spiegazione:
                </div>
                <div
                  class="text-blue-900 dark:text-blue-200 text-base leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0"
                  dangerouslySetInnerHTML={
                    selectedQuestionModal.value.explanation
                  }
                />
              </div>
            )}

            {/* Action buttons */}
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                onClick$={() => {
                  selectedQuestionModal.value = null;
                  isSearchDrawerOpen.value = true;
                }}
                class="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
              >
                <span>🔍</span> Torna alla Ricerca
              </button>
              <button
                onClick$={() => (selectedQuestionModal.value = null)}
                class="flex-1 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-base shadow-lg hover:opacity-90 transition-opacity"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP-RIGHT DROP-DOWN DRAWER SEARCH TOOL */}
      {isSearchDrawerOpen.value && (
        <div class="fixed inset-0 z-50 flex justify-end items-start bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop click to close */}
          <div
            class="absolute inset-0"
            onClick$={() => (isSearchDrawerOpen.value = false)}
          />

          {/* Drawer Container (Drops down from top) */}
          <div class="relative w-full max-w-md bg-white dark:bg-gray-800 max-h-[88vh] rounded-b-3xl p-6 shadow-2xl flex flex-col border-b border-l border-r border-gray-200 dark:border-gray-700 animate-in slide-in-from-top duration-300 z-10">
            {/* Header */}
            <div class="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-xl shrink-0 overflow-hidden border border-red-200 dark:border-red-800">
                  <img
                    src="/media/kano_i.webp"
                    alt="Jigoro Kano"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 class="text-lg font-black text-gray-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>Aiuto Kano</span>
                    <span class="text-xs px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 font-extrabold">
                      ❗
                    </span>
                  </h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Cerca per parola chiave e scopri le risposte
                  </p>
                </div>
              </div>
              <button
                onClick$={() => (isSearchDrawerOpen.value = false)}
                class="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center font-bold text-base transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Input Search */}
            <div class="relative mb-3 shrink-0">
              <input
                type="text"
                placeholder="Cerca parola chiave (es. Kata, IJF, Kano...)"
                value={searchQuery.value}
                onInput$={(e) => {
                  searchQuery.value = (e.target as HTMLInputElement).value;
                }}
                class="w-full p-3.5 pl-10 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 focus:border-red-500 outline-none text-sm font-medium text-gray-800 dark:text-white transition-all shadow-inner"
              />
              <span class="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                🔍
              </span>
              {searchQuery.value && (
                <button
                  onClick$={() => (searchQuery.value = "")}
                  class="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold bg-gray-200 dark:bg-gray-700 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Filter Chips */}
            <div class="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 shrink-0 scrollbar-none">
              {[
                "1° Dan",
                "2° Dan",
                "3° Dan",
                "Kata",
                "Storia",
                "Regolamenti",
                "Goshin Jutsu",
                "Nage-no-Kata",
                "Katame-no-Kata",
              ].map((tag) => (
                <button
                  key={tag}
                  onClick$={() => (searchQuery.value = tag)}
                  class={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-all border ${
                    searchQuery.value.toLowerCase() === tag.toLowerCase()
                      ? "bg-red-600 text-white border-red-600 shadow-xs"
                      : "bg-gray-100 dark:bg-gray-700/60 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-gray-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Listbox Results */}
            <div class="flex-1 overflow-y-auto space-y-2 pr-1">
              {searchResults.value.length > 0 ? (
                <>
                  <div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Risultati ({searchResults.value.length})
                  </div>
                  {searchResults.value.map((q) => (
                    <div
                      key={q.id}
                      onClick$={() => {
                        selectedQuestionModal.value = q;
                        isSearchDrawerOpen.value = false;
                      }}
                      class="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/80 hover:bg-red-50 dark:hover:bg-red-950/40 border border-gray-200/70 dark:border-gray-700/70 hover:border-red-400 dark:hover:border-red-500 transition-all cursor-pointer flex justify-between items-center group shadow-xs"
                    >
                      <div class="flex-1 pr-3">
                        <div class="flex items-center gap-1.5 mb-1">
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-extrabold">
                            {q.dan_level.length === 1
                              ? `${q.dan_level}° Dan`
                              : q.dan_level}
                          </span>
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                            {q.category}
                          </span>
                        </div>
                        <div class="font-bold text-gray-800 dark:text-gray-100 text-xs leading-snug">
                          {q.question}
                        </div>
                      </div>
                      <div class="text-[11px] font-black text-red-600 dark:text-red-400 group-hover:translate-x-0.5 transition-transform flex items-center shrink-0 bg-red-100/60 dark:bg-red-900/30 px-2 py-1.5 rounded-lg">
                        Vedi →
                      </div>
                    </div>
                  ))}
                </>
              ) : searchQuery.value.trim() !== "" ? (
                <div class="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <div class="text-3xl mb-2">🔎</div>
                  <p class="text-gray-500 dark:text-gray-400 font-medium text-xs">
                    Nessun risultato per "{searchQuery.value}"
                  </p>
                </div>
              ) : (
                <div class="text-center py-12 text-gray-400">
                  <div class="text-4xl mb-3 opacity-60">💡</div>
                  <p class="text-xs font-medium max-w-xs mx-auto">
                    Digita una parola chiave qui sopra per cercare tra tutte le
                    100 domande e le relative risposte corrette.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CORRELATED QUESTIONS MODAL (CONTEXTUAL AIUTO KANO) */}
      {isCorrelatedModalOpen.value && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div class="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div class="p-4 md:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-red-600 to-orange-600 text-white">
              <div class="flex items-center gap-3">
                <img
                  src="/media/kano_i.webp"
                  alt="Jigoro Kano"
                  class="w-10 h-10 rounded-full object-cover border-2 border-white shadow shrink-0"
                  width={40}
                  height={40}
                />
                <div>
                  <h3 class="font-extrabold text-base md:text-lg leading-tight flex items-center gap-1.5">
                    <span>Domande Correlate di Kano</span>
                    <span class="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-extrabold">
                      {selectedCategoryForCorrelated.value ||
                        currentQuestion.value?.category}
                    </span>
                  </h3>
                  <p class="text-xs text-white/80">
                    Studio approfondito dei quesiti sullo stesso argomento
                  </p>
                </div>
              </div>
              <button
                onClick$={() => (isCorrelatedModalOpen.value = false)}
                class="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-base transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Correlated List */}
            <div class="flex-1 overflow-y-auto p-4 space-y-3">
              {correlatedQuestions.value.length > 0 ? (
                correlatedQuestions.value.map((q) => (
                  <div
                    key={q.id}
                    class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/90 border border-gray-200/80 dark:border-gray-700 shadow-xs"
                  >
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                        {q.dan_level}
                      </span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {q.category}
                      </span>
                    </div>

                    <div class="font-bold text-sm md:text-base text-gray-900 dark:text-white mb-2 leading-snug">
                      {q.question}
                    </div>

                    {/* Options list */}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2.5">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctAnswer === oIdx + 1;
                        return (
                          <div
                            key={oIdx}
                            class={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                              isCorrect
                                ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-400 font-bold"
                                : "bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-transparent opacity-75"
                            }`}
                          >
                            {["A", "B", "C", "D"][oIdx]}: {opt}{" "}
                            {isCorrect ? "✓" : ""}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div class="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 leading-snug">
                        <strong class="text-blue-800 dark:text-blue-300">
                          💡 Spiegazione:
                        </strong>{" "}
                        <span dangerouslySetInnerHTML={q.explanation} />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div class="text-center py-12 text-gray-400">
                  <div class="text-4xl mb-2">🥋</div>
                  <p class="text-sm font-medium">
                    Nessun'altra domanda correlata per questo argomento.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Quiz Esame - JudoOK",
  meta: [
    {
      name: "description",
      content:
        "Mettiti alla prova con il quiz di preparazione agli esami di judo. Domande per tutti i livelli Dan.",
    },
  ],
};
