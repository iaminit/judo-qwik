import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

let db: Database | null = null;

export const initDatabase = async () => {
  if (db) return db;

  try {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `/${file}`
    });

    const response = await fetch('/judo.sqlite');
    const buffer = await response.arrayBuffer();

    db = new SQL.Database(new Uint8Array(buffer));

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Type definitions
export interface DictionaryTerm {
  termine: string;
  pronuncia: string;
  descrizione: string;
  kanji: string;
  audio_file: string | null;
  has_audio: boolean;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  image_path: string | null;
  category: string;
  dan_level: string;
}

// Dictionary queries
export const getDictionaryTerms = (): DictionaryTerm[] => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM dizionario ORDER BY termine ASC');
  const results: DictionaryTerm[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      termine: row.termine as string,
      pronuncia: row.pronuncia as string,
      descrizione: row.descrizione as string,
      kanji: row.kanji as string,
      audio_file: row.audio_file as string | null,
      has_audio: !!row.audio_file
    });
  }

  stmt.free();
  return results;
};

export const searchDictionaryTerms = (searchTerm: string): DictionaryTerm[] => {
  const db = getDatabase();
  const normalizedSearch = searchTerm.toLowerCase().replace(/-/g, ' ');

  const stmt = db.prepare(`
    SELECT * FROM dizionario
    WHERE LOWER(termine) LIKE ?
       OR LOWER(REPLACE(termine, '-', ' ')) LIKE ?
    ORDER BY termine ASC
  `);

  stmt.bind([`%${searchTerm}%`, `%${normalizedSearch}%`]);

  const results: DictionaryTerm[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      termine: row.termine as string,
      pronuncia: row.pronuncia as string,
      descrizione: row.descrizione as string,
      kanji: row.kanji as string,
      audio_file: row.audio_file as string | null,
      has_audio: !!row.audio_file
    });
  }

  stmt.free();
  return results;
};

export const filterDictionaryByLetter = (letter: string): DictionaryTerm[] => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM dizionario
    WHERE UPPER(SUBSTR(termine, 1, 1)) = ?
    ORDER BY termine ASC
  `);

  stmt.bind([letter.toUpperCase()]);

  const results: DictionaryTerm[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      termine: row.termine as string,
      pronuncia: row.pronuncia as string,
      descrizione: row.descrizione as string,
      kanji: row.kanji as string,
      audio_file: row.audio_file as string | null,
      has_audio: !!row.audio_file
    });
  }

  stmt.free();
  return results;
};

export const getAvailableLetters = (): string[] => {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT DISTINCT UPPER(SUBSTR(termine, 1, 1)) as letter
    FROM dizionario
    ORDER BY letter ASC
  `);

  const letters: string[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    letters.push(row.letter as string);
  }

  stmt.free();
  return letters;
};

// Quiz queries
export const getQuizQuestions = ({
  danLevel,
  count = 10,
  category
}: {
  danLevel?: string;
  count?: number;
  category?: string;
}): QuizQuestion[] => {
  const db = getDatabase();

  let query = 'SELECT * FROM quiz_questions WHERE 1=1';
  const params: any[] = [];

  if (danLevel && danLevel !== 'musashi' && danLevel !== 'mifune' && danLevel !== 'kano') {
    query += ' AND dan_level = ?';
    params.push(danLevel);
  }

  if (category && category !== 'mista' && category !== 'generale') {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY RANDOM() LIMIT ?';
  params.push(count);

  const stmt = db.prepare(query);
  stmt.bind(params);

  const results: QuizQuestion[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      id: row.id as number,
      question: row.question as string,
      options: [row.option_a as string, row.option_b as string, row.option_c as string, row.option_d as string],
      correctAnswer: row.correct_answer as number,
      explanation: row.explanation as string,
      image_path: row.image_path as string | null,
      category: row.category as string,
      dan_level: row.dan_level as string
    });
  }

  stmt.free();
  return results;
};

// Technique queries
export const getTechniques = (groupBy: 'group' | 'category' = 'group') => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM techniques ORDER BY "order" ASC, dan_level ASC');
  const techniques: any[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject();
    techniques.push(row);
  }
  stmt.free();

  if (groupBy === 'group') {
    const groups: Record<string, any[]> = {};
    techniques.forEach(tech => {
      const g = tech.group || 'Altre';
      if (!groups[g]) groups[g] = [];
      groups[g].push(tech);
    });
    return groups;
  } else if (groupBy === 'category') {
    const categories: Record<string, any[]> = {};
    techniques.forEach(tech => {
      const c = tech.category || 'Altre';
      if (!categories[c]) categories[c] = [];
      categories[c].push(tech);
    });
    return categories;
  }

  return techniques;
};

export const getTechniqueById = (id: string | number) => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM techniques WHERE id = ?');
  stmt.bind([id]);

  let technique = null;
  if (stmt.step()) {
    technique = stmt.getAsObject();
  }
  stmt.free();
  return technique;
};
