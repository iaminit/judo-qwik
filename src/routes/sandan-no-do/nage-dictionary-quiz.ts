import type { SandanQuizQuestion } from "./index";

export interface DictionaryTerm {
  term: string;
  kanji: string;
  definition: string;
}

export const JUDO_DICTIONARY_DEFINITIONS: Record<string, DictionaryTerm> = {
  // --- NAGE WAZA TERMS ---
  hane: {
    term: "Hane",
    kanji: "跳",
    definition: "Ala, slancio. Movimento di slancio verso l'alto come in Hane Goshi.",
  },
  goshi: {
    term: "Goshi",
    kanji: "腰",
    definition: "Anca. Parte del corpo utilizzata come fulcro nelle tecniche d'anca (Koshi-waza).",
  },
  koshi: {
    term: "Koshi",
    kanji: "腰",
    definition: "Anca, vita. Parte del corpo centrale utilizzata nelle tecniche d'anca (Koshi-waza).",
  },
  seoi: {
    term: "Seoi",
    kanji: "背負",
    definition: "Caricare sul dorso o sulle spalle. Movimento fondamentale di Seoi Nage.",
  },
  otoshi: {
    term: "Otoshi",
    kanji: "落",
    definition: "Caduta, far cadere verso il basso. Movimento di caduta diretta come in Tai Otoshi.",
  },
  guruma: {
    term: "Guruma",
    kanji: "車",
    definition: "Ruota. Movimento rotatorio continuo attorno a un perno come in Hiza Guruma o Koshi Guruma.",
  },
  barai: {
    term: "Barai",
    kanji: "払",
    definition: "Spazzare. Movimento rapido di spazzata sul piede dell'avversario come in De Ashi Barai.",
  },
  harai: {
    term: "Harai",
    kanji: "払",
    definition: "Spazzata, spazzare. Movimento di falciata o spazzata d'anca come in Harai Goshi.",
  },
  gari: {
    term: "Gari",
    kanji: "刈",
    definition: "Falciare. Movimento di taglio o falciata della gamba dell'avversario come in O Soto Gari.",
  },
  gake: {
    term: "Gake",
    kanji: "掛",
    definition: "Agganciamento. Azione di aggancio a uncino con la gamba come in Ko Soto Gake.",
  },
  de: {
    term: "De",
    kanji: "出",
    definition: "Avanzante, che avanza. Indica il piede che esce in avanti come in De Ashi Barai.",
  },
  ashi: {
    term: "Ashi",
    kanji: "足",
    definition: "Piede o gamba. Identifica le tecniche di gamba del gruppo Ashi-waza.",
  },
  hiza: {
    term: "Hiza",
    kanji: "膝",
    definition: "Ginocchio. Parte del corpo utilizzata come perno di blocco come in Hiza Guruma.",
  },
  sasae: {
    term: "Sasae",
    kanji: "支",
    definition: "Trattenere, fare perno, bloccare sostenendo il piede dell'avversario.",
  },
  tsurikomi: {
    term: "Tsurikomi",
    kanji: "釣込",
    definition: "Tirare e pescare sollevando. Azione coordinata di trazione e sollevamento con le braccia.",
  },
  tsuri: {
    term: "Tsuri",
    kanji: "釣",
    definition: "Sollevare, pescare verso l'alto con la presa della giacca (Judogi).",
  },
  uki: {
    term: "Uki",
    kanji: "浮",
    definition: "Fluttuare, galleggiare. Proiezione o controllo con squilibrio fluido e leggero senza caricamento.",
  },
  o: {
    term: "O",
    kanji: "大",
    definition: "Grande. Prefisso che indica la versione maggiore o più ampia di una tecnica.",
  },
  ko: {
    term: "Ko",
    kanji: "小",
    definition: "Piccolo. Prefisso che indica la versione minore o più ravvicinata di una tecnica.",
  },
  soto: {
    term: "Soto",
    kanji: "外",
    definition: "Esterno, all'esterno. Direzione del movimento verso l'esterno dell'avversario.",
  },
  uchi: {
    term: "Uchi",
    kanji: "内",
    definition: "Interno, all'interno. Direzione del movimento verso l'interno dell'avversario.",
  },
  mata: {
    term: "Mata",
    kanji: "股",
    definition: "Coscia o biforcazione delle gambe. Fulcro della proiezione in Uchi Mata.",
  },
  tai: {
    term: "Tai",
    kanji: "体",
    definition: "Corpo. Riferito all'uso dell'intero corpo nella caduta o nello spostamento (Tai Otoshi, Tai Sabaki).",
  },
  te: {
    term: "Te",
    kanji: "手",
    definition: "Mano o braccio. Identifica le tecniche di braccia del gruppo Te-waza.",
  },
  kata: {
    term: "Kata",
    kanji: "肩",
    definition: "Spalla. Usata come fulcro nel caricamento (Kata Guruma) o bloccata nell'immobilizzazione (Kata Gatame).",
  },
  sukui: {
    term: "Sukui",
    kanji: "掬",
    definition: "Raccogliere a cucchiaio, scavare dal basso con le mani sotto le gambe.",
  },
  utsuri: {
    term: "Utsuri",
    kanji: "移",
    definition: "Spostare, cambiare, trasferire l'anca durante un contrattacco d'anca.",
  },
  tomoe: {
    term: "Tomoe",
    kanji: "巴",
    definition: "Virgola, cerchio. Movimento circolare continuo a vortice come in Tomoe Nage.",
  },
  sumi: {
    term: "Sumi",
    kanji: "隅",
    definition: "Angolo. Proiezione diagonale verso uno degli angoli del tatami come in Sumi Gaeshi.",
  },
  tani: {
    term: "Tani",
    kanji: "谷",
    definition: "Valle. Far cadere l'avversario all'indietro nel vuoto come in una valle (Tani Otoshi).",
  },
  makikomi: {
    term: "Makikomi",
    kanji: "巻込",
    definition: "Avvolgere, arrotolarsi. Proiezione in cui Tori si avvolge e ruota insieme a Uke.",
  },
  okuri: {
    term: "Okuri",
    kanji: "送",
    definition: "Accompagnare, far scorrere. Movimento scorrevole con entrambi i piedi o baveri.",
  },
  sutemi: {
    term: "Sutemi",
    kanji: "捨身",
    definition: "Sacrificio del corpo. Tecniche dove si sacrifica il proprio equilibrio per proiettare.",
  },
  yoko: {
    term: "Yoko",
    kanji: "横",
    definition: "Laterale, di lato. Direzione laterale di caduta (Yoko Sutemi) o controllo (Yoko Shiho).",
  },
  morote: {
    term: "Morote",
    kanji: "諸手",
    definition: "A due mani. Esecuzione con entrambe le mani sulla presa o sotto l'ascella.",
  },
  eri: {
    term: "Eri",
    kanji: "襟",
    definition: "Bavero della giacca (Judogi) utilizzato per la presa, il controllo o lo strangolamento.",
  },
  ippon: {
    term: "Ippon",
    kanji: "一本",
    definition: "Punto pieno della vittoria immediata; anche singola presa/un solo braccio (Ippon Seoi).",
  },
  kuzushi: {
    term: "Kuzushi",
    kanji: "崩",
    definition: "Squilibrio. La prima fase fondamentale di ogni tecnica di proiezione nel Judo.",
  },
  tsukuri: {
    term: "Tsukuri",
    kanji: "作",
    definition: "Preparazione, adattamento e posizionamento ottimale del corpo prima della proiezione.",
  },
  kake: {
    term: "Kake",
    kanji: "掛",
    definition: "Esecuzione finale. La fase conclusiva che determina la proiezione e caduta di Uke.",
  },
  renraku: {
    term: "Renraku",
    kanji: "連絡",
    definition: "Collegamento, combinazione fluida tra due o più tecniche in successione.",
  },
  gaeshi: {
    term: "Gaeshi",
    kanji: "返",
    definition: "Rovesciamento, contrattacco. Sfruttare l'attacco dell'avversario per ribaltare l'azione.",
  },
  bogyoho: {
    term: "Bogyoho",
    kanji: "防御法",
    definition: "Metodo di difesa. Insieme delle azioni difensive e posturali per neutralizzare gli attacchi.",
  },
  shintai: {
    term: "Shintai",
    kanji: "進退",
    definition: "Avanzamento e arretramento. Movimenti e spostamenti del corpo sul tatami.",
  },
  kumi: {
    term: "Kumi Kata",
    kanji: "組方",
    definition: "Modo di prendere la presa fondamentale della giacca (bavero e manica).",
  },
  nage: {
    term: "Nage",
    kanji: "投",
    definition: "Proiezione, lancio. Il grande gruppo delle tecniche di proiezione (Nage-waza).",
  },

  // --- KATAME WAZA TERMS ---
  kesa: {
    term: "Kesa",
    kanji: "袈裟",
    definition: "Di traverso, trasversale, sciarpa monastica. Controllo diagonale sul busto di Uke come in Kesa Gatame.",
  },
  gatame: {
    term: "Gatame",
    kanji: "固",
    definition: "Controllo, immobilizzazione. Il gruppo delle tecniche di controllo a terra (Katame-waza).",
  },
  katame: {
    term: "Katame",
    kanji: "固",
    definition: "Controllo, immobilizzazione. Il gruppo delle tecniche di controllo a terra (Katame-waza).",
  },
  kuzure: {
    term: "Kuzure",
    kanji: "崩",
    definition: "Variante, controllo modificato. Indica una variante rispetto alla forma classica dell'immobilizzazione.",
  },
  ushiro: {
    term: "Ushiro",
    kanji: "後",
    definition: "Dietro, posteriore. Esecuzione o controllo da dietro come in Ushiro Kesa Gatame.",
  },
  hon: {
    term: "Hon",
    kanji: "本",
    definition: "Base, fondamentale, principale. La forma canonica originaria della tecnica come in Hon Kesa Gatame.",
  },
  makura: {
    term: "Makura",
    kanji: "枕",
    definition: "Cuscino. Avvolgere e sostenere la testa dell'avversario come su un cuscino (Makura Kesa Gatame).",
  },
  kami: {
    term: "Kami",
    kanji: "上",
    definition: "Superiore, da sopra. Controllo a terra partendo dal lato della testa di Uke (Kami Shiho Gatame).",
  },
  shiho: {
    term: "Shiho",
    kanji: "四方",
    definition: "Quattro direzioni, quattro lati. Controllo totale e blocco completo sui quattro punti di appoggio.",
  },
  tate: {
    term: "Tate",
    kanji: "縦",
    definition: "Longitudinale, a cavalcioni. Immobilizzazione sopra il corpo di Uke lungo il suo asse (Tate Shiho Gatame).",
  },
  nami: {
    term: "Nami",
    kanji: "並",
    definition: "Normale, regolare. Presa naturale con i pollici all'interno dei baveri (Nami Juji Jime).",
  },
  gyaku: {
    term: "Gyaku",
    kanji: "逆",
    definition: "Inverso, contrario. Presa con quattro dita all'interno e pollici all'esterno (Gyaku Juji Jime).",
  },
  juji: {
    term: "Juji",
    kanji: "十字",
    definition: "A croce, incrociato. Azione con braccia o gambe incrociate a croce (Juji Gatame / Juji Jime).",
  },
  jime: {
    term: "Jime",
    kanji: "絞",
    definition: "Strangolamento, costrizione. Il gruppo delle tecniche di costrizione al collo (Shime-waza).",
  },
  shime: {
    term: "Shime",
    kanji: "絞",
    definition: "Strangolamento, costrizione. Il gruppo delle tecniche di costrizione al collo (Shime-waza).",
  },
  hadaka: {
    term: "Hadaka",
    kanji: "裸",
    definition: "A mani nude, scoperto. Strangolamento diretto al collo senza afferrare i baveri (Hadaka Jime).",
  },
  ha: {
    term: "Ha",
    kanji: "羽",
    definition: "Ala, piuma. Sollevare il braccio/ala di Uke controllando il bavero opposto (Kata Ha Jime).",
  },
  katate: {
    term: "Katate",
    kanji: "片手",
    definition: "A una sola mano. Strangolamento o presa applicata con una sola mano (Katate Jime).",
  },
  ryote: {
    term: "Ryote",
    kanji: "両手",
    definition: "A due mani. Strangolamento o presa applicata direttamente con entrambe le mani (Ryote Jime).",
  },
  sode: {
    term: "Sode",
    kanji: "袖",
    definition: "Manica. Strangolamento a ruota facendo presa all'interno della propria manica (Sode Guruma Jime).",
  },
  sankaku: {
    term: "Sankaku",
    kanji: "三角",
    definition: "Triangolo. Controllo o strangolamento a triangolo eseguito con l'incrocio delle gambe (Sankaku Jime / Gatame).",
  },
  jigoku: {
    term: "Jigoku",
    kanji: "地獄",
    definition: "Infernale, inferno. Strangolamento a triangolo e trazione combinata senza via d'uscita (Jigoku Jime).",
  },
  tsukomi: {
    term: "Tsukomi",
    kanji: "突込",
    definition: "Spinta in avanti, infilare. Strangolamento spingendo il pugno contro il bavero e il collo di Uke.",
  },
  ude: {
    term: "Ude",
    kanji: "腕",
    definition: "Braccio. Riferito alle leve articolari applicate all'articolazione del gomito o braccio (Ude-Hishigi).",
  },
  garami: {
    term: "Garami",
    kanji: "緘",
    definition: "Avvolgere, a chiave. Torsione e avvolgimento a chiave articolare del braccio (Ude Garami).",
  },
  hishigi: {
    term: "Hishigi",
    kanji: "挫",
    definition: "Frantumare, iperestensione. Leva articolare in estensione forzata dell'articolazione del gomito.",
  },
  waki: {
    term: "Waki",
    kanji: "脇",
    definition: "Ascella, fianco. Leva al gomito applicata stringendo il braccio sotto la propria ascella (Waki Gatame).",
  },
  hara: {
    term: "Hara",
    kanji: "腹",
    definition: "Addome, ventre. Leva al gomito applicata usando il proprio ventre/addome come fulcro (Hara Gatame).",
  },
  kansetsu: {
    term: "Kansetsu",
    kanji: "関節",
    definition: "Articolazione. Il gruppo delle tecniche di leva articolare (Kansetsu-waza) consentite solo sul gomito.",
  },
  osaekomi: {
    term: "Osaekomi",
    kanji: "抑込",
    definition: "Immobilizzazione. Controllo efficace a terra sul dorso dell'avversario per il tempo regolamentare.",
  },
  newaza: {
    term: "Ne Waza",
    kanji: "寝技",
    definition: "Tecniche al suolo, lotta a terra. Il complesso delle azioni di controllo, strangolamento e leve a terra.",
  },
  hairi: {
    term: "Hairi Kata",
    kanji: "入方",
    definition: "Entrata a terra. Modalità e schemi di transizione per passare da in piedi alla lotta a terra.",
  },
  fusegi: {
    term: "Fusegi",
    kanji: "防",
    definition: "Difesa, uscita da terra. Tecniche, ponti e torsioni per liberarsi dalle immobilizzazioni.",
  },
};

