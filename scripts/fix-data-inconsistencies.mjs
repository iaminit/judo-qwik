#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const databasePath = path.join(root, 'pb_data', 'data.db');

const sqlite = (sql, json = false) =>
  execFileSync('sqlite3', [...(json ? ['-json'] : []), databasePath, sql], {
    encoding: 'utf8',
  });

const quote = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
const normalizedTitle = (value) =>
  String(value || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
const contentLength = (value) =>
  String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;

const dictionary = JSON.parse(sqlite('SELECT * FROM dizionario ORDER BY id;', true) || '[]');
const parent = new Map(dictionary.map((record) => [record.id, record.id]));
const find = (id) => {
  let current = id;
  while (parent.get(current) !== current) current = parent.get(current);
  let cursor = id;
  while (parent.get(cursor) !== current) {
    const next = parent.get(cursor);
    parent.set(cursor, current);
    cursor = next;
  }
  return current;
};
const union = (a, b) => {
  const rootA = find(a);
  const rootB = find(b);
  if (rootA !== rootB) parent.set(rootB, rootA);
};

const bySlug = new Map();
const byTitle = new Map();
for (const record of dictionary) {
  const slug = String(record.slug || '').trim().toLowerCase().replace(/-+$/, '');
  const title = normalizedTitle(record.titolo);
  if (slug) {
    if (bySlug.has(slug)) union(bySlug.get(slug), record.id);
    else bySlug.set(slug, record.id);
  }
  if (title) {
    if (byTitle.has(title)) union(byTitle.get(title), record.id);
    else byTitle.set(title, record.id);
  }
}

const groups = new Map();
for (const record of dictionary) {
  const key = find(record.id);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(record);
}

const statements = ['BEGIN IMMEDIATE;'];
const dictionaryMerges = [];

for (const records of groups.values()) {
  if (records.length < 2) continue;

  const ranked = [...records].sort((a, b) => {
    const lengthDiff = contentLength(b.contenuto) - contentLength(a.contenuto);
    if (lengthDiff) return lengthDiff;
    const secondaryDiff = Number(Boolean(b.titolo_secondario)) - Number(Boolean(a.titolo_secondario));
    if (secondaryDiff) return secondaryDiff;
    return a.id.localeCompare(b.id);
  });
  const canonical = ranked[0];
  const absorbed = ranked.slice(1);
  let mergedContent = String(canonical.contenuto || '');
  let mergedSecondary = String(canonical.titolo_secondario || '');

  for (const record of absorbed) {
    const alternate = String(record.contenuto || '').trim();
    if (alternate && !mergedContent.includes(alternate)) {
      mergedContent +=
        `${mergedContent ? '<hr>' : ''}` +
        '<p><strong>Definizione alternativa conservata dall’archivio:</strong></p>' +
        alternate;
    }
    if (!mergedSecondary && record.titolo_secondario) {
      mergedSecondary = String(record.titolo_secondario);
    }
  }

  statements.push(
    `DELETE FROM dizionario WHERE id IN (${absorbed.map((record) => quote(record.id)).join(',')});`,
  );
  statements.push(
    `UPDATE dizionario SET titolo=${quote(String(canonical.titolo || '').normalize('NFKC').trim())}, contenuto=${quote(mergedContent)}, descrizione_breve=${quote(
      canonical.descrizione_breve || absorbed[0]?.descrizione_breve || '',
    )}, titolo_secondario=${quote(mergedSecondary)}, slug=${quote(
      String(canonical.slug || '').replace(/-+$/, ''),
    )} WHERE id=${quote(canonical.id)};`,
  );
  dictionaryMerges.push({
    canonical: canonical.id,
    absorbed: absorbed.map((record) => record.id),
    title: canonical.titolo,
  });
}

// Coppie FIJLKAM identiche: conserviamo l'ID scelto nel report baseline.
statements.push(
  "DELETE FROM fijlkam WHERE id IN ('hz7u8tv9cgo1irf','3shqn0dkz3owzmq');",
);

// Stessa tecnica in programmi DAN diversi: record mantenuti, slug resi univoci.
const techniqueSlugs = {
  fm0epab60xqo9vt: 'kami-shiho-gatame-dan-2',
  k5s3c4qr6o2yxmw: 'kami-shiho-gatame-dan-3',
  ogw8fuo402s49no: 'nami-juji-jime-dan-3',
  pykmag4gu3zl6d2: 'ushiro-kesa-gatame-dan-3',
};
for (const [id, slug] of Object.entries(techniqueSlugs)) {
  statements.push(`UPDATE tecniche SET slug=${quote(slug)} WHERE id=${quote(id)};`);
}

statements.push("UPDATE dizionario SET titolo=trim(replace(titolo,char(160),' ')), slug=rtrim(slug, '-');");

statements.push('COMMIT;');
sqlite(statements.join('\n'));

const remainingDuplicates = JSON.parse(
  sqlite(
    `SELECT 'dizionario' AS collection, slug, COUNT(*) AS count FROM dizionario WHERE slug<>'' GROUP BY slug HAVING COUNT(*)>1
     UNION ALL SELECT 'fijlkam', slug, COUNT(*) FROM fijlkam WHERE slug<>'' GROUP BY slug HAVING COUNT(*)>1
     UNION ALL SELECT 'tecniche', slug, COUNT(*) FROM tecniche WHERE slug<>'' GROUP BY slug HAVING COUNT(*)>1;`,
    true,
  ) || '[]',
);

console.log(
  JSON.stringify(
    {
      dictionaryMerges,
      deletedFijlkamIds: ['hz7u8tv9cgo1irf', '3shqn0dkz3owzmq'],
      updatedTechniqueSlugs: techniqueSlugs,
      remainingDuplicateSlugs: remainingDuplicates,
    },
    null,
    2,
  ),
);
