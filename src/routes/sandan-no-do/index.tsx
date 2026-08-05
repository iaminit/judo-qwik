import {
  $,
  component$,
  useComputed$,
  useContext,
  useSignal,
  useStylesScoped$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AppContext } from "~/context/app-context";
import { pb } from "~/lib/pocketbase";
import styles from "./styles.css?inline";
import fs from "node:fs";
import path from "node:path";

type ResourceKind = "dizionario" | "tecnica" | "kata";

interface SandanResource {
  id: string;
  kind: ResourceKind;
  title: string;
  secondaryTitle: string;
  slug: string;
  summary: string;
  content: string;
  imageUrl: string;
  audioUrl: string;
  videoUrl: string;
}

interface SandanData {
  resources: SandanResource[];
  questions: SandanQuizQuestion[];
  error?: string;
}

interface SandanQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  danLevel: string;
  imageUrl: string;
}

interface Activity {
  id: string;
  title: string;
  group: string;
  summary: string;
  concepts: string[];
  kind?: ResourceKind;
}

interface JourneyModule {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  image: string;
  activities: Activity[];
}

type ActivityResult = "correct" | "error";
type ActivityResults = Record<string, ActivityResult>;

interface QuizAttempt {
  questionIds: string[];
  selectedOptions: Record<string, number>;
}

type QuizProgress = Record<string, QuizAttempt>;

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("it")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const activity = (
  id: string,
  title: string,
  group: string,
  summary: string,
  concepts: string[] = [title],
  kind?: ResourceKind,
): Activity => ({ id, title, group, summary, concepts, kind });

const FOUNDATION_ACTIVITIES: Activity[] = [
  activity(
    "fondamenti-storia",
    "Storia e filosofia del Judo",
    "Fondamenti",
    "Origini, principi educativi e significato della Via.",
    ["Judo", "Budo", "Do"],
    "dizionario",
  ),
  activity(
    "fondamenti-federazione",
    "Organizzazione federale",
    "Fondamenti",
    "Struttura, ruoli e attività della FIJLKAM.",
    ["Dan"],
    "dizionario",
  ),
  activity(
    "fondamenti-termini-arbitrali",
    "Termini arbitrali",
    "Arbitraggio",
    "Lessico essenziale usato durante gara ed esame.",
    ["Hajime", "Matte", "Ippon"],
    "dizionario",
  ),
  activity(
    "fondamenti-gesti-arbitrali",
    "Gesti arbitrali",
    "Arbitraggio",
    "Riconoscere e spiegare i principali segnali dell’arbitro.",
    ["Rei"],
    "dizionario",
  ),
  activity(
    "fondamenti-regolamento",
    "Regolamento",
    "Arbitraggio",
    "Principi di sicurezza, punteggio e condotta di gara.",
    ["Hansoku Make", "Shido"],
    "dizionario",
  ),
  activity(
    "fondamenti-etica",
    "Etica e comportamento nel dojo",
    "Fondamenti",
    "Rispetto, saluto e responsabilità del judoka.",
    ["Dojo", "Rei"],
    "dizionario",
  ),
];

const KATA_ACTIVITIES: Activity[] = [
  activity(
    "kata-nage",
    "Nage-no Kata",
    "Prerequisiti",
    "Consolidare le competenze richieste nei gradi precedenti.",
    ["Nage-no Kata"],
    "kata",
  ),
  activity(
    "kata-katame",
    "Katame-no-Kata",
    "Prerequisiti",
    "Consolidare la forma delle tecniche di controllo.",
    ["Katame-no-Kata"],
    "kata",
  ),
  activity(
    "kata-goshin",
    "Kodokan Goshin Jutsu",
    "Programma 3° Dan",
    "Studiare ed eseguire la forma moderna di autodifesa.",
    ["Kodokan Goshin Jutsu"],
    "kata",
  ),
  activity(
    "kata-ju",
    "Ju-no-Kata",
    "Programma 3° Dan",
    "Studiare i quindici movimenti della forma della cedevolezza.",
    ["Ju-no-Kata"],
    "kata",
  ),
];

const NAGE_ACTIVITIES: Activity[] = [
  activity(
    "nage-seoi",
    "Seoi Nage: Ippon, Morote ed Eri",
    "Te Waza",
    "Eseguire le tre varianti fondamentali in statica e movimento.",
    ["Seoi Nage"],
    "tecnica",
  ),
  activity(
    "nage-tai-otoshi",
    "Tai Otoshi",
    "Te Waza",
    "Controllo dello squilibrio e direzione della proiezione.",
    ["Tai Otoshi"],
    "tecnica",
  ),
  activity(
    "nage-kata-guruma",
    "Kata Guruma",
    "Te Waza",
    "Entrata, caricamento e controllo della caduta.",
    ["Kata Guruma"],
    "tecnica",
  ),
  activity(
    "nage-sukui",
    "Sukui Nage",
    "Te Waza",
    "Applicazione della tecnica del quarto gruppo del Gokyo.",
    ["Sukui Nage"],
    "tecnica",
  ),
  activity(
    "nage-uki-otoshi",
    "Uki Otoshi",
    "Te Waza",
    "Uso preciso del kuzushi senza blocco della gamba.",
    ["Uki Otoshi"],
    "tecnica",
  ),
  ...[
    "Uki Goshi",
    "O Goshi",
    "Uchi Mata",
    "Harai Goshi",
    "Koshi Guruma",
    "Tsurikomi Goshi",
    "Tsuri Goshi",
    "Hane Goshi",
    "Utsuri Goshi",
  ].map((name) =>
    activity(
      `nage-${normalize(name).replace(/ /g, "-")}`,
      name,
      "Koshi Waza",
      "Tecnica d’anca: esecuzione in statica, movimento e applicazione.",
      [name],
      "tecnica",
    ),
  ),
  ...[
    "De Ashi Barai",
    "Okuri Ashi Barai",
    "O Soto Gari",
    "O Uchi Gari",
    "Sasae Tsurikomi Ashi",
    "Hiza Guruma",
    "Ko Soto Gari",
    "Ko Uchi Gari",
    "Ko Soto Gake",
    "Ashi Guruma",
    "Harai Tsurikomi Ashi",
    "O Guruma",
  ].map((name) =>
    activity(
      `nage-${normalize(name).replace(/ /g, "-")}`,
      name,
      "Ashi Waza",
      "Tecnica di gamba: tempo, direzione e continuità dell’azione.",
      [name],
      "tecnica",
    ),
  ),
  ...[
    "Tomoe Nage",
    "Yoko Otoshi",
    "Sumi Gaeshi",
    "Tani Otoshi",
    "Yoko Tomoe Nage",
  ].map((name) =>
    activity(
      `nage-${normalize(name).replace(/ /g, "-")}`,
      name,
      "Sutemi Waza",
      "Tecnica di sacrificio con controllo completo di Uke.",
      [name],
      "tecnica",
    ),
  ),
  ...["Hane Makikomi", "Soto Makikomi"].map((name) =>
    activity(
      `nage-${normalize(name).replace(/ /g, "-")}`,
      name,
      "Makikomi Waza",
      "Avvolgimento, sicurezza e controllo della proiezione.",
      [name],
      "tecnica",
    ),
  ),
  activity(
    "nage-renraku",
    "Renraku Waza",
    "Applicazioni",
    "Collegare due tecniche mantenendo iniziativa e continuità.",
    ["Renraku Waza"],
    "dizionario",
  ),
  activity(
    "nage-gaeshi",
    "Gaeshi Waza",
    "Applicazioni",
    "Riconoscere l’attacco e applicare il contrattacco adeguato.",
    ["Gaeshi", "Go no Sen"],
    "dizionario",
  ),
  activity(
    "nage-difese",
    "Difese e Bogyoho",
    "Applicazioni",
    "Difese attive, postura e gestione della presa.",
    ["Bogyoho", "Shintai"],
    "dizionario",
  ),
];