export const NAGE_DICTIONARY_DEFINITIONS = JUDO_DICTIONARY_DEFINITIONS;

const ALL_DICT_KEYS = Object.keys(JUDO_DICTIONARY_DEFINITIONS);

// Map of specific techniques (Nage & Katame) to their constituent words
const TECHNIQUE_WORDS_MAP: Record<string, string[]> = {
  // --- NAGE WAZA ---
  "hane-goshi": ["hane", "goshi", "koshi", "kuzushi"],
  "de-ashi-barai": ["de", "ashi", "barai", "kuzushi"],
  "hiza-guruma": ["hiza", "guruma", "ashi", "tsukuri"],
  "sasae-tsurikomi-ashi": ["sasae", "tsurikomi", "ashi", "tsuri"],
  "uki-goshi": ["uki", "goshi", "koshi", "kake"],
  "o-soto-gari": ["o", "soto", "gari", "kuzushi"],
  "o-goshi": ["o", "goshi", "koshi", "tsukuri"],
  "o-uchi-gari": ["o", "uchi", "gari", "kuzushi"],
  "seoi-nage": ["seoi", "nage", "ippon", "morote", "eri"],
  "ko-soto-gari": ["ko", "soto", "gari", "ashi"],
  "ko-uchi-gari": ["ko", "uchi", "gari", "ashi"],
  "koshi-guruma": ["koshi", "guruma", "goshi", "tsukuri"],
  "tsurikomi-goshi": ["tsurikomi", "tsuri", "goshi", "koshi"],
  "okuri-ashi-barai": ["okuri", "ashi", "barai", "kuzushi"],
  "tai-otoshi": ["tai", "otoshi", "te", "kuzushi"],
  "harai-goshi": ["harai", "goshi", "koshi", "kake"],
  "uchi-mata": ["uchi", "mata", "koshi", "ashi"],
  "ko-soto-gake": ["ko", "soto", "gake", "ashi"],
  "tsuri-goshi": ["tsuri", "goshi", "koshi", "eri"],
  "yoko-otoshi": ["yoko", "otoshi", "sutemi", "kuzushi"],
  "ashi-guruma": ["ashi", "guruma", "hiza", "kake"],
  "harai-tsurikomi-ashi": ["harai", "tsurikomi", "ashi", "tsuri"],
  "tomoe-nage": ["tomoe", "nage", "sutemi", "kuzushi"],
  "kata-guruma": ["kata", "guruma", "te", "tsukuri"],
  "sumi-gaeshi": ["sumi", "gaeshi", "sutemi", "kuzushi"],
  "tani-otoshi": ["tani", "otoshi", "sutemi", "kake"],
  "hane-makikomi": ["hane", "makikomi", "sutemi", "goshi"],
  "sukui-nage": ["sukui", "nage", "te", "kuzushi"],
  "utsuri-goshi": ["utsuri", "goshi", "gaeshi", "koshi"],
  "o-guruma": ["o", "guruma", "ashi", "kake"],
  "soto-makikomi": ["soto", "makikomi", "sutemi", "nage"],
  "uki-otoshi": ["uki", "otoshi", "te", "kuzushi"],
  "yoko-tomoe-nage": ["yoko", "tomoe", "sutemi", "nage"],
  "renraku": ["renraku", "kuzushi", "tsukuri", "kake"],
  "gaeshi": ["gaeshi", "renraku", "kake", "kuzushi"],
  "difese": ["bogyoho", "shintai", "kumi", "kuzushi"],
  "bogyoho": ["bogyoho", "shintai", "kumi", "kuzushi"],

  // --- KATAME WAZA: OSAEKOMI ---
  "hon-kesa-gatame": ["hon", "kesa", "gatame", "kuzure"],
  "kuzure-kesa-gatame": ["kuzure", "kesa", "gatame", "osaekomi"],
  "ushiro-kesa-gatame": ["ushiro", "kesa", "gatame", "osaekomi"],
  "makura-kesa-gatame": ["makura", "kesa", "gatame", "osaekomi"],
  "kata-gatame": ["kata", "gatame", "osaekomi", "kuzushi"],
  "kami-shiho-gatame": ["kami", "shiho", "gatame", "kuzure"],
  "kuzure-kami-shiho-gatame": ["kuzure", "kami", "shiho", "gatame"],
  "yoko-shiho-gatame": ["yoko", "shiho", "gatame", "osaekomi"],
  "tate-shiho-gatame": ["tate", "shiho", "gatame", "osaekomi"],
  "uki-gatame": ["uki", "gatame", "osaekomi", "newaza"],
  "kesa-gatame": ["kesa", "gatame", "osaekomi", "hon"],
  "shiho-gatame": ["shiho", "gatame", "yoko", "kami"],

  // --- KATAME WAZA: SHIME ---
  "nami-juji-jime": ["nami", "juji", "jime", "shime"],
  "gyaku-juji-jime": ["gyaku", "juji", "jime", "shime"],
  "kata-juji-jime": ["kata", "juji", "jime", "shime"],
  "hadaka-jime": ["hadaka", "jime", "shime", "newaza"],
  "okuri-eri-jime": ["okuri", "eri", "jime", "shime"],
  "kata-ha-jime": ["kata", "ha", "jime", "eri"],
  "katate-jime": ["katate", "jime", "shime", "eri"],
  "ryote-jime": ["ryote", "jime", "shime", "eri"],
  "sode-guruma-jime": ["sode", "guruma", "jime", "shime"],
  "sankaku-jime": ["sankaku", "jime", "shime", "newaza"],
  "jigoku-jime": ["jigoku", "jime", "shime", "eri"],
  "tsukomi-jime": ["tsukomi", "jime", "shime", "eri"],
  "juji-jime": ["juji", "jime", "shime", "nami"],

  // --- KATAME WAZA: KANSETSU ---
  "ude-garami": ["ude", "garami", "kansetsu", "newaza"],
  "juji-gatame": ["juji", "gatame", "hishigi", "ude"],
  "ude-hishigi-juji-gatame": ["juji", "gatame", "hishigi", "ude"],
  "ude-gatame": ["ude", "gatame", "hishigi", "kansetsu"],
  "ude-hishigi-ude-gatame": ["ude", "gatame", "hishigi", "kansetsu"],
  "hiza-gatame": ["hiza", "gatame", "hishigi", "kansetsu"],
  "ude-hishigi-hiza-gatame": ["hiza", "gatame", "hishigi", "kansetsu"],
  "waki-gatame": ["waki", "gatame", "hishigi", "kansetsu"],
  "ude-hishigi-waki-gatame": ["waki", "gatame", "hishigi", "kansetsu"],
  "hara-gatame": ["hara", "gatame", "hishigi", "kansetsu"],
  "ude-hishigi-hara-gatame": ["hara", "gatame", "hishigi", "kansetsu"],
  "ashi-gatame": ["ashi", "gatame", "hishigi", "kansetsu"],
  "ude-hishigi-ashi-gatame": ["ashi", "gatame", "hishigi", "kansetsu"],
  "te-gatame": ["te", "gatame", "hishigi", "kansetsu"],
  "ude-hishigi-te-gatame": ["te", "gatame", "hishigi", "kansetsu"],
  "sankaku-gatame": ["sankaku", "gatame", "hishigi", "kansetsu"],
  "ude-hishigi-sankaku-gatame": ["sankaku", "gatame", "hishigi", "kansetsu"],

  // --- APPLICAZIONI NE WAZA ---
  "hairi-kata": ["hairi", "newaza", "osaekomi", "gatame"],
  "fusegi": ["fusegi", "newaza", "gatame", "osaekomi"],
  "uscite": ["fusegi", "newaza", "gatame", "osaekomi"],
  "transizioni": ["hairi", "newaza", "osaekomi", "shime"],
};

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractWordsForTechnique(techTitle: string, techId: string): string[] {
  const normId = normalizeKey(techId);
  const normTitle = normalizeKey(techTitle);

  // 1. Direct map match
  for (const [key, words] of Object.entries(TECHNIQUE_WORDS_MAP)) {
    if (normId.includes(key) || normTitle.includes(key)) {
      return words;
    }
  }

  // 2. Dynamic token split
  const tokens = normTitle.split("-").filter((t) => t.length >= 2);
  const foundWords: string[] = [];
  for (const token of tokens) {
    if (JUDO_DICTIONARY_DEFINITIONS[token] && !foundWords.includes(token)) {
      foundWords.push(token);
    }
  }

  // Fallback defaults if less than 3 words
  const isKatame =
    normId.includes("katame") ||
    normId.includes("osae") ||
    normId.includes("shime") ||
    normId.includes("jime") ||
    normId.includes("kansetsu") ||
    normId.includes("terra");

  const fallbacks = isKatame
    ? ["gatame", "osaekomi", "newaza", "shime", "kansetsu", "fusegi"]
    : ["kuzushi", "tsukuri", "kake", "nage", "ashi", "te", "koshi"];

  for (const fb of fallbacks) {
    if (foundWords.length >= 3) break;
    if (!foundWords.includes(fb)) {
      foundWords.push(fb);
    }
  }

  return foundWords;
}

