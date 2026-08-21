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
import { ALL_SANDAN_QUIZ_QUESTIONS } from "./quiz-database";
import {
  generateNageDictionaryQuestions,
  generateKatameDictionaryQuestions,
} from "./nage-dictionary-quiz";

export type DanLevelId = 1 | 2 | 3;

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

export interface SandanQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  danLevel: string;
  imageUrl: string;
}

interface SandanData {
  resources: SandanResource[];
  questions: SandanQuizQuestion[];
  error?: string;
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

type ActivityResult = "correct" | "error" | number;
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

// ==========================================
// 1° DAN (SHODAN NO DŌ)
// ==========================================
const FOUNDATION_1_DAN: Activity[] = [
  activity("shodan-storia", "Storia e Jigoro Kano", "Fondamenti", "Origini del Judo Kodokan e principi educativi del maestro Kano.", ["Judo", "Budo", "Do"], "dizionario"),
  activity("shodan-principi", "Seiryoku Zen'yo e Jita Kyoei", "Fondamenti", "I due pilastri filosofici del Judo: miglior impiego dell'energia e mutuo benessere.", ["Judo", "Do"], "dizionario"),
  activity("shodan-etica", "Etica e Comportamento nel Dojo", "Fondamenti", "Etichetta, saluto (Rei), rispetto ed etica del judoka.", ["Dojo", "Rei"], "dizionario"),
  activity("shodan-termini-arbitrali", "Termini Arbitrali di Base", "Arbitraggio", "Lessico essenziale di gara ed esame: Hajime, Matte, Ippon, Waza-ari, Osaekomi, Shido.", ["Hajime", "Matte", "Ippon"], "dizionario"),
  activity("shodan-regolamento", "Regolamento di Gara Base", "Arbitraggio", "Norme principali di condotta, tempi, punteggi e sicurezza.", ["Shido", "Hansoku Make"], "dizionario"),
];

const KATA_1_DAN: Activity[] = [
  activity("shodan-kata-te", "Nage-no-Kata: 1ª Serie (Te Waza)", "Nage-no-Kata", "Uki Otoshi, Seoi Nage, Kata Guruma.", ["Nage-no Kata", "Seoi Nage", "Uki Otoshi", "Kata Guruma"], "kata"),
  activity("shodan-kata-koshi", "Nage-no-Kata: 2ª Serie (Koshi Waza)", "Nage-no-Kata", "Uki Goshi, O Goshi, Tsurikomi Goshi.", ["Nage-no Kata", "Uki Goshi", "O Goshi"], "kata"),
];

const NAGE_1_DAN: Activity[] = [
  ...["De Ashi Barai", "Hiza Guruma", "Sasae Tsurikomi Ashi", "Uki Goshi", "O Soto Gari", "O Goshi", "O Uchi Gari", "Seoi Nage"].map((name) =>
    activity(`shodan-nage-gokyo1-${normalize(name).replace(/ /g, "-")}`, name, "1° Kyo (Dai Ikkyo)", "Esecuzione fondamentale in statica e movimento.", [name], "tecnica"),
  ),
  ...["Ko Soto Gari", "Ko Uchi Gari", "Koshi Guruma", "Tsurikomi Goshi", "Okuri Ashi Barai", "Tai Otoshi", "Harai Goshi", "Uchi Mata"].map((name) =>
    activity(`shodan-nage-gokyo2-${normalize(name).replace(/ /g, "-")}`, name, "2° Kyo (Dai Nikyo)", "Studio del tempo, dello squilibrio e della proiezione.", [name], "tecnica"),
  ),
  activity("shodan-nage-renraku", "Renraku Waza Base", "Applicazioni", "Combinazioni semplici tra due tecniche (avanti-indietro, destra-sinistra).", ["Renraku Waza"], "dizionario"),
  activity("shodan-nage-difese", "Postura e Difese (Bogyoho)", "Applicazioni", "Shintai, postura difensiva e gestione della presa (Kumi Kata).", ["Bogyoho", "Shintai"], "dizionario"),
];

const KATAME_1_DAN: Activity[] = [
  ...["Kesa Gatame", "Yoko Shiho Gatame", "Kami Shiho Gatame", "Tate Shiho Gatame"].map((name) =>
    activity(`shodan-katame-osae-${normalize(name).replace(/ /g, "-")}`, name, "Osae Waza", "Immobilizzazioni fondamentali e vie di uscita.", [name], "tecnica"),
  ),
];

// ==========================================
// 2° DAN (NIDAN NO DŌ)
// ==========================================
const FOUNDATION_2_DAN: Activity[] = [
  activity("nidan-storia", "Storia e Diffusione del Judo", "Fondamenti", "Evoluzione del Judo Kodokan in Europa e nel mondo.", ["Judo", "Budo"], "dizionario"),
  activity("nidan-federazione", "Struttura Federale FIJLKAM e IJF", "Fondamenti", "Organizzazione delle gare, dei gradi e della federazione.", ["Dan"], "dizionario"),
  activity("nidan-gesti-arbitrali", "Gesti e Segnalazioni Arbitrali", "Arbitraggio", "Padronanza dei gesti arbitrali e direzione di gara.", ["Rei", "Hajime"], "dizionario"),
  activity("nidan-regolamento", "Regolamento IJF/FIJLKAM Avanzato", "Arbitraggio", "Valutazioni, sanzioni (Shido / Hansoku Make) e casi particolari.", ["Shido", "Hansoku Make"], "dizionario"),
  activity("nidan-filosofia", "Principi del Budo e Insegnamento", "Fondamenti", "Responsabilità del cinturone nero 2° Dan nel dojo.", ["Judo", "Dojo"], "dizionario"),
];

const KATA_2_DAN: Activity[] = [
  activity("nidan-kata-nage-full", "Nage-no-Kata Completo", "Kata d'esame", "Tutte le 5 serie del Nage-no-Kata (Te, Koshi, Ashi, Ma-Sutemi, Yoko-Sutemi).", ["Nage-no Kata"], "kata"),
  activity("nidan-kata-katame-full", "Katame-no-Kata Completo", "Kata d'esame", "Tutte le 3 serie del Katame-no-Kata (Osaekomi, Shime e Kansetsu Waza).", ["Katame-no-Kata"], "kata"),
];

const NAGE_2_DAN: Activity[] = [
  ...["Ko Soto Gake", "Tsuri Goshi", "Yoko Otoshi", "Ashi Guruma", "Hane Goshi", "Harai Tsurikomi Ashi", "Tomoe Nage", "Kata Guruma"].map((name) =>
    activity(`nidan-nage-gokyo3-${normalize(name).replace(/ /g, "-")}`, name, "3° Kyo (Dai Sankyo)", "Studio approfondito del Gokyo.", [name], "tecnica"),
  ),
  ...["Sumi Gaeshi", "Tani Otoshi", "Hane Makikomi", "Sukui Nage", "Utsuri Goshi", "O Guruma", "Soto Makikomi", "Uki Otoshi"].map((name) =>
    activity(`nidan-nage-gokyo4-${normalize(name).replace(/ /g, "-")}`, name, "4° Kyo (Dai Yonkyo)", "Tecniche avanzate di proiezione e sacrificio.", [name], "tecnica"),
  ),
  activity("nidan-nage-renraku", "Renraku Waza Avanzati", "Applicazioni", "Combinazioni fluide in risposta alla reazione di Uke.", ["Renraku Waza"], "dizionario"),
  activity("nidan-nage-gaeshi", "Gaeshi Waza (Contrattacchi)", "Applicazioni", "Sfruttare l'attacco di Uke per contrare con efficacia.", ["Gaeshi", "Go no Sen"], "dizionario"),
];

const KATAME_2_DAN: Activity[] = [
  ...["Okuri Eri Jime", "Kata Ha Jime", "Ryo Te Jime", "Sankaku Jime", "Tsukkomi Jime"].map((name) =>
    activity(`nidan-katame-shime-${normalize(name).replace(/ /g, "-")}`, name, "Shime Waza Avanzati", "Strangolamenti avanzati con bavero, braccia e gambe.", [name], "tecnica"),
  ),
  ...["Ude Hishigi Ude Gatame", "Ude Hishigi Waki Gatame", "Ude Hishigi Hara Gatame", "Ude Hishigi Hiza Gatame"].map((name) =>
    activity(`nidan-katame-kansetsu-${normalize(name).replace(/ /g, "-")}`, name, "Kansetsu Waza Avanzati", "Leve articolari con uso di ascella, addome e ginocchio.", [name], "tecnica"),
  ),
  activity("nidan-katame-hairi", "Hairi Kata (Entrate a terra)", "Applicazioni", "Passaggi da Uke in quadrupedia o guardia a terra.", ["Hairi Kata"], "dizionario"),
  activity("nidan-katame-fusegi", "Fusegi e Gaeshi Ne Waza", "Applicazioni", "Difese e ribaltamenti a terra.", ["Fusegi", "Gaeshi"], "dizionario"),
];

// ==========================================
// 3° DAN (SANDAN NO DŌ)
// ==========================================
const FOUNDATION_3_DAN: Activity[] = [
  activity("fondamenti-storia", "Storia e filosofia del Judo", "Fondamenti", "Origini, principi educativi e significato della Via.", ["Judo", "Budo", "Do"], "dizionario"),
  activity("fondamenti-federazione", "Organizzazione federale", "Fondamenti", "Struttura, ruoli e attività della FIJLKAM.", ["Dan"], "dizionario"),
  activity("fondamenti-termini-arbitrali", "Termini arbitrali", "Arbitraggio", "Lessico essenziale usato durante gara ed esame.", ["Hajime", "Matte", "Ippon"], "dizionario"),
  activity("fondamenti-gesti-arbitrali", "Gesti arbitrali", "Arbitraggio", "Riconoscere e spiegare i principali segnali dell’arbitro.", ["Rei"], "dizionario"),
  activity("fondamenti-regolamento", "Regolamento", "Arbitraggio", "Principi di sicurezza, punteggio e condotta di gara.", ["Hansoku Make", "Shido"], "dizionario"),
  activity("fondamenti-etica", "Etica e comportamento nel dojo", "Fondamenti", "Rispetto, saluto e responsabilità del judoka.", ["Dojo", "Rei"], "dizionario"),
];

const KATA_3_DAN: Activity[] = [
  activity("kata-goshin", "Kodokan Goshin Jutsu", "Programma 3° Dan", "Studiare ed eseguire la forma moderna di autodifesa.", ["Kodokan Goshin Jutsu"], "kata"),
  activity("kata-ju", "Ju-no-Kata", "Programma 3° Dan", "Studiare i quindici movimenti della forma della cedevolezza.", ["Ju-no-Kata"], "kata"),
];

const NAGE_3_DAN: Activity[] = [
  activity("nage-seoi", "Seoi Nage: Ippon, Morote ed Eri", "Te Waza", "Eseguire le tre varianti fondamentali in statica e movimento.", ["Seoi Nage"], "tecnica"),
  activity("nage-tai-otoshi", "Tai Otoshi", "Te Waza", "Controllo dello squilibrio e direzione della proiezione.", ["Tai Otoshi"], "tecnica"),
  activity("nage-kata-guruma", "Kata Guruma", "Te Waza", "Entrata, caricamento e controllo della caduta.", ["Kata Guruma"], "tecnica"),
  activity("nage-sukui", "Sukui Nage", "Te Waza", "Applicazione della tecnica del quarto gruppo del Gokyo.", ["Sukui Nage"], "tecnica"),
  activity("nage-uki-otoshi", "Uki Otoshi", "Te Waza", "Uso preciso del kuzushi senza blocco della gamba.", ["Uki Otoshi"], "tecnica"),
  ...["Uki Goshi", "O Goshi", "Uchi Mata", "Harai Goshi", "Koshi Guruma", "Tsurikomi Goshi", "Tsuri Goshi", "Hane Goshi", "Utsuri Goshi"].map((name) =>
    activity(`nage-${normalize(name).replace(/ /g, "-")}`, name, "Koshi Waza", "Tecnica d’anca: esecuzione in statica, movimento e applicazione.", [name], "tecnica"),
  ),
  ...["De Ashi Barai", "Okuri Ashi Barai", "O Soto Gari", "O Uchi Gari", "Sasae Tsurikomi Ashi", "Hiza Guruma", "Ko Soto Gari", "Ko Uchi Gari", "Ko Soto Gake", "Ashi Guruma", "Harai Tsurikomi Ashi", "O Guruma"].map((name) =>
    activity(`nage-${normalize(name).replace(/ /g, "-")}`, name, "Ashi Waza", "Tecnica di gamba: tempo, direzione e continuità dell’azione.", [name], "tecnica"),
  ),
  ...["Tomoe Nage", "Yoko Otoshi", "Sumi Gaeshi", "Tani Otoshi", "Yoko Tomoe Nage"].map((name) =>
    activity(`nage-${normalize(name).replace(/ /g, "-")}`, name, "Sutemi Waza", "Tecnica di sacrificio con controllo completo di Uke.", [name], "tecnica"),
  ),
  ...["Hane Makikomi", "Soto Makikomi"].map((name) =>
    activity(`nage-${normalize(name).replace(/ /g, "-")}`, name, "Makikomi Waza", "Avvolgimento, sicurezza e controllo della proiezione.", [name], "tecnica"),
  ),
  activity("nage-renraku", "Renraku Waza", "Applicazioni", "Collegare due tecniche mantenendo iniziativa e continuità.", ["Renraku Waza"], "dizionario"),
  activity("nage-gaeshi", "Gaeshi Waza", "Applicazioni", "Riconoscere l’attacco e applicare il contrattacco adeguato.", ["Gaeshi", "Go no Sen"], "dizionario"),
  activity("nage-difese", "Difese e Bogyoho", "Applicazioni", "Difese attive, postura e gestione della presa.", ["Bogyoho", "Shintai"], "dizionario"),
];

const KATAME_3_DAN: Activity[] = [
  ...["Kesa Gatame", "Yoko Shiho Gatame", "Kami Shiho Gatame", "Tate Shiho Gatame", "Ushiro Kesa Gatame", "Kata Gatame", "Makura Kesa Gatame", "Sankaku Gatame"].map((name) =>
    activity(`katame-${normalize(name).replace(/ /g, "-")}`, name, "Osae Waza", "Immobilizzazione, controllo e principali vie d’uscita.", [name], "tecnica"),
  ),
  activity("katame-kuzure", "Forme Kuzure", "Osae Waza", "Studiare le principali varianti delle immobilizzazioni.", ["Kuzure"], "dizionario"),
  ...["Kata Juji Jime", "Nami Juji Jime", "Gyaku Juji Jime", "Hadaka Jime", "Okuri Eri Jime", "Kata Ha Jime", "Ryo Te Jime", "Sankaku Jime", "Tsukkomi Jime"].map((name) =>
    activity(`katame-${normalize(name).replace(/ /g, "-")}`, name, "Shime Waza", "Strangolamento: controllo, sicurezza e resa immediata.", [name], "tecnica"),
  ),
  ...["Ude Garami", "Ude Hishigi Juji Gatame", "Ude Hishigi Ude Gatame", "Ude Hishigi Waki Gatame", "Ude Hishigi Hara Gatame", "Ude Hishigi Hiza Gatame", "Sankaku Gatame"].map((name) =>
    activity(`katame-${normalize(name).replace(/ /g, "-")}`, name, "Kansetsu Waza", "Leva articolare: posizione, controllo e sicurezza.", [name], "tecnica"),
  ),
  activity("katame-hairi", "Hairi Kata", "Applicazioni", "Entrate e transizioni efficaci verso il Ne Waza.", ["Hairi Kata"], "dizionario"),
  activity("katame-renraku", "Renraku Waza a terra", "Applicazioni", "Collegare controlli, strangolamenti e leve.", ["Renraku Waza"], "dizionario"),
  activity("katame-gaeshi", "Gaeshi e Fusegi", "Applicazioni", "Rovesciamenti, difese ed evasione nel Ne Waza.", ["Gaeshi", "Fusegi"], "dizionario"),
];

export interface DanLevelConfig {
  id: DanLevelId;
  label: string;
  kanji: string;
  reading: string;
  eyebrow: string;
  intro: string;
  modules: JourneyModule[];
  storageKey: string;
  quizStorageKey: string;
}

export const DAN_LEVELS_CONFIG: Record<DanLevelId, DanLevelConfig> = {
  1: {
    id: 1,
    label: "1° Dan",
    kanji: "初段の道",
    reading: "Shodan no Dō",
    eyebrow: "Percorso interattivo · FIJLKAM Shodan",
    intro: "La via verso la prima Cintura Nera, passo dopo passo.",
    modules: [
      { id: "fondamenta", number: "1", title: "Fondamenta", subtitle: "Storia, Kano, principi ed etica del Dojo", image: "/media/home/dizionario.webp", activities: FOUNDATION_1_DAN },
      { id: "kata", number: "2", title: "Kata", subtitle: "Nage-no-Kata (Serie 1, 2 e 3)", image: "/media/home/kata.webp", activities: KATA_1_DAN },
      { id: "nage-waza", number: "3", title: "Nage Waza", subtitle: "Gokyo 1° e 2° Kyo, combinazioni e difese", image: "/media/nage.webp", activities: NAGE_1_DAN },
      { id: "katame-waza", number: "4", title: "Katame Waza", subtitle: "Osae, Shime e Kansetsu Waza fondamentali", image: "/media/katame.webp", activities: KATAME_1_DAN },
    ],
    storageKey: "judook_shodan_no_do_progress_v1",
    quizStorageKey: "judook_shodan_no_do_quiz_v1",
  },
  2: {
    id: 2,
    label: "2° Dan",
    kanji: "二段の道",
    reading: "Nidan no Dō",
    eyebrow: "Percorso interattivo · FIJLKAM Nidan",
    intro: "La via verso il 2° Dan, approfondendo tecnica e forma.",
    modules: [
      { id: "fondamenta", number: "1", title: "Fondamenta", subtitle: "Regolamento IJF/FIJLKAM e arbitro", image: "/media/home/dizionario.webp", activities: FOUNDATION_2_DAN },
      { id: "kata", number: "2", title: "Kata", subtitle: "Nage-no-Kata completo e Katame-no-Kata", image: "/media/home/kata.webp", activities: KATA_2_DAN },
      { id: "nage-waza", number: "3", title: "Nage Waza", subtitle: "Gokyo 3° e 4° Kyo, Renraku e Gaeshi", image: "/media/nage.webp", activities: NAGE_2_DAN },
      { id: "katame-waza", number: "4", title: "Katame Waza", subtitle: "Shime e Kansetsu avanzati, Hairi Kata", image: "/media/katame.webp", activities: KATAME_2_DAN },
    ],
    storageKey: "judook_nidan_no_do_progress_v1",
    quizStorageKey: "judook_nidan_no_do_quiz_v1",
  },
  3: {
    id: 3,
    label: "3° Dan",
    kanji: "三段の道",
    reading: "Sandan no Dō",
    eyebrow: "Percorso interattivo · FIJLKAM Sandan 2026",
    intro: "La via verso il 3° Dan, una tappa alla volta.",
    modules: [
      { id: "fondamenta", number: "1", title: "Fondamenta", subtitle: "Storia, filosofia, federazione e arbitraggio", image: "/media/home/dizionario.webp", activities: FOUNDATION_3_DAN },
      { id: "kata", number: "2", title: "Kata", subtitle: "Kodokan Goshin Jutsu e Ju-no-Kata", image: "/media/home/kata.webp", activities: KATA_3_DAN },
      { id: "nage-waza", number: "3", title: "Nage Waza", subtitle: "Gokyo completo, Renraku, Gaeshi e difese", image: "/media/nage.webp", activities: NAGE_3_DAN },
      { id: "katame-waza", number: "4", title: "Katame Waza", subtitle: "Osae, Shime, Kansetsu e applicazioni", image: "/media/katame.webp", activities: KATAME_3_DAN },
    ],
    storageKey: "judook_sandan_no_do_progress_v2",
    quizStorageKey: "judook_sandan_no_do_quiz_v2",
  },
};

const MODULE_POINT_TOTALS: Record<string, number> = {
  fondamenta: 10,
  kata: 20,
  "nage-waza": 35,
  "katame-waza": 35,
};

const getActivityPoints = (module: JourneyModule, item: Activity) => {
  const modulePoints = MODULE_POINT_TOTALS[module.id] || 10;
  const basePoints = Math.floor(modulePoints / module.activities.length);
  const remainder = modulePoints % module.activities.length;
  const index = module.activities.findIndex((a) => a.id === item.id);
  return basePoints + (index < remainder ? 1 : 0);
};

const getActivityLibraryImage = (
  item: Activity,
  module: JourneyModule,
  resources: SandanResource[],
): string => {
  const normTitle = normalize(item.title);
  const normId = normalize(item.id);

  // 1. Direct match in local resources
  const res =
    resources.find((r) => normalize(r.title) === normTitle && r.imageUrl) ||
    item.concepts
      .map((concept) => findMatchingResource(resources, concept, item.kind))
      .find((r) => r?.imageUrl);

  if (res?.imageUrl) return res.imageUrl;

  // 2. Nage Waza dedicated library images
  if (normId.includes("de-ashi")) return "/media/de-ashi-barai.webp";
  if (normId.includes("hiza-guruma")) return "/media/hiza-guruma.webp";
  if (normId.includes("sasae")) return "/media/sasae-tsuri-komi-ashi.webp";
  if (normId.includes("uki-goshi")) return "/media/uki-goshi.webp";
  if (normId.includes("o-soto-gari")) return "/media/o-soto-gari.webp";
  if (normId.includes("o-goshi")) return "/media/o-goshi.webp";
  if (normId.includes("o-uchi-gari")) return "/media/o-uchi-gari.webp";
  if (normId.includes("seoi-nage")) return "/media/seoi-nage.webp";
  if (normId.includes("ko-soto-gari")) return "/media/ko-soto-gari.webp";
  if (normId.includes("ko-uchi-gari")) return "/media/ko-uchi-gari.webp";
  if (normId.includes("koshi-guruma")) return "/media/koshi-guruma.webp";
  if (normId.includes("tsurikomi-goshi") || normId.includes("tsuri-komi")) return "/media/tsuri-komi-goshi.webp";
  if (normId.includes("okuri-ashi")) return "/media/okuri-ashi-barai.webp";
  if (normId.includes("tai-otoshi")) return "/media/tai-otoshi.webp";
  if (normId.includes("harai-goshi")) return "/media/harai-goshi.webp";
  if (normId.includes("uchi-mata")) return "/media/uchi-mata.webp";
  if (normId.includes("tomoe-nage")) return "/media/tomoe-nage.webp";
  if (normId.includes("kata-guruma")) return "/media/kata-guruma.webp";
  if (normId.includes("sumi-gaeshi")) return "/media/sumi-gaeshi.webp";
  if (normId.includes("tani-otoshi")) return "/media/tani-otoshi.webp";
  if (normId.includes("hane-goshi")) return "/media/hane-goshi.webp";
  if (normId.includes("hane-maki")) return "/media/hane-maki-komi.webp";
  if (normId.includes("sukui-nage")) return "/media/sukui-nage.webp";
  if (normId.includes("utsuri-goshi")) return "/media/utsuri-goshi.webp";
  if (normId.includes("ashi-guruma")) return "/media/ashi-guruma.webp";
  if (normId.includes("o-guruma")) return "/media/o-guruma.webp";
  if (normId.includes("soto-makikomi")) return "/media/soto-makikomi.webp";
  if (normId.includes("uki-otoshi")) return "/media/uki-otoshi.webp";
  if (normId.includes("kibisu-gaeshi")) return "/media/kibisu-gaeshi.webp";
  if (normId.includes("ko-uchi-gaeshi")) return "/media/ko-uchi-gaeshi.webp";

  // 3. Katame Waza dedicated library images
  if (normId.includes("hon-kesa")) return "/media/hon-kesa-gatame.webp";
  if (normId.includes("kuzure-kesa")) return "/media/kuzure-kesa-gatame.webp";
  if (normId.includes("kata-gatame")) return "/media/kata-gatame.webp";
  if (normId.includes("kami-shiho")) return "/media/kami-shiho-gatame.webp";
  if (normId.includes("kuzure-kami")) return "/media/kuzure-kami-shiho-gatame.jpg";
  if (normId.includes("yoko-shiho")) return "/media/yoko-shiho-gatame.webp";
  if (normId.includes("tate-shiho")) return "/media/tate-shiho-gatame.webp";
  if (normId.includes("nami-juji")) return "/media/nami-juji-jime.webp";
  if (normId.includes("gyaku-juji")) return "/media/gyaku-juji-jime.webp";
  if (normId.includes("kata-juji")) return "/media/kata-juji-jime.webp";
  if (normId.includes("hadaka-jime")) return "/media/hadaka-jime.webp";
  if (normId.includes("katate-jime")) return "/media/katate-jime.webp";
  if (normId.includes("ude-garami")) return "/media/ude-garami.webp";
  if (normId.includes("juji-gatame")) return "/media/juji-gatame.webp";
  if (normId.includes("ude-gatame")) return "/media/ude-gatame.jpg";
  if (normId.includes("hiza-gatame")) return "/media/hiza-gatame.jpg";
  if (normId.includes("hara-gatame")) return "/media/hara-gatame.jpg";

  // 4. Renraku, Gaeshi, Bogyoho, Shintai
  if (normId.includes("renraku")) return "/media/kibisu-gaeshi.webp";
  if (normId.includes("gaeshi")) return "/media/ko-uchi-gaeshi.webp";
  if (normId.includes("bogyoho") || normId.includes("difese") || normId.includes("postura"))
    return "/media/shintai-ayumi-ashi.webp";
  if (normId.includes("shintai")) return "/media/shintai-ayumi-ashi.webp";

  // 5. Fondamenta & Kata
  if (normId.includes("storia") || normId.includes("kano")) return "/media/kano_i.webp";
  if (normId.includes("federazione") || normId.includes("fijlkam")) return "/media/filkam.webp";
  if (normId.includes("etica") || normId.includes("principi")) return "/media/kano_via.webp";
  if (
    normId.includes("arbitraggio") ||
    normId.includes("termini") ||
    normId.includes("gesti") ||
    normId.includes("regolamento")
  )
    return "/media/arbitraggio.webp";
  if (normId.includes("goshin")) return "/media/goshin-jutsu.webp";
  if (normId.includes("ju-no-kata")) return "/media/ju-no-kata.webp";
  if (normId.includes("nage-no-kata")) return "/media/kata.webp";
  if (normId.includes("katame-no-kata")) return "/media/katame.webp";

  return module.image || "/media/gokyo-no-waza.webp";
};

// All sections unlocked freely as requested by user
const moduleIsUnlocked = (_results: ActivityResults, _moduleIndex: number) => true;

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

const DEFAULT_FALLBACK_QUESTIONS: SandanQuizQuestion[] = ALL_SANDAN_QUIZ_QUESTIONS;

const quizQuestionText = (question: SandanQuizQuestion) =>
  normalize(
    [
      question.category,
      question.question,
      question.explanation,
      ...question.options,
    ].join(" "),
  );

const hasQuizWord = (text: string, words: string[]) => {
  const t = ` ${normalize(text)} `;
  for (const w of words) {
    const nw = normalize(w);
    if (nw.includes(" ")) {
      if (t.includes(nw)) return true;
    } else {
      if (t.includes(` ${nw} `)) return true;
    }
  }
  return false;
};

const getQuizQuestionsForActivity = (
  questions: SandanQuizQuestion[],
  activity: Activity,
  _module?: JourneyModule,
  _danId?: number,
): SandanQuizQuestion[] => {
  if (!questions || questions.length === 0) return [];

  const normId = normalize(activity.id);
  const normTitle = normalize(activity.title);
  const normConcepts = (activity.concepts || []).map(normalize);

  // 1. Fondamenta: Storia & Jigoro Kano
  if (normId.includes("storia")) {
    const direct = questions.filter((q) => {
      const cat = normalize(q.category);
      const text = quizQuestionText(q);
      return (
        cat === "storia" ||
        hasQuizWord(text, [
          "jigoro kano",
          "1882",
          "1887",
          "1895",
          "1938",
          "1951",
          "1964",
          "1972",
          "hikawa maru",
          "tenshin shinyo",
          "kito ryu",
          "jiro nango",
          "inghilterra",
          "olimpiadi",
          "olimpico",
          "origini",
          "declino",
          "morte di kano",
          "maestro kano",
        ])
      );
    });
    if (direct.length > 0) return direct;
  }

  // 2. Fondamenta: Federazione (FIJLKAM, FILPJK, IJF, gradi Dan, CONI)
  if (normId.includes("federazione")) {
    const direct = questions.filter((q) => {
      const text = quizQuestionText(q);
      return hasQuizWord(text, [
        "fijlkam",
        "filpjk",
        "filpj",
        "fiap",
        "international judo federation",
        "federazione",
        "coni",
        "ezio gamba",
        "esame di 1 dan",
        "esame di 2 dan",
        "per 5 dan",
        "per 4 dan",
        "per 1 dan",
        "per 2 dan",
        "denominazione attuale",
      ]);
    });
    if (direct.length > 0) return direct;
  }

  // 3. Fondamenta: Etica & Principi (Seiryoku Zen'yo, Jita Kyoei, Rei, Dojo, Mushin, Zanshin)
  if (
    normId.includes("etica") ||
    normId.includes("principi") ||
    normId.includes("filosofia")
  ) {
    const direct = questions.filter((q) => {
      const cat = normalize(q.category);
      const text = quizQuestionText(q);
      return (
        cat === "principi" ||
        hasQuizWord(text, [
          "seiryoku zen yo",
          "jita kyoei",
          "cedevolezza",
          "mushin",
          "zanshin",
          "spirito",
          "carattere",
          "rispetto",
          "dojo",
          "rei",
          "benessere",
          "mutuo beneficio",
          "massima efficienza",
          "principi fondamentali del judo",
        ])
      );
    });
    if (direct.length > 0) return direct;
  }

  // 4. Fondamenta: Termini Arbitrali (Lessico giapponese arbitrale)
  if (normId.includes("termini")) {
    const direct = questions.filter((q) => {
      const cat = normalize(q.category);
      const text = quizQuestionText(q);
      return (
        cat === "terminologia" ||
        hasQuizWord(text, [
          "matte",
          "hajime",
          "sono mama",
          "yoshi",
          "ippon",
          "waza ari",
          "osaekomi",
          "ma ai",
          "ri ai",
          "renzoku waza",
          "cosa significa",
          "si traduce",
          "cosa indica",
        ])
      );
    });
    if (direct.length > 0) return direct;
  }

  // 5. Fondamenta: Gesti Arbitrali (Segnalazioni e comandi arbitrali)
  if (normId.includes("gesti")) {
    const direct = questions.filter((q) => {
      const text = quizQuestionText(q);
      return hasQuizWord(text, [
        "comando dell arbitro",
        "stop",
        "matte",
        "osaekomi",
        "waza ari",
        "ippon",
        "arbitro",
        "segnalazione",
        "gesto",
        "durata osaekomi",
        "secondi",
      ]);
    });
    if (direct.length > 0) return direct;
  }

  // 6. Fondamenta: Regolamento di Gara (Punteggi, sanzioni Shido/Hansoku, tempi)
  if (normId.includes("regolamento")) {
    const direct = questions.filter((q) => {
      const cat = normalize(q.category);
      const text = quizQuestionText(q);
      return (
        cat === "regolamenti" ||
        hasQuizWord(text, [
          "regolamento",
          "regolamenti",
          "secondi",
          "durata osaekomi",
          "shido",
          "hansoku make",
          "punteggio",
          "sanzione",
          "ijf",
        ])
      );
    });
    if (direct.length > 0) return direct;
  }

  // 7. Kata: Kodokan Goshin Jutsu
  if (
    normId.includes("goshin") ||
    normTitle.includes("goshin") ||
    normConcepts.some((c) => c.includes("goshin"))
  ) {
    const direct = questions.filter((q) => {
      const text = quizQuestionText(q);
      return hasQuizWord(text, [
        "goshin jutsu",
        "autodifesa",
        "armi",
        "toshu no bu",
        "buki no bu",
        "ganmen tsuki",
        "naname uchi",
        "ago tsuki",
        "ryote dori",
        "kakae dori",
        "kata ude dori",
        "ushiro jime",
        "pistola",
        "coltello",
        "bastone",
      ]);
    });
    if (direct.length > 0) return direct;
  }

  // 8. Kata: Ju-no-Kata
  if (
    normId.includes("ju") ||
    normTitle.includes("ju-no-kata") ||
    normConcepts.some((c) => c.includes("ju no kata"))
  ) {
    const direct = questions.filter((q) => {
      const text = quizQuestionText(q);
      return hasQuizWord(text, ["ju no kata", "cedevolezza", "flessibilita"]);
    });
    if (direct.length > 0) return direct;
  }

  // 9. Kata: Nage-no-Kata
  if (
    normId.includes("nage-no-kata") ||
    normId.includes("kata-te") ||
    normId.includes("kata-koshi") ||
    normId.includes("kata-nage-full") ||
    normConcepts.some((c) => c.includes("nage no kata"))
  ) {
    const direct = questions.filter((q) => {
      const text = quizQuestionText(q);
      return hasQuizWord(text, [
        "nage no kata",
        "te waza",
        "koshi waza",
        "ashi waza",
        "ma sutemi",
        "yoko sutemi",
        "quarto set",
        "prima serie",
        "cinque serie",
        "cinque gruppi",
      ]);
    });
    if (direct.length > 0) return direct;
  }

  // 10. Kata: Katame-no-Kata
  if (
    normId.includes("katame-no-kata") ||
    normId.includes("kata-katame-full") ||
    normConcepts.some((c) => c.includes("katame no kata"))
  ) {
    const direct = questions.filter((q) => {
      const text = quizQuestionText(q);
      return hasQuizWord(text, [
        "katame no kata",
        "osaekomi waza",
        "shime waza",
        "kansetsu waza",
        "15 tecniche",
        "quindici tecniche",
      ]);
    });
    if (direct.length > 0) return direct;
  }

  // 11. Nage Waza Techniques -> Generated directly from Judo Dictionary (e.g. HANE -> Ala, slancio...)
  const isNageWaza =
    _module?.id === "nage-waza" ||
    normId.includes("nage") ||
    normId.includes("gokyo") ||
    normId.includes("te-waza") ||
    normId.includes("koshi-waza") ||
    normId.includes("ashi-waza") ||
    normId.includes("sutemi-waza") ||
    normId.includes("makikomi") ||
    normId.includes("renraku") ||
    normId.includes("gaeshi") ||
    normId.includes("bogyoho") ||
    normId.includes("difese") ||
    (activity.kind === "tecnica" &&
      !normId.includes("katame") &&
      !normId.includes("osae") &&
      !normId.includes("shime") &&
      !normId.includes("kansetsu"));

  if (isNageWaza) {
    const dictQuestions = generateNageDictionaryQuestions(activity);
    if (dictQuestions.length > 0) return dictQuestions;
  }

  // 12. Katame Waza Techniques -> Generated directly from Judo Dictionary (e.g. KESA -> Di traverso, HON -> Base, UDE -> Braccio...)
  const isKatameWaza =
    _module?.id === "katame-waza" ||
    normId.includes("katame") ||
    normId.includes("osae") ||
    normId.includes("shime") ||
    normId.includes("jime") ||
    normId.includes("kansetsu") ||
    normId.includes("terra") ||
    normId.includes("hairi") ||
    normId.includes("fusegi") ||
    normId.includes("uscite") ||
    normId.includes("transizioni");

  if (isKatameWaza) {
    const dictQuestions = generateKatameDictionaryQuestions(activity);
    if (dictQuestions.length > 0) return dictQuestions;
  }

  return questions;
};

const selectRandomQuizQuestions = (
  questions: SandanQuizQuestion[],
  activity: Activity,
  module?: JourneyModule,
  danId?: number,
  excludedIds: string[] = [],
) => {
  const candidates = getQuizQuestionsForActivity(
    questions,
    activity,
    module,
    danId,
  );
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
  fallbackCandidates: SandanQuizQuestion[] = [],
) => {
  if (!attempt || attempt.questionIds.length === 0) {
    return { total: 0, answered: 0, correct: 0, wrong: 0 };
  }
  const pool = [...fallbackCandidates, ...questions];
  const selectedQuestions = attempt.questionIds
    .map((id) => pool.find((question) => question.id === id))
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
  module: JourneyModule,
  item: Activity,
  results: ActivityResults,
  progress: QuizProgress,
  questions: SandanQuizQuestion[],
) => {
  const points = getActivityPoints(module, item);
  const quizCandidates = getQuizQuestionsForActivity(questions, item, module);
  const stats = getQuizStats(progress[item.id], questions, quizCandidates);

  if (
    quizCandidates.length > 0 &&
    stats.total > 0 &&
    stats.answered === stats.total
  ) {
    return Math.round(((points * stats.correct) / stats.total) * 10) / 10;
  }
  const val = results[item.id];
  if (typeof val === "number") return val;
  return val === "correct" ? points : 0;
};

const getModuleScoreCalculated = (
  module: JourneyModule,
  overrides: Record<string, number>,
  results: ActivityResults,
  progress: QuizProgress,
  questions: SandanQuizQuestion[],
) => {
  if (overrides[module.id] !== undefined) {
    return overrides[module.id];
  }
  let totalScore = 0;
  module.activities.forEach((item) => {
    totalScore += getActivityEarnedPoints(
      module,
      item,
      results,
      progress,
      questions,
    );
  });
  return Math.round(totalScore * 10) / 10;
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
    questions:
      questions.length > 0 ? questions : ALL_SANDAN_QUIZ_QUESTIONS,
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

  const clientQuestions = useSignal<SandanQuizQuestion[]>([]);
  const allQuizQuestions = useComputed$(() => {
    if (clientQuestions.value.length > 0) return clientQuestions.value;
    if (data.value.questions && data.value.questions.length > 0)
      return data.value.questions;
    return DEFAULT_FALLBACK_QUESTIONS;
  });

  const activeDanLevel = useSignal<DanLevelId>(3);
  const activityResults = useSignal<ActivityResults>({});
  const quizProgress = useSignal<QuizProgress>({});
  const moduleOverrides = useSignal<Record<string, number>>({});
  const expandedModule = useSignal("");
  const selectedResource = useSignal<SandanResource | null>(null);
  const selectedActivity = useSignal<Activity | null>(null);
  const selectedQuizActivity = useSignal<Activity | null>(null);
  const selectedQuizQuestions = useSignal<SandanQuizQuestion[]>([]);

  const currentConfig = useComputed$(
    () => DAN_LEVELS_CONFIG[activeDanLevel.value],
  );
  const currentModules = useComputed$(() => currentConfig.value.modules);
  const allActivities = useComputed$(() =>
    currentModules.value.flatMap((m) => m.activities),
  );

  const loadProgressForLevel = $((danId: DanLevelId) => {
    const config = DAN_LEVELS_CONFIG[danId];
    try {
      const saved = JSON.parse(
        localStorage.getItem(config.storageKey) || "null",
      );
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        activityResults.value = Object.fromEntries(
          Object.entries(saved).filter(
            ([id, result]) =>
              config.modules.some((m) =>
                m.activities.some((a) => a.id === id),
              ) &&
              (result === "correct" ||
                result === "error" ||
                typeof result === "number"),
          ),
        ) as ActivityResults;
      } else {
        activityResults.value = {};
      }
    } catch {
      activityResults.value = {};
    }

    try {
      const savedQuiz = JSON.parse(
        localStorage.getItem(config.quizStorageKey) || "{}",
      );
      if (savedQuiz && typeof savedQuiz === "object") {
        quizProgress.value = savedQuiz as QuizProgress;
      } else {
        quizProgress.value = {};
      }
    } catch {
      quizProgress.value = {};
    }

    try {
      const savedOverrides = JSON.parse(
        localStorage.getItem(`${config.storageKey}_overrides`) || "{}",
      );
      if (savedOverrides && typeof savedOverrides === "object") {
        moduleOverrides.value = savedOverrides as Record<string, number>;
      } else {
        moduleOverrides.value = {};
      }
    } catch {
      moduleOverrides.value = {};
    }
  });