const KATAME_ACTIVITIES: Activity[] = [
  ...[
    "Kesa Gatame",
    "Yoko Shiho Gatame",
    "Kami Shiho Gatame",
    "Tate Shiho Gatame",
    "Ushiro Kesa Gatame",
    "Kata Gatame",
    "Makura Kesa Gatame",
    "Sankaku Gatame",
  ].map((name) =>
    activity(
      `katame-${normalize(name).replace(/ /g, "-")}`,
      name,
      "Osae Waza",
      "Immobilizzazione, controllo e principali vie d’uscita.",
      [name],
      "tecnica",
    ),
  ),
  activity(
    "katame-kuzure",
    "Forme Kuzure",
    "Osae Waza",
    "Studiare le principali varianti delle immobilizzazioni.",
    ["Kuzure"],
    "dizionario",
  ),
  ...[
    "Kata Juji Jime",
    "Nami Juji Jime",
    "Gyaku Juji Jime",
    "Hadaka Jime",
    "Okuri Eri Jime",
    "Kata Ha Jime",
    "Ryo Te Jime",
    "Sankaku Jime",
    "Tsukkomi Jime",
  ].map((name) =>
    activity(
      `katame-${normalize(name).replace(/ /g, "-")}`,
      name,
      "Shime Waza",
      "Strangolamento: controllo, sicurezza e resa immediata.",
      [name],
      "tecnica",
    ),
  ),
  ...[
    "Ude Garami",
    "Ude Hishigi Juji Gatame",
    "Ude Hishigi Ude Gatame",
    "Ude Hishigi Waki Gatame",
    "Ude Hishigi Hara Gatame",
    "Ude Hishigi Hiza Gatame",
    "Sankaku Gatame",
  ].map((name) =>
    activity(
      `katame-${normalize(name).replace(/ /g, "-")}`,
      name,
      "Kansetsu Waza",
      "Leva articolare: posizione, controllo e sicurezza.",
      [name],
      "tecnica",
    ),
  ),
  activity(
    "katame-hairi",
    "Hairi Kata",
    "Applicazioni",
    "Entrate e transizioni efficaci verso il Ne Waza.",
    ["Hairi Kata"],
    "dizionario",
  ),
  activity(
    "katame-renraku",
    "Renraku Waza a terra",
    "Applicazioni",
    "Collegare controlli, strangolamenti e leve.",
    ["Renraku Waza"],
    "dizionario",
  ),
  activity(
    "katame-gaeshi",
    "Gaeshi e Fusegi",
    "Applicazioni",
    "Rovesciamenti, difese ed evasione nel Ne Waza.",
    ["Gaeshi", "Fusegi"],
    "dizionario",
  ),
];

const JOURNEY_MODULES: JourneyModule[] = [
  {
    id: "fondamenta",
    number: "1",
    title: "Fondamenta",
    subtitle: "Storia, filosofia, federazione e arbitraggio",
    image: "/media/home/dizionario.webp",
    activities: FOUNDATION_ACTIVITIES,
  },
  {
    id: "kata",
    number: "2",
    title: "Kata",
    subtitle: "Kodokan Goshin Jutsu e Ju-no-Kata",
    image: "/media/home/kata.webp",
    activities: KATA_ACTIVITIES,
  },
  {
    id: "nage-waza",
    number: "3",
    title: "Nage Waza",
    subtitle: "Gokyo, Renraku, Gaeshi e difese",
    image: "/media/nage.webp",
    activities: NAGE_ACTIVITIES,
  },
  {
    id: "katame-waza",
    number: "4",
    title: "Katame Waza",
    subtitle: "Osae, Shime, Kansetsu e applicazioni",
    image: "/media/katame.webp",
    activities: KATAME_ACTIVITIES,
  },
];

const ALL_ACTIVITIES = JOURNEY_MODULES.flatMap((module) => module.activities);
const STORAGE_KEY = "judook_sandan_no_do_progress_v2";
const LEGACY_STORAGE_KEY = "judook_sandan_no_do_progress_v1";
const QUIZ_STORAGE_KEY = "judook_sandan_no_do_quiz_v2";
const LEGACY_QUIZ_STORAGE_KEY = "judook_sandan_no_do_quiz_v1";
const MODULE_POINT_TOTALS: Record<string, number> = {
  fondamenta: 10,
  kata: 10,
  "nage-waza": 45,
  "katame-waza": 35,
};
const ACTIVITY_POINTS = Object.fromEntries(
  JOURNEY_MODULES.flatMap((module) => {
    const modulePoints = MODULE_POINT_TOTALS[module.id];
    const basePoints = Math.floor(modulePoints / module.activities.length);
    const remainder = modulePoints % module.activities.length;
    return module.activities.map((item, index) => [
      item.id,
      basePoints + (index < remainder ? 1 : 0),
    ]);
  }),
) as Record<string, number>;