export function generateTechniqueDictionaryQuestions(
  activity: { id: string; title: string; group?: string },
): SandanQuizQuestion[] {
  const words = extractWordsForTechnique(activity.title, activity.id);

  const normId = normalizeKey(activity.id);
  const isKatame =
    normId.includes("katame") ||
    normId.includes("osae") ||
    normId.includes("shime") ||
    normId.includes("jime") ||
    normId.includes("kansetsu") ||
    normId.includes("terra") ||
    normId.includes("hairi") ||
    normId.includes("fusegi");

  const categoryLabel = isKatame
    ? "Dizionario · Katame Waza"
    : "Dizionario · Nage Waza";

  return words.map((wordKey, index) => {
    const item =
      JUDO_DICTIONARY_DEFINITIONS[wordKey] ||
      JUDO_DICTIONARY_DEFINITIONS["gatame"] ||
      JUDO_DICTIONARY_DEFINITIONS["kuzushi"];

    // Select 3 distinct distractors from other dictionary definitions
    const otherKeys = ALL_DICT_KEYS.filter(
      (k) =>
        k !== wordKey &&
        !words.includes(k) &&
        k !== "koshi" &&
        k !== "goshi" &&
        k !== "katame" &&
        k !== "gatame" &&
        k !== "shime" &&
        k !== "jime",
    );
    const pool =
      otherKeys.length >= 3
        ? otherKeys
        : ALL_DICT_KEYS.filter((k) => k !== wordKey);

    // Deterministic shuffle based on wordKey and activity.id
    const seed =
      (activity.id.length + wordKey.charCodeAt(0) + index * 7) % pool.length;
    const distractorKeys = [
      pool[seed % pool.length],
      pool[(seed + 4) % pool.length],
      pool[(seed + 9) % pool.length],
    ];

    const distractors = distractorKeys.map(
      (k) =>
        JUDO_DICTIONARY_DEFINITIONS[k]?.definition ||
        "Movimento di controllo e squilibrio.",
    );

    // Randomize correct answer position between 1 and 4
    const correctPos = ((seed + index) % 4) + 1; // 1, 2, 3, or 4
    const options: string[] = [];
    let distractorIdx = 0;

    for (let i = 1; i <= 4; i++) {
      if (i === correctPos) {
        options.push(item.definition);
      } else {
        options.push(
          distractors[distractorIdx] || "Tecnica fondamentale di controllo.",
        );
        distractorIdx++;
      }
    }

    return {
      id: `dict-${activity.id}-${wordKey}`,
      question: `Cosa significa il termine "${item.term.toUpperCase()}" nel contesto del Judo (es. in ${activity.title})?`,
      options,
      correctAnswer: correctPos,
      explanation: `${item.term} (${item.kanji}) significa: ${item.definition}`,
      category: categoryLabel,
      danLevel: "",
      imageUrl: "",
    };
  });
}

export const generateNageDictionaryQuestions = generateTechniqueDictionaryQuestions;
export const generateKatameDictionaryQuestions = generateTechniqueDictionaryQuestions;