  const setModuleOverride = $((moduleId: string, overrideScore: number) => {
    const next = { ...moduleOverrides.value, [moduleId]: overrideScore };
    moduleOverrides.value = next;
    localStorage.setItem(
      `${currentConfig.value.storageKey}_overrides`,
      JSON.stringify(next),
    );
  });

  const clearModuleOverride = $((moduleId: string) => {
    const next = { ...moduleOverrides.value };
    delete next[moduleId];
    moduleOverrides.value = next;
    localStorage.setItem(
      `${currentConfig.value.storageKey}_overrides`,
      JSON.stringify(next),
    );
  });

  useVisibleTask$(async () => {
    try {
      const savedDan = Number(
        localStorage.getItem("judook_active_dan_level"),
      ) as DanLevelId;
      if (savedDan === 1 || savedDan === 2 || savedDan === 3) {
        activeDanLevel.value = savedDan;
      }
    } catch {}

    appState.sectionTitle = currentConfig.value.kanji;
    appState.sectionIcon = undefined;
    loadProgressForLevel(activeDanLevel.value);

    // Client-side fallback sync with PocketBase if loader had 0 questions
    if (data.value.questions.length === 0 || clientQuestions.value.length === 0) {
      try {
        const questionRecords = await pb
          .collection("domande_quiz")
          .getFullList({ requestKey: null });
        if (questionRecords && questionRecords.length > 0) {
          clientQuestions.value = questionRecords.map((record: any) => {
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
        }
      } catch (err) {
        console.warn("[Sandan Quiz] Errore sincronizzazione client domande:", err);
      }
    }
  });

  const changeDanLevel = $((danId: DanLevelId) => {
    activeDanLevel.value = danId;
    appState.sectionTitle = DAN_LEVELS_CONFIG[danId].kanji;
    try {
      localStorage.setItem("judook_active_dan_level", String(danId));
    } catch {}
    expandedModule.value = "";
    loadProgressForLevel(danId);
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
      Object.values(activityResults.value).filter(
        (result) =>
          result === "error" || (typeof result === "number" && result === 0),
      ).length,
  );

  const moduleEvaluatedCount = (module: JourneyModule) =>
    module.activities.filter((item) => activityResults.value[item.id] !== undefined)
      .length;

  const moduleErrorCount = (module: JourneyModule) =>
    module.activities.filter(
      (item) =>
        activityResults.value[item.id] === "error" ||
        (typeof activityResults.value[item.id] === "number" &&
          (activityResults.value[item.id] as number) === 0),
    ).length;

  const moduleScore = (module: JourneyModule) =>
    getModuleScoreCalculated(
      module,
      moduleOverrides.value,
      activityResults.value,
      quizProgress.value,
      allQuizQuestions.value,
    );

  const score = useComputed$(() => {
    let totalScore = 0;
    currentModules.value.forEach((module) => {
      totalScore += getModuleScoreCalculated(
        module,
        moduleOverrides.value,
        activityResults.value,
        quizProgress.value,
        allQuizQuestions.value,
      );
    });
    return Math.round(totalScore * 10) / 10;
  });

  const findResource = (concept: string, preferredKind?: ResourceKind) => {
    return findMatchingResource(data.value.resources, concept, preferredKind);
  };

  const openConcept = $((activityId: string, concept: string) => {
    const item =
      allActivities.value.find((candidate) => candidate.id === activityId) ||
      null;
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

  const openActivityQuiz = $((activityId: string) => {
    const item = allActivities.value.find(
      (candidate) => candidate.id === activityId,
    );
    if (!item) return;

    const currentQuestionsPool = allQuizQuestions.value;
    const module = currentModules.value.find((m) =>
      m.activities.some((a) => a.id === activityId),
    );
    const candidates = getQuizQuestionsForActivity(
      currentQuestionsPool,
      item,
      module,
      activeDanLevel.value,
    );
    const candidateIds = new Set(candidates.map((q) => q.id));

    const savedAttempt = quizProgress.value[activityId];
    const savedQuestions = savedAttempt?.questionIds
      .map((id) =>
        candidates.find((question) => question.id === id) ||
        currentQuestionsPool.find((question) => question.id === id),
      )
      .filter(
        (question): question is SandanQuizQuestion =>
          Boolean(question && candidateIds.has(question.id)),
      );

    if (savedAttempt && savedQuestions && savedQuestions.length >= 3) {
      selectedQuizQuestions.value = savedQuestions;
    } else {
      const questions = selectRandomQuizQuestions(
        currentQuestionsPool,
        item,
        module,
        activeDanLevel.value,
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
        currentConfig.value.quizStorageKey,
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

  const restartActivityQuiz = $(() => {
    const item = selectedQuizActivity.value;
    if (!item) return;
    const currentQuestionsPool = allQuizQuestions.value;
    const previousIds = quizProgress.value[item.id]?.questionIds || [];
    const module = currentModules.value.find((m) =>
      m.activities.some((a) => a.id === item.id),
    );
    const questions = selectRandomQuizQuestions(
      currentQuestionsPool,
      item,
      module,
      activeDanLevel.value,
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
    localStorage.setItem(
      currentConfig.value.quizStorageKey,
      JSON.stringify(nextQuizProgress),
    );

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
    localStorage.setItem(
      currentConfig.value.quizStorageKey,
      JSON.stringify(nextQuizProgress),
    );

    const module =
      currentModules.value.find((m) =>
        m.activities.some((a) => a.id === item.id),
      ) || currentModules.value[0];
    const candidates = getQuizQuestionsForActivity(
      allQuizQuestions.value,
      item,
      module,
      activeDanLevel.value,
    );
    const stats = getQuizStats(
      attempt,
      allQuizQuestions.value,
      selectedQuizQuestions.value.length > 0
        ? selectedQuizQuestions.value
        : candidates,
    );
    const points = getActivityPoints(module, item);

    const nextResults = { ...activityResults.value };
    if (stats.total > 0 && stats.answered === stats.total) {
      const earned = Math.round(((points * stats.correct) / stats.total) * 10) / 10;
      nextResults[item.id] = earned;
    }
    activityResults.value = nextResults;
    localStorage.setItem(
      currentConfig.value.storageKey,
      JSON.stringify(nextResults),
    );
  });

  const setActivityResult = $(
    (activityId: string, result: ActivityResult) => {
      const next = { ...activityResults.value };
      if (next[activityId] === result) delete next[activityId];
      else next[activityId] = result;
      activityResults.value = next;
      localStorage.setItem(
        currentConfig.value.storageKey,
        JSON.stringify(next),
      );
    },
  );

  const continueJourney = $(() => {
    const next = allActivities.value.find(
      (item) => activityResults.value[item.id] === undefined,
    );
    const reviewItem =
      next ||
      allActivities.value.find(
        (item) =>
          activityResults.value[item.id] === "error" ||
          (typeof activityResults.value[item.id] === "number" &&
            (activityResults.value[item.id] as number) === 0),
      );
    if (!reviewItem) return;
    const module = currentModules.value.find((candidate) =>
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
    if (
      !window.confirm(
        `Vuoi azzerare tutti i progressi di ${currentConfig.value.label} (${currentConfig.value.kanji})?`,
      )
    )
      return;
    activityResults.value = {};
    quizProgress.value = {};
    expandedModule.value = "";
    localStorage.removeItem(currentConfig.value.storageKey);
    localStorage.removeItem(currentConfig.value.quizStorageKey);
  });

  const modalLink = (resource: SandanResource) => {
    if (resource.kind === "kata") return `/kata/${resource.slug}`;
    if (resource.kind === "tecnica")
      return `/tecniche?search=${encodeURIComponent(resource.title)}`;
    return `/dizionario?search=${encodeURIComponent(resource.title)}`;
  };

  const nextActivity = () =>
    allActivities.value.find(
      (item) => activityResults.value[item.id] === undefined,
    ) ||
    allActivities.value.find(
      (item) =>
        activityResults.value[item.id] === "error" ||
        (typeof activityResults.value[item.id] === "number" &&
          (activityResults.value[item.id] as number) === 0),
    );

  return (
    <div class="sandan-page">
      {/* Selettore di Grado DAN (1°, 2°, 3° Dan) */}
      <div class="sandan-level-selector" aria-label="Seleziona il grado DAN">
        {([1, 2, 3] as DanLevelId[]).map((danId) => {
          const cfg = DAN_LEVELS_CONFIG[danId];
          const isActive = activeDanLevel.value === danId;
          return (
            <button
              key={danId}
              type="button"
              class={`sandan-level-btn ${isActive ? "is-active" : ""}`}
              onClick$={() => changeDanLevel(danId)}
            >
              <strong>{cfg.label}</strong>
              <small>{cfg.kanji}</small>
            </button>
          );
        })}
      </div>

      <section class="sandan-hero" aria-labelledby="sandan-title">
        <img
          src="/media/sandan-no-do.webp"
          alt={`Logo ${currentConfig.value.kanji}`}
          class="sandan-logo"
          width={487}
          height={512}
        />
        <div class="sandan-hero-copy">
          <p class="sandan-eyebrow">{currentConfig.value.eyebrow}</p>
          <h1 id="sandan-title">{currentConfig.value.kanji}</h1>
          <p class="sandan-reading">{currentConfig.value.reading}</p>
          <p class="sandan-intro">{currentConfig.value.intro}</p>
        </div>
      </section>

      {/* Top Overview Progress Widget matching layout mockup */}
      <section
        class="sandan-overview-widget"
        aria-label="Progresso generale nel percorso"
      >
        <div class="sandan-trophy-avatar" aria-hidden="true">
          🏆
        </div>
        <div class="sandan-overview-content">
          <div class="sandan-overview-header">
            <span class="sandan-overview-title">Progresso generale</span>
            <div class="sandan-overview-count">
              <strong>
                {evaluatedCount.value} / {allActivities.value.length}
              </strong>
              <small>Quiz completati ({formatPoints(score.value)}/100 pt)</small>
            </div>
          </div>
          <div class="sandan-overview-bar">
            <div
              class="sandan-overview-fill"
              style={{
                width: `${Math.min(100, Math.max(0, (score.value / 100) * 100))}%`,
              }}
            />
          </div>
        </div>
        {evaluatedCount.value > 0 && (
          <button class="sandan-reset" type="button" onClick$={resetProgress} title="Azzera progressi">
            Azzera
          </button>
        )}
      </section>

      {data.value.error && (
        <p class="sandan-data-warning">{data.value.error}</p>
      )}

      <section
        class="sandan-timeline"
        aria-label={`Timeline del percorso ${currentConfig.value.label}`}
      >
        {currentModules.value.map((module, moduleIndex) => {
          const evaluated = moduleEvaluatedCount(module);
          const errors = moduleErrorCount(module);
          const points = moduleScore(module);
          const isReviewed = evaluated === module.activities.length;
          const isComplete = isReviewed && errors === 0;
          const isExpanded = expandedModule.value === module.id;
          const groups = [
            ...new Set(module.activities.map((item) => item.group)),
          ];

          return (
            <article
              key={module.id}
              class={`sandan-milestone is-unlocked ${isComplete ? "is-complete" : ""} ${isReviewed && errors > 0 ? "has-errors" : ""}`}
            >
              <div class="sandan-node" aria-hidden="true">
                {module.number}
              </div>
              <div class="sandan-card">
                <button
                  type="button"
                  class="sandan-card-header"
                  aria-expanded={isExpanded}
                  onClick$={() => {
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
                    class={`sandan-status ${isComplete ? "complete" : "active"}`}
                  >
                    {isComplete
                      ? "Acquisito"
                      : isReviewed && errors > 0
                        ? `${errors} errori`
                        : isExpanded
                          ? "Riduci"
                          : "Apri"}
                  </span>
                </button>

                {isExpanded && (
                  <div class="sandan-activity-panel">
                    {/* Slider cumulativo per forzare il punteggio del modulo */}
                    <div class="sandan-cumulative-slider-box">
                      <div class="sandan-cumulative-header">
                        <span class="sandan-cumulative-title">
                          🎚️ <strong>Punteggio Cumulativo {module.title}</strong>
                          {moduleOverrides.value[module.id] !== undefined && (
                            <span class="sandan-override-badge">Modificato manualmente</span>
                          )}
                        </span>
                        <div class="sandan-cumulative-score">
                          <strong>{formatPoints(points)}</strong> / {MODULE_POINT_TOTALS[module.id]} pt
                          {moduleOverrides.value[module.id] !== undefined && (
                            <button
                              type="button"
                              class="sandan-override-reset-btn"
                              onClick$={() => clearModuleOverride(module.id)}
                              title="Ripristina calcolo automatico dalle singole tappe"
                            >
                              Ripristina
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        class="sandan-score-slider w-full accent-[var(--sandan-red)] cursor-pointer h-2.5 rounded-lg bg-[var(--sandan-border)]"
                        min="0"
                        max={MODULE_POINT_TOTALS[module.id] || 35}
                        step="0.5"
                        value={points}
                        onInput$={(e) =>
                          setModuleOverride(
                            module.id,
                            parseFloat((e.target as HTMLInputElement).value),
                          )
                        }
                      />
                    </div>

                    {groups.map((group) => (
                      <div
                        class="sandan-activity-group"
                        key={`${module.id}-${group}`}
                      >
                        <h2>{group}</h2>
                        <div class="sandan-activities-grid">
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
                              const thumbnail = getActivityLibraryImage(
                                item,
                                module,
                                data.value.resources,
                              );
                              const points = getActivityPoints(module, item);
                              const quizCandidates = getQuizQuestionsForActivity(
                                allQuizQuestions.value,
                                item,
                                module,
                                activeDanLevel.value,
                              );
                              const hasQuiz = quizCandidates.length > 0;
                              const quizStats = getQuizStats(
                                quizProgress.value[item.id],
                                allQuizQuestions.value,
                                quizCandidates,
                              );

                              const rawResult = activityResults.value[item.id];
                              const currentScore =
                                typeof rawResult === "number"
                                  ? rawResult
                                  : rawResult === "correct"
                                    ? points
                                    : 0;

                              const isAssessed = rawResult !== undefined;
                              const isFullyCorrect =
                                isAssessed &&
                                (rawResult === "correct" ||
                                  currentScore === points);
                              const isError =
                                isAssessed &&
                                (rawResult === "error" ||
                                  (typeof rawResult === "number" &&
                                    currentScore === 0));
                              const isPartial =
                                isAssessed &&
                                typeof rawResult === "number" &&
                                currentScore > 0 &&
                                currentScore < points;

                              const isPassed =
                                isFullyCorrect ||
                                (quizStats.answered > 0 &&
                                  quizStats.correct ===
                                    (quizStats.total || 3));

                              return (
                                <div
                                  id={`activity-${item.id}`}
                                  class={`sandan-card-modern ${isFullyCorrect ? "is-correct" : isError ? "is-error" : isPartial ? "is-partial" : ""}`}
                                  key={item.id}
                                >
                                  {/* 1. Header: Thumbnail + Meta + Score Badge */}
                                  <div class="sandan-card-header">
                                    <div class="sandan-card-thumb-box">
                                      <img
                                        src={thumbnail}
                                        alt={`Miniatura ${item.title}`}
                                        class="sandan-card-thumb"
                                        width={58}
                                        height={58}
                                        loading="lazy"
                                        onError$={(event) => {
                                          (
                                            event.target as HTMLImageElement
                                          ).src = module.image;
                                        }}
                                      />
                                    </div>

                                    <div class="sandan-card-meta">
                                      <h3 class="sandan-card-title">
                                        {item.title}
                                      </h3>
                                      <p class="sandan-card-desc">
                                        {item.summary}
                                      </p>
                                      <div
                                        class={`sandan-card-pill ${quizStats.answered > 0 ? "is-done" : ""}`}
                                      >
                                        {quizStats.answered > 0
                                          ? `Quiz (${quizStats.correct}/${quizStats.total || 3} corrette)`
                                          : `Domanda 1 di ${Math.min(3, quizCandidates.length || 3)}`}
                                      </div>
                                    </div>

                                    <div
                                      class={`sandan-card-score-badge ${isPassed ? "is-passed" : ""}`}
                                    >
                                      <span class="sandan-card-score-ratio">
                                        {quizStats.answered > 0
                                          ? `${quizStats.correct}/${quizStats.total || 3}`
                                          : `0/${Math.min(3, quizCandidates.length || 3)}`}
                                      </span>
                                      <span class="sandan-card-score-pts">
                                        +{points} pt
                                      </span>
                                    </div>
                                  </div>

                                  {/* 2. Big Prominent Action: Avvia Quiz */}
                                  {hasQuiz && (
                                    <button
                                      type="button"
                                      class={`sandan-card-quiz-btn ${quizStats.answered > 0 ? "is-retake" : ""}`}
                                      onClick$={() => openActivityQuiz(item.id)}
                                      title={`Avvia il quiz di verifica su ${item.title}`}
                                    >
                                      <span class="sandan-card-quiz-play">
                                        ▶
                                      </span>
                                      <span>
                                        {quizStats.answered > 0
                                          ? "Ripeti Quiz"
                                          : "Avvia Quiz"}
                                      </span>
                                    </button>
                                  )}

                                  {/* 3. Action Buttons Row: Corretto (Ho capito) & Da rivedere (Ripassa dopo) */}
                                  <div class="sandan-card-actions-row">
                                    <button
                                      type="button"
                                      class={`sandan-btn-action sandan-btn-corretto ${isFullyCorrect ? "is-active" : ""}`}
                                      aria-pressed={isFullyCorrect}
                                      onClick$={() =>
                                        setActivityResult(item.id, points)
                                      }
                                    >
                                      <span class="sandan-btn-icon">✓</span>
                                      <span class="sandan-btn-texts">
                                        <strong>Corretto</strong>
                                        <small>Ho capito</small>
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      class={`sandan-btn-action sandan-btn-rivedere ${isError ? "is-active" : ""}`}
                                      aria-pressed={isError}
                                      onClick$={() =>
                                        setActivityResult(item.id, 0)
                                      }
                                    >
                                      <span class="sandan-btn-icon">↻</span>
                                      <span class="sandan-btn-texts">
                                        <strong>Da rivedere</strong>
                                        <small>Ripassa dopo</small>
                                      </span>
                                    </button>
                                  </div>

                                  {/* 4. Manual Stepper Row: Voto manuale [-] X pt [+] */}
                                  <div class="sandan-card-stepper-box">
                                    <div class="sandan-stepper-label">
                                      <span>Voto manuale</span>
                                    </div>
                                    <div class="sandan-stepper-controls">
                                      <button
                                        type="button"
                                        class="sandan-stepper-btn minus"
                                        disabled={currentScore <= 0}
                                        aria-label="Diminuisci voto"
                                        onClick$={() => {
                                          const step = points > 1 ? 0.5 : 1;
                                          const nextVal = Math.max(
                                            0,
                                            Math.round((currentScore - step) * 10) /
                                              10,
                                          );
                                          setActivityResult(item.id, nextVal);
                                        }}
                                      >
                                        −
                                      </button>
                                      <span class="sandan-stepper-value">
                                        {formatPoints(currentScore)} pt
                                      </span>
                                      <button
                                        type="button"
                                        class="sandan-stepper-btn plus"
                                        disabled={currentScore >= points}
                                        aria-label="Aumenta voto"
                                        onClick$={() => {
                                          const step = points > 1 ? 0.5 : 1;
                                          const nextVal = Math.min(
                                            points,
                                            Math.round((currentScore + step) * 10) /
                                              10,
                                          );
                                          setActivityResult(item.id, nextVal);
                                        }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  {/* 5. Concepts links if available */}
                                  {availableConcepts.length > 0 && (
                                    <div class="sandan-card-concepts">
                                      {availableConcepts.map((concept) => (
                                        <button
                                          type="button"
                                          class="sandan-concept-chip"
                                          key={`${item.id}-${concept}`}
                                          title={`Scopri il contenuto: ${concept}`}
                                          onClick$={() =>
                                            openConcept(item.id, concept)
                                          }
                                        >
                                          📖 {concept}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
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
                {evaluatedCount.value === allActivities.value.length
                  ? "Da ripassare"
                  : "Prossima tappa"}
              </span>
              <strong>{nextActivity()?.title}</strong>
              <small>
                {evaluatedCount.value === allActivities.value.length
                  ? "Trasforma gli errori in competenze acquisite per arrivare a 100/100."
                  : "Valuta la voce e avanza nel percorso."}
              </small>
            </div>
            <button type="button" onClick$={continueJourney}>
              {evaluatedCount.value === allActivities.value.length
                ? "Ripassa"
                : "Continua"}
            </button>
          </>
        ) : (
          <div class="sandan-finished">
            <span>Percorso completato</span>
            <strong>
              Il tuo percorso per il {currentConfig.value.label} è completo: 100/100.
            </strong>
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
                <span>Quiz di verifica · {selectedQuizActivity.value.group}</span>
                <h2 id="sandan-quiz-title">
                  {selectedQuizActivity.value.title}
                </h2>
                <p>
                  Tre domande di verifica tecnica e teorica per {currentConfig.value.label}.
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
                        allQuizQuestions.value,
                        selectedQuizQuestions.value,
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
                        ? (getActivityPoints(
                            currentModules.value.find((m) =>
                              m.activities.some(
                                (a) => a.id === selectedQuizActivity.value!.id,
                              ),
                            ) || currentModules.value[0],
                            selectedQuizActivity.value,
                          ) *
                            getQuizStats(
                              quizProgress.value[
                                selectedQuizActivity.value.id
                              ],
                              allQuizQuestions.value,
                              selectedQuizQuestions.value,
                            ).correct) /
                            selectedQuizQuestions.value.length
                        : 0,
                    )}
                    /{getActivityPoints(
                      currentModules.value.find((m) =>
                        m.activities.some(
                          (a) => a.id === selectedQuizActivity.value!.id,
                        ),
                      ) || currentModules.value[0],
                      selectedQuizActivity.value,
                    )}
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
                    getActivityPoints(
                      currentModules.value.find((m) =>
                        m.activities.some(
                          (a) => a.id === selectedQuizActivity.value!.id,
                        ),
                      ) || currentModules.value[0],
                      selectedQuizActivity.value!,
                    ) / selectedQuizQuestions.value.length;

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
                onClick$={restartActivityQuiz}
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
  title: "Percorso Dan - JudoOK",
  meta: [
    {
      name: "description",
      content:
        "Percorso gamificato e interattivo per preparare i programmi tecnici FIJLKAM del 1°, 2° e 3° Dan di Judo.",
    },
  ],
};