const moduleIsUnlocked = (results: ActivityResults, moduleIndex: number) => {
  if (moduleIndex === 0) return true;
  return JOURNEY_MODULES.slice(0, moduleIndex).every((module) =>
    module.activities.every((item) => Boolean(results[item.id])),
  );
};

const findMatchingResource = (
  resources: SandanResource[],
  concept: string,
  preferredKind?: ResourceKind,
) => {
  const target = normalize(concept);
  const exact = resources.find(
    (resource) =>
      normalize(resource.title) === target &&
      (!preferredKind || resource.kind === preferredKind),
  );
  if (exact) return exact;
  return resources.find(
    (resource) =>
      (!preferredKind || resource.kind === preferredKind) &&
      (normalize(resource.title).includes(target) ||
        target.includes(normalize(resource.title))),
  );
};

const quizQuestionText = (question: SandanQuizQuestion) =>
  normalize(
    [
      question.category,
      question.question,
      ...question.options,
    ].join(" "),
  );

const includesQuizTerm = (text: string, terms: string[]) =>
  terms.some((term) => text.includes(normalize(term)));

const isFoundationQuizQuestion = (
  activityId: string,
  question: SandanQuizQuestion,
) => {
  const category = normalize(question.category);
  const text = quizQuestionText(question);

  if (activityId === "fondamenti-storia") {
    return (
      category === "storia" ||
      category === "principi" ||
      includesQuizTerm(text, [
        "Seiryoku Zen'yo",
        "Jita Kyoei",
        "reciproco benessere e beneficio",
      ])
    );
  }

  if (activityId === "fondamenti-federazione") {
    return (
      includesQuizTerm(text, [
        "FIJLKAM",
        "federazione",
        "International Judo Federation",
        "IJF",
        "CONI",
        "direttore del Kodokan",
        "presidente del Kodokan",
      ]) &&
      !includesQuizTerm(text, [
        "Osaekomi",
        "quale kata è richiesto",
        "cosa è richiesto",
      ])
    );
  }

  if (activityId === "fondamenti-etica") {
    return (
      category === "principi" ||
      includesQuizTerm(text, [
        "Seiryoku Zen'yo",
        "Jita Kyoei",
        "reciproco benessere",
        "atteggiamento mentale",
        "Mushin",
        "Zanshin",
        "principio del Judo",
      ])
    );
  }

  if (
    activityId === "fondamenti-termini-arbitrali" ||
    activityId === "fondamenti-gesti-arbitrali"
  ) {
    return includesQuizTerm(text, [
      "comando dell'arbitro",
      "arbitro",
      "Hajime",
      "Matte",
      "Ippon",
      "Waza-ari",
      "Osaekomi",
      "Shido",
      "Hansoku",
      "Stop",
    ]);
  }

  if (activityId === "fondamenti-regolamento") {
    return (
      category === "regolamenti" ||
      includesQuizTerm(text, [
        "regolamento",
        "secondo IJF",
        "secondo i regolamenti IJF",
        "secondo FIJLKAM",
        "durata Osaekomi",
        "esame FIJLKAM",
      ])
    );
  }

  return false;
};

const getFoundationQuizQuestions = (
  questions: SandanQuizQuestion[],
  activityId: string,
) =>
  questions.filter((question) =>
    isFoundationQuizQuestion(activityId, question),
  );

const selectRandomQuizQuestions = (
  questions: SandanQuizQuestion[],
  activityId: string,
  excludedIds: string[] = [],
) => {
  const candidates = getFoundationQuizQuestions(questions, activityId);
  const fresh = candidates.filter(
    (question) => !excludedIds.includes(question.id),
  );
  const pool = fresh.length >= 3 ? fresh : candidates;
  const shuffled = [...pool];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled.slice(0, 3);
};

const getQuizStats = (
  attempt: QuizAttempt | undefined,
  questions: SandanQuizQuestion[],
) => {
  if (!attempt || attempt.questionIds.length === 0) {
    return { total: 0, answered: 0, correct: 0, wrong: 0 };
  }
  const selectedQuestions = attempt.questionIds
    .map((id) => questions.find((question) => question.id === id))
    .filter((question): question is SandanQuizQuestion => Boolean(question));
  const answeredQuestions = selectedQuestions.filter(
    (question) => attempt.selectedOptions[question.id] !== undefined,
  );
  const correct = answeredQuestions.filter(
    (question) =>
      attempt.selectedOptions[question.id] === question.correctAnswer,
  ).length;
  return {
    total: selectedQuestions.length,
    answered: answeredQuestions.length,
    correct,
    wrong: answeredQuestions.length - correct,
  };
};

const getActivityEarnedPoints = (
  item: Activity,
  results: ActivityResults,
  progress: QuizProgress,
  questions: SandanQuizQuestion[],
) => {
  const stats = getQuizStats(progress[item.id], questions);
  if (stats.total > 0) {
    return (ACTIVITY_POINTS[item.id] * stats.correct) / stats.total;
  }
  return results[item.id] === "correct" ? ACTIVITY_POINTS[item.id] : 0;
};

const formatPoints = (value: number) =>
  Number(value.toFixed(1)).toLocaleString("it-IT", {
    maximumFractionDigits: 1,
  });

export const useSandanData = routeLoader$<SandanData>(async () => {
  const collections: Array<{
    name: "dizionario" | "tecniche" | "kata";
    kind: ResourceKind;
  }> = [
    { name: "dizionario", kind: "dizionario" },
    { name: "tecniche", kind: "tecnica" },
    { name: "kata", kind: "kata" },
  ];

  const results = await Promise.allSettled(
    collections.map(({ name }) =>
      pb.collection(name).getFullList({ requestKey: null }),
    ),
  );

  const readDirSafe = (directory: string) => {
    try {
      return fs.readdirSync(directory);
    } catch {
      return [] as string[];
    }
  };
  const mediaFiles = readDirSafe(path.join(process.cwd(), "public", "media"));
  const kataThumbFiles = readDirSafe(
    path.join(process.cwd(), "public", "media", "kata_thumbs"),
  );
  const localMedia = new Map(
    mediaFiles.map((file) => [file.toLowerCase(), `/media/${file}`]),
  );
  const localKataMedia = new Map(
    kataThumbFiles.map((file) => [
      file.toLowerCase(),
      `/media/kata_thumbs/${file}`,
    ]),
  );
  const resolveLocalImage = (slug: string, kind: ResourceKind) => {
    if (!slug) return "";
    const bases = [slug, slug.replace(/-/g, "_"), slug.replace(/-/g, "")];
    const extensions = [".webp", ".svg", ".png", ".jpg", ".jpeg"];
    for (const base of bases) {
      for (const extension of extensions) {
        const direct = localMedia.get(`${base}${extension}`.toLowerCase());
        if (direct) return direct;
      }
    }
    if (kind === "kata") {
      for (const base of bases) {
        for (const prefix of ["", "goshin-", "ju-no-kata-", "katame-"]) {
          for (const extension of extensions) {
            const kataImage = localKataMedia.get(
              `${prefix}${base}${extension}`.toLowerCase(),
            );
            if (kataImage) return kataImage;
          }
        }
      }
    }
    return "";
  };

  const resources: SandanResource[] = [];
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const { kind } = collections[index];
    result.value.forEach((record: any) => {
      resources.push({
        id: record.id,
        kind,
        title: record.titolo || "",
        secondaryTitle: record.titolo_secondario || "",
        slug: record.slug || "",
        summary: record.descrizione_breve || "",
        content: record.contenuto || record.descrizione_breve || "",
        imageUrl: record.immagine_principale
          ? pb.files.getUrl(record, record.immagine_principale)
          : resolveLocalImage(record.slug || "", kind),
        audioUrl: record.audio ? pb.files.getUrl(record, record.audio) : "",
        videoUrl: record.video_link || "",
      });
    });
  });

  let questions: SandanQuizQuestion[] = [];
  try {
    const questionRecords = await pb
      .collection("domande_quiz")
      .getFullList({ requestKey: null });
    questions = questionRecords.map((record: any) => {
      const rawImage = String(record.immagine || "").trim();
      const imageUrl = rawImage
        ? /^(?:https?:|data:|blob:|\/)/i.test(rawImage)
          ? rawImage.startsWith("/") && !rawImage.startsWith("/media/")
            ? `/media/${rawImage.replace(/^\/+/, "")}`
            : rawImage
          : `/media/${rawImage.replace(/^\/?media\//i, "")}`
        : "";
      return {
        id: record.id,
        question: String(record.domanda || ""),
        options: [
          String(record.opzione_a || ""),
          String(record.opzione_b || ""),
          String(record.opzione_c || ""),
          String(record.opzione_d || ""),
        ],
        correctAnswer: Math.min(
          4,
          Math.max(1, Number(record.risposta_corretta) || 1),
        ),
        explanation: String(record.spiegazione || ""),
        category: String(record.categoria || "Generale"),
        danLevel: String(record.livello_dan || ""),
        imageUrl,
      };
    });
  } catch {
    questions = [];
  }

  return {
    resources,
    questions,
    error:
      resources.length === 0
        ? "Le schede di approfondimento non sono al momento raggiungibili."
        : undefined,
  };
});

export default component$(() => {
  useStylesScoped$(styles);
  const data = useSandanData();
  const appState = useContext(AppContext);
  const activityResults = useSignal<ActivityResults>({});
  const quizProgress = useSignal<QuizProgress>({});
  const expandedModule = useSignal("");
  const selectedResource = useSignal<SandanResource | null>(null);
  const selectedActivity = useSignal<Activity | null>(null);
  const selectedQuizActivity = useSignal<Activity | null>(null);
  const selectedQuizQuestions = useSignal<SandanQuizQuestion[]>([]);

  useVisibleTask$(() => {
    appState.sectionTitle = "三段の道";
    appState.sectionIcon = undefined;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        activityResults.value = Object.fromEntries(
          Object.entries(saved).filter(
            ([id, result]) =>
              ALL_ACTIVITIES.some((item) => item.id === id) &&
              (result === "correct" || result === "error"),
          ),
        ) as ActivityResults;
      } else {
        const legacy = JSON.parse(
          localStorage.getItem(LEGACY_STORAGE_KEY) || "[]",
        );
        if (Array.isArray(legacy)) {
          activityResults.value = Object.fromEntries(
            legacy
              .filter(
                (id): id is string =>
                  typeof id === "string" &&
                  ALL_ACTIVITIES.some((item) => item.id === id),
              )
              .map((id) => [id, "correct"]),
          );
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(activityResults.value),
          );
        }
      }
    } catch {
      activityResults.value = {};
    }

    try {
      const savedQuiz = JSON.parse(
        localStorage.getItem(QUIZ_STORAGE_KEY) || "{}",
      );
      if (savedQuiz && typeof savedQuiz === "object") {
        quizProgress.value = savedQuiz as QuizProgress;
      }
    } catch {
      quizProgress.value = {};
    }
  });

  useVisibleTask$(({ track, cleanup }) => {
    track(() => selectedActivity.value);
    track(() => selectedQuizActivity.value);
    document.body.style.overflow =
      selectedActivity.value || selectedQuizActivity.value ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        selectedActivity.value = null;
        selectedResource.value = null;
        selectedQuizActivity.value = null;
        selectedQuizQuestions.value = [];
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    cleanup(() => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    });
  });

  const evaluatedCount = useComputed$(
    () => Object.keys(activityResults.value).length,
  );
  const errorCount = useComputed$(
    () =>
      Object.values(activityResults.value).filter((result) => result === "error")
        .length,
  );
  const activityEarnedPoints = (item: Activity) => {
    return getActivityEarnedPoints(
      item,
      activityResults.value,
      quizProgress.value,
      data.value.questions,
    );
  };
  const score = useComputed$(() =>
    Math.round(
      ALL_ACTIVITIES.reduce(
        (total, item) =>
          total +
          getActivityEarnedPoints(
            item,
            activityResults.value,
            quizProgress.value,
            data.value.questions,
          ),
        0,
      ) * 10,
    ) / 10,
  );

  const isUnlocked = (moduleIndex: number) => {
    return moduleIsUnlocked(activityResults.value, moduleIndex);
  };

  const moduleEvaluatedCount = (module: JourneyModule) =>
    module.activities.filter((item) => Boolean(activityResults.value[item.id]))
      .length;

  const moduleErrorCount = (module: JourneyModule) =>
    module.activities.filter(
      (item) => activityResults.value[item.id] === "error",
    ).length;

  const moduleScore = (module: JourneyModule) =>
    Math.round(
      module.activities.reduce(
        (total, item) => total + activityEarnedPoints(item),
        0,
      ) * 10,
    ) / 10;

  const findResource = (concept: string, preferredKind?: ResourceKind) => {
    return findMatchingResource(data.value.resources, concept, preferredKind);
  };

  const openConcept = $((activityId: string, concept: string) => {
    const item =
      ALL_ACTIVITIES.find((candidate) => candidate.id === activityId) || null;
    const resource = item
      ? findMatchingResource(data.value.resources, concept, item.kind) ||
        findMatchingResource(data.value.resources, concept)
      : undefined;
    selectedActivity.value = item;
    selectedResource.value = resource || null;
  });

  const closeModal = $(() => {
    selectedActivity.value = null;
    selectedResource.value = null;
  });

  const openFoundationQuiz = $((activityId: string) => {
    const item = FOUNDATION_ACTIVITIES.find(
      (candidate) => candidate.id === activityId,
    );
    if (!item) return;

    const savedAttempt = quizProgress.value[activityId];
    const savedQuestions = savedAttempt?.questionIds
      .map((id) =>
        data.value.questions.find((question) => question.id === id),
      )
      .filter((question): question is SandanQuizQuestion => Boolean(question));

    if (savedAttempt && savedQuestions?.length) {
      selectedQuizQuestions.value = savedQuestions;
    } else {
      const questions = selectRandomQuizQuestions(
        data.value.questions,
        activityId,
      );
      if (questions.length === 0) return;
      const attempt: QuizAttempt = {
        questionIds: questions.map((question) => question.id),
        selectedOptions: {},
      };
      const nextQuizProgress = {
        ...quizProgress.value,
        [activityId]: attempt,
      };
      quizProgress.value = nextQuizProgress;
      localStorage.setItem(
        QUIZ_STORAGE_KEY,
        JSON.stringify(nextQuizProgress),
      );

      selectedQuizQuestions.value = questions;
    }

    selectedQuizActivity.value = item;
  });

  const closeQuiz = $(() => {
    selectedQuizActivity.value = null;
    selectedQuizQuestions.value = [];
  });

  const restartFoundationQuiz = $(() => {
    const item = selectedQuizActivity.value;
    if (!item) return;
    const previousIds = quizProgress.value[item.id]?.questionIds || [];
    const questions = selectRandomQuizQuestions(
      data.value.questions,
      item.id,
      previousIds,
    );
    if (questions.length === 0) return;
    const attempt: QuizAttempt = {
      questionIds: questions.map((question) => question.id),
      selectedOptions: {},
    };
    const nextQuizProgress = {
      ...quizProgress.value,
      [item.id]: attempt,
    };
    quizProgress.value = nextQuizProgress;
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(nextQuizProgress));

    selectedQuizQuestions.value = questions;
  });

  const answerQuizQuestion = $((questionId: string, option: number) => {
    const item = selectedQuizActivity.value;
    if (!item) return;
    const currentAttempt = quizProgress.value[item.id];
    if (!currentAttempt || currentAttempt.selectedOptions[questionId]) return;

    const attempt: QuizAttempt = {
      ...currentAttempt,
      selectedOptions: {
        ...currentAttempt.selectedOptions,
        [questionId]: option,
      },
    };
    const nextQuizProgress = {
      ...quizProgress.value,
      [item.id]: attempt,
    };
    quizProgress.value = nextQuizProgress;
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(nextQuizProgress));

    const stats = getQuizStats(attempt, data.value.questions);
    const nextResults = { ...activityResults.value };
    if (stats.total > 0 && stats.answered === stats.total) {
      nextResults[item.id] =
        stats.correct === stats.total ? "correct" : "error";
    } else {
      delete nextResults[item.id];
    }
    activityResults.value = nextResults;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextResults));

    if (stats.total > 0 && stats.answered === stats.total) {
      setTimeout(() => {
        selectedQuizActivity.value = null;
        selectedQuizQuestions.value = [];
      }, 650);
    }
  });

  const setActivityResult = $(
    (activityId: string, moduleIndex: number, result: ActivityResult) => {
      if (!moduleIsUnlocked(activityResults.value, moduleIndex)) return;
      const next = { ...activityResults.value };
      if (next[activityId] === result) delete next[activityId];
      else next[activityId] = result;
      activityResults.value = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      const currentModule = JOURNEY_MODULES[moduleIndex];
      if (
        moduleIndex < JOURNEY_MODULES.length - 1 &&
        currentModule.activities.every((item) => Boolean(next[item.id]))
      ) {
        expandedModule.value = JOURNEY_MODULES[moduleIndex + 1].id;
      }
    },
  );

  const continueJourney = $(() => {
    const next = JOURNEY_MODULES.flatMap((module, moduleIndex) =>
      moduleIsUnlocked(activityResults.value, moduleIndex)
        ? module.activities
        : [],
    ).find((item) => !activityResults.value[item.id]);
    const reviewItem =
      next ||
      ALL_ACTIVITIES.find(
        (item) => activityResults.value[item.id] === "error",
      );
    if (!reviewItem) return;
    const module = JOURNEY_MODULES.find((candidate) =>
      candidate.activities.some((item) => item.id === reviewItem.id),
    );
    if (module) expandedModule.value = module.id;
    setTimeout(
      () =>
        document
          .getElementById(`activity-${reviewItem.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      80,
    );
  });

  const resetProgress = $(() => {
    if (!window.confirm("Vuoi azzerare tutti i progressi di 三段の道?")) return;
    activityResults.value = {};
    quizProgress.value = {};
    expandedModule.value = "";
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(QUIZ_STORAGE_KEY);
    localStorage.removeItem(LEGACY_QUIZ_STORAGE_KEY);
  });

  const modalLink = (resource: SandanResource) => {
    if (resource.kind === "kata") return `/kata/${resource.slug}`;
    if (resource.kind === "tecnica")
      return `/tecniche?search=${encodeURIComponent(resource.title)}`;
    return `/dizionario?search=${encodeURIComponent(resource.title)}`;
  };

  const nextActivity = () =>
    JOURNEY_MODULES.flatMap((module, moduleIndex) =>
      isUnlocked(moduleIndex) ? module.activities : [],
    ).find((item) => !activityResults.value[item.id]) ||
    ALL_ACTIVITIES.find(
      (item) => activityResults.value[item.id] === "error",
    );

  return (
    <div class="sandan-page">
      <section class="sandan-hero" aria-labelledby="sandan-title">
        <img
          src="/media/sandan-no-do.webp"
          alt="Logo Sandan no Dō"
          class="sandan-logo"
          width={487}
          height={512}
        />
        <div class="sandan-hero-copy">
          <p class="sandan-eyebrow">Percorso interattivo · FIJLKAM 2026</p>
          <h1 id="sandan-title">三段の道</h1>
          <p class="sandan-reading">Sandan no Dō</p>
          <p class="sandan-intro">
            La via verso il 3° Dan, una tappa alla volta.
          </p>
        </div>
      </section>

      <section
        class="sandan-progress-card"
        aria-label="Avanzamento nel percorso"
      >
        <div class="sandan-progress-copy">
          <strong>{formatPoints(score.value)}/100</strong>
          <span>punti ottenuti</span>
        </div>
        <div class="sandan-progress-steps" aria-label="Livelli del percorso">
          {JOURNEY_MODULES.map((module, moduleIndex) => {
            const evaluated = moduleEvaluatedCount(module);
            const errors = moduleErrorCount(module);
            const complete =
              evaluated === module.activities.length && errors === 0;
            const reviewedWithErrors =
              evaluated === module.activities.length && errors > 0;
            const unlocked = isUnlocked(moduleIndex);
            return (
              <span
                key={`progress-${module.id}`}
                class={`${complete ? "is-complete" : reviewedWithErrors ? "has-errors" : unlocked ? "is-active" : "is-locked"}`}
                title={`${module.title}: ${formatPoints(moduleScore(module))}/${MODULE_POINT_TOTALS[module.id]} punti`}
              >
                {module.number}
              </span>
            );
          })}
        </div>
        <div class="sandan-progress-track">
          <progress value={score.value} max={100}>
            {score.value} punti su 100
          </progress>
          <span>
            {evaluatedCount.value} / {ALL_ACTIVITIES.length} tappe valutate
            {errorCount.value > 0 && ` · ${errorCount.value} da ripassare`}
          </span>
        </div>
        {evaluatedCount.value > 0 && (
          <button class="sandan-reset" type="button" onClick$={resetProgress}>
            Azzera
          </button>
        )}
      </section>

      {data.value.error && (
        <p class="sandan-data-warning">{data.value.error}</p>
      )}

      <section
        class="sandan-timeline"
        aria-label="Timeline del percorso 3° Dan"
      >
        {JOURNEY_MODULES.map((module, moduleIndex) => {
          const unlocked = isUnlocked(moduleIndex);
          const evaluated = moduleEvaluatedCount(module);
          const errors = moduleErrorCount(module);
          const points = moduleScore(module);
          const isReviewed = evaluated === module.activities.length;
          const isComplete = isReviewed && errors === 0;
          const isExpanded = expandedModule.value === module.id && unlocked;
          const groups = [
            ...new Set(module.activities.map((item) => item.group)),
          ];

          return (
            <article
              key={module.id}
              class={`sandan-milestone ${unlocked ? "is-unlocked" : "is-locked"} ${isComplete ? "is-complete" : ""} ${isReviewed && errors > 0 ? "has-errors" : ""}`}
            >
              <div class="sandan-node" aria-hidden="true">
                {module.number}
              </div>
              <div class="sandan-card">
                <button
                  type="button"
                  class="sandan-card-header"
                  aria-expanded={isExpanded}
                  disabled={!unlocked}
                  onClick$={() => {
                    if (unlocked)
                      expandedModule.value = isExpanded ? "" : module.id;
                  }}
                >
                  <span class="sandan-module-image-wrap">
                    <img
                      src={module.image}
                      alt=""
                      class="sandan-module-image"
                      width={58}
                      height={58}
                    />
                  </span>
                  <span class="sandan-card-title">
                    <strong>{module.title}</strong>
                    <small>{module.subtitle}</small>
                    <span class="sandan-count">
                      {formatPoints(points)} / {MODULE_POINT_TOTALS[module.id]} punti ·{" "}
                      {evaluated} / {module.activities.length} valutate
                    </span>
                  </span>
                  <span
                    class={`sandan-status ${isComplete ? "complete" : unlocked ? "active" : "locked"}`}
                  >
                    {isComplete
                      ? "Acquisito"
                      : isReviewed && errors > 0
                        ? `${errors} errori`
                      : unlocked
                        ? isExpanded
                          ? "Riduci"
                          : "Apri"
                        : "Bloccato"}
                  </span>
                </button>

                {isExpanded && (
                  <div class="sandan-activity-panel">
                    {groups.map((group) => (
                      <div
                        class="sandan-activity-group"
                        key={`${module.id}-${group}`}
                      >
                        <h2>{group}</h2>
                        {module.activities
                          .filter((item) => item.group === group)
                          .map((item) => {
                            const availableConcepts = item.concepts.filter(
                              (concept) =>
                                Boolean(
                                  findResource(concept, item.kind) ||
                                    findResource(concept),
                                ),
                            );
                            const previewResource = item.concepts
                              .map(
                                (concept) =>
                                  findResource(concept, item.kind) ||
                                  findResource(concept),
                              )
                              .find(Boolean);
                            const thumbnail =
                              previewResource?.imageUrl || module.image;
                            const result = activityResults.value[item.id];
                            const points = ACTIVITY_POINTS[item.id];
                            const quizCandidates =
                              getFoundationQuizQuestions(
                                data.value.questions,
                                item.id,
                              );
                            const hasQuiz = quizCandidates.length > 0;
                            const quizStats = getQuizStats(
                              quizProgress.value[item.id],
                              data.value.questions,
                            );
                            const isPartial =
                              hasQuiz &&
                              quizStats.correct > 0 &&
                              quizStats.correct < quizStats.total;
                            const visualResult =
                              hasQuiz &&
                              quizStats.total > 0 &&
                              quizStats.answered < quizStats.total
                                ? undefined
                                : result;
                            const quizState =
                              quizStats.answered === 0
                                ? "pending"
                                : quizStats.answered < quizStats.total
                                  ? "neutral"
                                  : quizStats.correct === quizStats.total
                                    ? "correct"
                                    : quizStats.correct === 0
                                      ? "error"
                                      : "neutral";
                            return (
                              <div
                                id={`activity-${item.id}`}
                                class={`sandan-activity ${hasQuiz ? "has-quiz" : ""} ${isPartial ? "is-partial" : visualResult === "correct" ? "is-correct" : visualResult === "error" ? "is-error" : ""}`}
                                key={item.id}
                              >
                                <div
                                  class={`sandan-activity-main ${hasQuiz ? "has-quiz" : ""}`}
                                >
                                  <div
                                    class={`sandan-result-controls ${hasQuiz ? "has-quiz" : ""}`}
                                    aria-label={`Valutazione ${item.title}`}
                                  >
                                    {hasQuiz ? (
                                      <>
                                        <span
                                          class={`sandan-result-button correct sandan-result-indicator ${quizState === "correct" ? "is-active" : ""}`}
                                          aria-label={`${quizStats.correct} risposte corrette`}
                                        >
                                          ✓
                                        </span>
                                        <span
                                          class={`sandan-result-button neutral sandan-result-indicator ${quizState === "neutral" ? "is-active" : ""}`}
                                          aria-label={`${quizStats.correct} risposte superate su ${quizStats.total || 3}`}
                                        >
                                          •
                                        </span>
                                        <span
                                          class={`sandan-result-button error sandan-result-indicator ${quizState === "error" ? "is-active" : ""}`}
                                          aria-label={`${quizStats.wrong} risposte errate`}
                                        >
                                          ×
                                        </span>
                                        <small class="sandan-result-points">
                                          {formatPoints(
                                            activityEarnedPoints(item),
                                          )}
                                          /{points} pt
                                        </small>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          class={`sandan-result-button correct ${result === "correct" ? "is-active" : ""}`}
                                          aria-label={`Segna ${item.title} come acquisita: +${points} ${points === 1 ? "punto" : "punti"}`}
                                          aria-pressed={result === "correct"}
                                          onClick$={() =>
                                            setActivityResult(
                                              item.id,
                                              moduleIndex,
                                              "correct",
                                            )
                                          }
                                        >
                                          ✓
                                        </button>
                                        <button
                                          type="button"
                                          class={`sandan-result-button error ${result === "error" ? "is-active" : ""}`}
                                          aria-label={`Segna un errore per ${item.title}`}
                                          aria-pressed={result === "error"}
                                          onClick$={() =>
                                            setActivityResult(
                                              item.id,
                                              moduleIndex,
                                              "error",
                                            )
                                          }
                                        >
                                          ×
                                        </button>
                                      </>
                                    )}
                                  </div>
                                  {hasQuiz ? (
                                    <button
                                      type="button"
                                      class="sandan-activity-quiz-trigger"
                                      aria-label={`Apri il quiz: ${item.title}`}
                                      onClick$={() =>
                                        openFoundationQuiz(item.id)
                                      }
                                    >
                                      <span class="sandan-activity-thumb-wrap">
                                        <img
                                          src={thumbnail}
                                          alt={`Miniatura ${item.title}`}
                                          class="sandan-activity-thumb"
                                          width={48}
                                          height={48}
                                          loading="lazy"
                                          onError$={(event) => {
                                            (
                                              event.target as HTMLImageElement
                                            ).src = module.image;
                                          }}
                                        />
                                      </span>
                                      <span>
                                        <strong>{item.title}</strong>
                                        <small>{item.summary}</small>
                                        <b>
                                          Apri quiz · {Math.min(3, quizCandidates.length)} domande ·{" "}
                                          {quizStats.answered}/{quizStats.total || Math.min(3, quizCandidates.length)} risposte
                                        </b>
                                      </span>
                                    </button>
                                  ) : (
                                    <>
                                      <span class="sandan-activity-thumb-wrap">
                                        <img
                                          src={thumbnail}
                                          alt={`Miniatura ${item.title}`}
                                          class="sandan-activity-thumb"
                                          width={48}
                                          height={48}
                                          loading="lazy"
                                          onError$={(event) => {
                                            (
                                              event.target as HTMLImageElement
                                            ).src = module.image;
                                          }}
                                        />
                                      </span>
                                      <span>
                                        <strong>
                                          {item.title}
                                          <em>+{points} pt</em>
                                        </strong>
                                        <small>{item.summary}</small>
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div class="sandan-concepts">
                                  {availableConcepts.map((concept) => (
                                    <button
                                      type="button"
                                      class="sandan-concept-link has-content"
                                      key={`${item.id}-${concept}`}
                                      title={`Scopri il contenuto: ${concept}`}
                                      onClick$={() =>
                                        openConcept(item.id, concept)
                                      }
                                    >
                                      {concept}
                                    </button>
                                  ))}
                                  {availableConcepts.length === 0 && (
                                    <button
                                      type="button"
                                      onClick$={() =>
                                        openConcept(item.id, item.title)
                                      }
                                    >
                                      Approfondisci
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section class="sandan-next-card" aria-label="Prossima tappa">
        {nextActivity() ? (
          <>
            <div>
              <span>
                {evaluatedCount.value === ALL_ACTIVITIES.length
                  ? "Da ripassare"
                  : "Prossima tappa"}
              </span>
              <strong>{nextActivity()?.title}</strong>
              <small>
                {evaluatedCount.value === ALL_ACTIVITIES.length
                  ? "Trasforma gli errori in competenze acquisite per arrivare a 100/100."
                  : "Valuta la voce e avanza nel percorso."}
              </small>
            </div>
            <button type="button" onClick$={continueJourney}>
              {evaluatedCount.value === ALL_ACTIVITIES.length
                ? "Ripassa"
                : "Continua"}
            </button>
          </>
        ) : (
          <div class="sandan-finished">
            <span>Percorso completato</span>
            <strong>Il tuo Sandan no Dō è completo: 100/100.</strong>
            <small>
              Continua a ripassare e confrontati con il tuo insegnante.
            </small>
          </div>
        )}
      </section>

      <div class="sandan-documents" aria-label="Documenti del percorso">
        <a
          href="/downloads/Programma_Tecnico_Esame_3_Dan_Judo_FIJLKAM_20261.pdf"
          target="_blank"
          rel="noopener"
        >
          <span class="sandan-document-type">PDF</span>
          Programma ufficiale FIJLKAM 2026
        </a>
        <a href="/downloads/3dan.pdf" target="_blank" rel="noopener">
          <span class="sandan-document-type">PDF</span>
          Checklist sintetica 3° Dan
        </a>
      </div>

      {selectedQuizActivity.value && (
        <div
          class="sandan-modal-backdrop"
          role="presentation"
          onClick$={closeQuiz}
        >
          <section
            class="sandan-modal sandan-quiz-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sandan-quiz-title"
            onClick$={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Mini-quiz Fondamenta</span>
                <h2 id="sandan-quiz-title">
                  {selectedQuizActivity.value.title}
                </h2>
                <p>
                  Tre domande casuali dalla banca dati Quiz generale.
                </p>
              </div>
              <button type="button" onClick$={closeQuiz}>
                Chiudi
              </button>
            </header>

            <div class="sandan-modal-body sandan-quiz-body">
              <div class="sandan-quiz-score" aria-live="polite">
                <div>
                  <strong>
                    {
                      getQuizStats(
                        quizProgress.value[selectedQuizActivity.value.id],
                        data.value.questions,
                      ).correct
                    }
                    /{selectedQuizQuestions.value.length}
                  </strong>
                  <span>risposte corrette</span>
                </div>
                <div>
                  <strong>
                    {formatPoints(
                      selectedQuizQuestions.value.length > 0
                        ? (ACTIVITY_POINTS[selectedQuizActivity.value.id] *
                            getQuizStats(
                              quizProgress.value[
                                selectedQuizActivity.value.id
                              ],
                              data.value.questions,
                            ).correct) /
                            selectedQuizQuestions.value.length
                        : 0,
                    )}
                    /{ACTIVITY_POINTS[selectedQuizActivity.value.id]}
                  </strong>
                  <span>punti tappa</span>
                </div>
              </div>

              <div class="sandan-quiz-questions">
                {selectedQuizQuestions.value.map((question, index) => {
                  const selectedOption =
                    quizProgress.value[selectedQuizActivity.value!.id]
                      ?.selectedOptions[question.id];
                  const answered = selectedOption !== undefined;
                  const isCorrect =
                    answered && selectedOption === question.correctAnswer;
                  const questionPoints =
                    ACTIVITY_POINTS[selectedQuizActivity.value!.id] /
                    selectedQuizQuestions.value.length;

                  return (
                    <article class="sandan-quiz-question" key={question.id}>
                      <div class="sandan-quiz-question-meta">
                        <span>
                          Domanda {index + 1}/{selectedQuizQuestions.value.length}
                        </span>
                        <span>+{formatPoints(questionPoints)} pt</span>
                      </div>
                      <h3>{question.question}</h3>
                      <small>
                        {question.category}
                        {question.danLevel && ` · Dan ${question.danLevel}`}
                      </small>

                      {question.imageUrl && (
                        <img
                          class="sandan-quiz-image"
                          src={question.imageUrl}
                          alt="Illustrazione della domanda"
                          loading="lazy"
                        />
                      )}

                      <div class="sandan-quiz-options">
                        {question.options.map((option, optionIndex) => {
                          const optionNumber = optionIndex + 1;
                          const selected = selectedOption === optionNumber;
                          const correctOption =
                            question.correctAnswer === optionNumber;
                          return (
                            <button
                              type="button"
                              key={`${question.id}-${optionNumber}`}
                              disabled={answered}
                              class={`sandan-quiz-option ${selected ? "is-selected" : ""} ${selected && correctOption ? "is-correct" : ""} ${selected && !correctOption ? "is-wrong" : ""} ${answered && correctOption ? "is-correct-answer" : ""}`}
                              onClick$={() =>
                                answerQuizQuestion(question.id, optionNumber)
                              }
                            >
                              <span>{String.fromCharCode(65 + optionIndex)}</span>
                              {option}
                            </button>
                          );
                        })}
                      </div>

                      {answered && (
                        <div
                          class={`sandan-quiz-feedback ${isCorrect ? "is-correct" : "is-wrong"}`}
                          aria-live="polite"
                        >
                          <strong>
                            {isCorrect ? "Risposta corretta" : "Da ripassare"}
                          </strong>
                          {question.explanation && <p>{question.explanation}</p>}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>

            <footer>
              <button
                type="button"
                class="sandan-secondary-button"
                onClick$={restartFoundationQuiz}
              >
                Nuove domande
              </button>
              <button
                type="button"
                class="sandan-quiz-close"
                onClick$={closeQuiz}
              >
                Torna al percorso
              </button>
            </footer>
          </section>
        </div>
      )}

      {selectedActivity.value && (
        <div
          class="sandan-modal-backdrop"
          role="presentation"
          onClick$={closeModal}
        >
          <section
            class="sandan-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sandan-modal-title"
            onClick$={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>
                  {selectedResource.value
                    ? "Scheda dal database JudoOK"
                    : "Nota del percorso"}
                </span>
                <h2 id="sandan-modal-title">
                  {selectedResource.value?.title ||
                    selectedActivity.value.title}
                </h2>
                {selectedResource.value?.secondaryTitle && (
                  <p>{selectedResource.value.secondaryTitle}</p>
                )}
              </div>
              <button type="button" onClick$={closeModal}>
                Chiudi
              </button>
            </header>

            <div class="sandan-modal-body">
              {selectedResource.value?.imageUrl && (
                <img
                  src={selectedResource.value.imageUrl}
                  alt={selectedResource.value.title}
                  class="sandan-modal-image"
                />
              )}
              {selectedResource.value?.content ? (
                <div
                  class="sandan-rich-text"
                  dangerouslySetInnerHTML={selectedResource.value.content}
                />
              ) : (
                <p>{selectedActivity.value.summary}</p>
              )}

              {selectedResource.value?.audioUrl && (
                <div class="sandan-media-block">
                  <strong>Pronuncia / audio</strong>
                  <audio
                    controls
                    src={selectedResource.value.audioUrl}
                    preload="none"
                  />
                </div>
              )}

              {selectedResource.value?.videoUrl && (
                <a
                  class="sandan-secondary-link"
                  href={selectedResource.value.videoUrl}
                  target="_blank"
                  rel="noopener"
                >
                  Guarda il video collegato
                </a>
              )}
            </div>

            <footer>
              {selectedResource.value && (
                <Link
                  class="sandan-primary-link"
                  href={modalLink(selectedResource.value)}
                >
                  Apri la scheda completa
                </Link>
              )}
              <button
                type="button"
                class="sandan-secondary-button"
                onClick$={closeModal}
              >
                Torna al percorso
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "三段の道 (Sandan no Dō) - JudoOK",
  meta: [
    {
      name: "description",
      content:
        "Percorso gamificato e interattivo per preparare il programma tecnico FIJLKAM del 3° Dan di Judo.",
    },
  ],
};
