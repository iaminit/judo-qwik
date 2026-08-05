import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sqlite3Package from 'sqlite3';

const projectRoot = process.cwd();
const databasePath = path.join(projectRoot, 'pb_data', 'data.db');
const storageRoot = path.join(projectRoot, 'pb_data', 'storage');
const publicMediaRoot = path.join(projectRoot, 'public', 'media');
const sqlite3 = sqlite3Package.verbose();
const db = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY);

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => (error ? reject(error) : resolve(row)));
  });

const walkFiles = (root) => {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(absolute);
    }
  };
  visit(root);
  return files;
};

const normalizeRelative = (value) => value.split(path.sep).join('/');
const relativeTo = (root, absolute) => normalizeRelative(path.relative(root, absolute));
const nonEmpty = (value) => value !== null && value !== undefined && String(value).trim() !== '';
const parseFileValue = (value) => {
  if (!nonEmpty(value)) return [];
  const text = String(value).trim();
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return [text];
    }
  }
  return [text];
};
const compactExamples = (items, limit = 30) => items.slice(0, limit);

const managementFiles = {
  bacheca: [
    'src/routes/gestione/bacheca/new/index.tsx',
    'src/routes/gestione/bacheca/[id]/index.tsx',
  ],
  dizionario: [
    'src/routes/gestione/dizionario/new/index.tsx',
    'src/routes/gestione/dizionario/[id]/index.tsx',
  ],
  categorie: ['src/components/admin/category-form.tsx'],
  domande_quiz: ['src/components/admin/quiz-question-form.tsx'],
  fijlkam: ['src/components/admin/fijlkam-form.tsx'],
  galleria: ['src/components/admin/gallery-form.tsx'],
  kata: [
    'src/routes/gestione/kata/new/index.tsx',
    'src/routes/gestione/kata/[id]/index.tsx',
  ],
  storia: ['src/components/admin/history-form.tsx'],
  tecniche: [
    'src/routes/gestione/tecniche/new/index.tsx',
    'src/routes/gestione/tecniche/[id]/index.tsx',
  ],
  livelli_dan: ['src/components/admin/program-form.tsx'],
  site_settings: ['src/routes/gestione/settings/index.tsx'],
  task_admin: [
    'src/components/admin/task-modal.tsx',
    'src/components/admin/reminder-modal.tsx',
  ],
};

const normalizeFormField = (field) => {
  if (field === 'immagine_principale_file') return 'immagine_principale';
  if (field === 'audio_file') return 'audio';
  if (field === 'type') return 'tags';
  return field;
};

const scanFormFields = (files) => {
  const fields = new Set();
  for (const relative of files || []) {
    const absolute = path.join(projectRoot, relative);
    if (!fs.existsSync(absolute)) continue;
    const source = fs.readFileSync(absolute, 'utf8');
    if (source.includes('CompleteContentFields')) {
      for (const field of [
        'titolo', 'titolo_secondario', 'slug', 'contenuto', 'descrizione_breve', 'tags',
        'categoria_principale', 'categoria_secondaria', 'immagine_principale',
        'immagine_secondaria', 'audio', 'video_link', 'video_id', 'file_allegato',
        'ordine', 'livello', 'anno', 'data_riferimento', 'data_inizio', 'data_fine',
        'link_esterno', 'record_correlato_id', 'pubblicato', 'in_evidenza', 'autore_id',
      ]) fields.add(field);
    }
    if (source.includes('opzione_${letter}')) {
      for (const field of ['opzione_a', 'opzione_b', 'opzione_c', 'opzione_d']) fields.add(field);
    }
    for (const match of source.matchAll(/name=["']([^"']+)["']/g)) {
      fields.add(normalizeFormField(match[1]));
    }
    for (const match of source.matchAll(/(?:append|set)\(\s*["']([^"']+)["']/g)) {
      fields.add(normalizeFormField(match[1]));
    }
  }
  return [...fields].sort();
};

const collections = await all(
  `SELECT id, name, type, fields
   FROM _collections
   WHERE system = 0
   ORDER BY name`
);
const collectionById = new Map(collections.map((collection) => [collection.id, collection]));
const collectionByName = new Map(collections.map((collection) => [collection.name, collection]));

const integrityCheck = await get('PRAGMA integrity_check');
const foreignKeyCheck = await all('PRAGMA foreign_key_check');
const collectionReports = [];
const referencedStorageFiles = new Set();
const recordKeys = new Set();

for (const collection of collections) {
  const fields = JSON.parse(collection.fields || '[]');
  const tableColumns = await all(`PRAGMA table_info("${collection.name}")`);
  const fieldNames = fields.map((field) => field.name);
  const rows = await all(`SELECT * FROM "${collection.name}"`);
  const requiredFields = fields.filter((field) => field.required).map((field) => field.name);
  const fileFields = fields.filter((field) => field.type === 'file').map((field) => field.name);
  const urlFields = fields.filter((field) => field.type === 'url').map((field) => field.name);
  const relationFields = fields.filter((field) => field.type === 'relation');

  const missingRequired = [];
  for (const field of requiredFields) {
    const missing = rows
      .filter((row) => !nonEmpty(row[field]))
      .map((row) => ({ id: row.id, title: row.titolo || row.nome_completo || row.domanda || '' }));
    if (missing.length) missingRequired.push({ field, count: missing.length, examples: compactExamples(missing) });
  }

  const duplicateValues = (field) => {
    if (!fieldNames.includes(field)) return [];
    const grouped = new Map();
    for (const row of rows) {
      const value = String(row[field] || '').trim().toLowerCase();
      if (!value) continue;
      const existing = grouped.get(value) || [];
      existing.push({ id: row.id, value: row[field] });
      grouped.set(value, existing);
    }
    return [...grouped.entries()]
      .filter(([, matches]) => matches.length > 1)
      .map(([value, matches]) => ({ value, count: matches.length, records: compactExamples(matches, 12) }));
  };

  const invalidUrls = [];
  for (const field of urlFields) {
    for (const row of rows) {
      if (!nonEmpty(row[field])) continue;
      try {
        const parsed = new URL(String(row[field]));
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
      } catch {
        invalidUrls.push({ id: row.id, field, value: row[field] });
      }
    }
  }

  const invalidRelations = [];
  for (const field of relationFields) {
    const targetCollectionId = field.collectionId;
    const targetCollection = collectionById.get(targetCollectionId);
    if (!targetCollection) continue;
    const validIds = new Set((await all(`SELECT id FROM "${targetCollection.name}"`)).map((row) => row.id));
    for (const row of rows) {
      const relatedIds = parseFileValue(row[field.name]);
      for (const relatedId of relatedIds) {
        if (!validIds.has(relatedId)) {
          invalidRelations.push({
            id: row.id,
            field: field.name,
            target: targetCollection.name,
            value: relatedId,
          });
        }
      }
    }
  }

  const missingStorageFiles = [];
  const fileReferenceCount = {};
  for (const row of rows) {
    recordKeys.add(`${collection.id}/${row.id}`);
    for (const field of fileFields) {
      const names = parseFileValue(row[field]);
      fileReferenceCount[field] = (fileReferenceCount[field] || 0) + names.length;
      for (const filename of names) {
        const relative = normalizeRelative(path.join(collection.id, row.id, filename));
        referencedStorageFiles.add(relative);
        if (!fs.existsSync(path.join(storageRoot, relative))) {
          missingStorageFiles.push({ id: row.id, field, filename, expected: relative });
        }
      }
    }
  }

  const dateFields = fields.filter((field) => field.type === 'date').map((field) => field.name);
  const invalidDates = [];
  for (const field of dateFields) {
    for (const row of rows) {
      if (!nonEmpty(row[field])) continue;
      if (Number.isNaN(Date.parse(String(row[field])))) {
        invalidDates.push({ id: row.id, field, value: row[field] });
      }
    }
  }

  const tags = fieldNames.includes('tags')
    ? [...new Set(rows.flatMap((row) => String(row.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean)))].sort()
    : [];
  const blankCounts = Object.fromEntries(
    fields
      .filter((field) => !field.system && field.name !== 'id')
      .map((field) => [field.name, rows.filter((row) => !nonEmpty(row[field.name])).length])
  );
  const formFields = scanFormFields(managementFiles[collection.name] || []);
  const editableSchemaFields = fields
    .filter((field) => !field.system && field.name !== 'id')
    .map((field) => field.name);
  const missingFormFields = editableSchemaFields.filter((field) => !formFields.includes(field));

  collectionReports.push({
    id: collection.id,
    name: collection.name,
    type: collection.type,
    recordCount: rows.length,
    schemaFieldCount: fields.length,
    tableColumns: tableColumns.map((column) => column.name),
    requiredFields,
    missingRequired,
    duplicateSlugs: duplicateValues('slug'),
    duplicateTitles: duplicateValues('titolo'),
    invalidUrls: compactExamples(invalidUrls),
    invalidUrlCount: invalidUrls.length,
    invalidDates: compactExamples(invalidDates),
    invalidDateCount: invalidDates.length,
    invalidRelations: compactExamples(invalidRelations),
    invalidRelationCount: invalidRelations.length,
    fileFields,
    fileReferenceCount,
    missingStorageFiles: compactExamples(missingStorageFiles, 100),
    missingStorageFileCount: missingStorageFiles.length,
    tags,
    blankCounts,
    managementFiles: managementFiles[collection.name] || [],
    formFields,
    missingFormFields,
  });
}

const storageFiles = walkFiles(storageRoot).map((absolute) => relativeTo(storageRoot, absolute));
const primaryStorageFiles = storageFiles.filter((relative) => {
  const parts = relative.split('/');
  return parts.length === 3 && !parts[2].endsWith('.attrs');
});
const derivedStorageFiles = storageFiles.filter((relative) => !primaryStorageFiles.includes(relative));
const orphanStorageFiles = primaryStorageFiles.filter((relative) => !referencedStorageFiles.has(relative));
const unknownStorageRecordFiles = primaryStorageFiles.filter((relative) => {
  const parts = relative.split('/');
  return parts.length >= 3 && !recordKeys.has(`${parts[0]}/${parts[1]}`);
});
const unknownStorageCollections = [
  ...new Set(
    primaryStorageFiles
      .map((relative) => relative.split('/')[0])
      .filter((collectionId) => !collectionById.has(collectionId))
  ),
].sort();

const publicMediaFiles = walkFiles(publicMediaRoot);
const publicMediaRelative = publicMediaFiles.map((absolute) => relativeTo(publicMediaRoot, absolute));
const publicMediaSet = new Set(publicMediaRelative);
const zeroByteMedia = publicMediaFiles
  .filter((absolute) => fs.statSync(absolute).size === 0)
  .map((absolute) => relativeTo(publicMediaRoot, absolute));
const extensionlessMedia = publicMediaRelative.filter((relative) => !path.extname(relative));
const caseGroups = new Map();
for (const relative of publicMediaRelative) {
  const key = relative.toLowerCase();
  const values = caseGroups.get(key) || [];
  values.push(relative);
  caseGroups.set(key, values);
}
const caseCollisions = [...caseGroups.values()].filter((values) => values.length > 1);

const hashGroups = new Map();
for (const absolute of publicMediaFiles) {
  const size = fs.statSync(absolute).size;
  if (size === 0) continue;
  const hash = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
  const key = `${size}:${hash}`;
  const values = hashGroups.get(key) || [];
  values.push(relativeTo(publicMediaRoot, absolute));
  hashGroups.set(key, values);
}
const duplicateMediaGroups = [...hashGroups.values()].filter((values) => values.length > 1);

const sourceFiles = walkFiles(path.join(projectRoot, 'src')).filter((absolute) =>
  /\.(tsx?|css|json)$/.test(absolute)
);
const sourceMediaReferences = new Set();
for (const absolute of sourceFiles) {
  const source = fs.readFileSync(absolute, 'utf8');
  for (const match of source.matchAll(/(?:\/media\/|media\/)([^"'`)\s?#]+)/g)) {
    const reference = decodeURIComponent(match[1]).replace(/^\/+/, '');
    if (
      !reference.includes('${') &&
      /^[^<>]+?\.(?:webp|png|jpe?g|gif|svg|mp3|mp4|pdf|apk)$/i.test(reference)
    ) {
      sourceMediaReferences.add(reference);
    }
  }
}

const databaseStaticReferences = new Set();
if (collectionByName.has('domande_quiz')) {
  const quizRows = await all('SELECT id, immagine FROM domande_quiz WHERE trim(immagine) != ""');
  for (const row of quizRows) {
    databaseStaticReferences.add(String(row.immagine).replace(/^\/?media\//, ''));
  }
}
const kataSchemaFields = collectionByName.has('kata')
  ? JSON.parse(collectionByName.get('kata').fields || '[]').map((field) => field.name)
  : [];
if (collectionByName.has('kata') && kataSchemaFields.includes('tecniche_singole')) {
  const kataRows = await all('SELECT id, tecniche_singole FROM kata');
  for (const row of kataRows) {
    if (!nonEmpty(row.tecniche_singole)) continue;
    try {
      const parsed = JSON.parse(row.tecniche_singole);
      const visit = (value) => {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') Object.values(value).forEach(visit);
        else if (typeof value === 'string' && /\.(?:webp|png|jpe?g|gif|svg|mp3|mp4|pdf)$/i.test(value)) {
          databaseStaticReferences.add(value.replace(/^\/?media\//, ''));
        }
      };
      visit(parsed);
    } catch {
      // Invalid JSON is reported separately below.
    }
  }
}

const missingSourceMedia = [...sourceMediaReferences]
  .filter((relative) => !publicMediaSet.has(relative))
  .sort();
const missingDatabaseMedia = [...databaseStaticReferences]
  .filter((relative) => !publicMediaSet.has(relative))
  .sort();
const referencedPublicMedia = new Set([...sourceMediaReferences, ...databaseStaticReferences]);
const unreferencedPublicMedia = publicMediaRelative
  .filter((relative) => !referencedPublicMedia.has(relative))
  .sort();

const kataJsonRows = kataSchemaFields.includes('tecniche_singole')
  ? await all('SELECT id, titolo, tecniche_singole FROM kata')
  : [];
const invalidKataJson = [];
for (const row of kataJsonRows) {
  if (!nonEmpty(row.tecniche_singole)) continue;
  try {
    const parsed = JSON.parse(row.tecniche_singole);
    if (!Array.isArray(parsed)) invalidKataJson.push({ id: row.id, title: row.titolo, reason: 'not-array' });
  } catch (error) {
    invalidKataJson.push({ id: row.id, title: row.titolo, reason: error.message });
  }
}

const legacyRoots = [
  { root: path.join(projectRoot, 'pb_data'), prefix: '', include: (relative) => !relative.includes('/') },
  { root: path.join(projectRoot, 'pb_data', 'audio'), prefix: 'audio/', include: () => true },
  { root: path.join(projectRoot, 'pb_data', 'home'), prefix: 'home/', include: () => true },
  { root: path.join(projectRoot, 'pb_data', 'icons'), prefix: 'icons/', include: () => true },
  { root: path.join(projectRoot, 'pb_data', 'media'), prefix: '', include: () => true },
];
const legacyMedia = [];
for (const location of legacyRoots) {
  for (const absolute of walkFiles(location.root)) {
    const relativeAtRoot = relativeTo(location.root, absolute);
    if (!location.include(relativeAtRoot)) continue;
    if (!/\.(?:webp|png|jpe?g|gif|svg|mp3|mp4|pdf)$/i.test(relativeAtRoot)) continue;
    const expected = `${location.prefix}${relativeAtRoot}`;
    const publicAbsolute = path.join(publicMediaRoot, expected);
    const existsInPublic = fs.existsSync(publicAbsolute);
    let sameContent = false;
    if (existsInPublic) {
      const left = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
      const right = crypto.createHash('sha256').update(fs.readFileSync(publicAbsolute)).digest('hex');
      sameContent = left === right;
    }
    legacyMedia.push({
      source: relativeTo(projectRoot, absolute),
      expectedPublic: expected,
      existsInPublic,
      sameContent,
    });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  databasePath: relativeTo(projectRoot, databasePath),
  integrity: {
    sqlite: integrityCheck,
    foreignKeyViolationCount: foreignKeyCheck.length,
    foreignKeyViolations: compactExamples(foreignKeyCheck, 50),
  },
  totals: {
    collections: collections.length,
    records: collectionReports.reduce((sum, collection) => sum + collection.recordCount, 0),
    schemaFields: collectionReports.reduce((sum, collection) => sum + collection.schemaFieldCount, 0),
    storageFiles: primaryStorageFiles.length,
    storageDerivedFiles: derivedStorageFiles.length,
    referencedStorageFiles: referencedStorageFiles.size,
    publicMediaFiles: publicMediaFiles.length,
  },
  collections: collectionReports,
  storage: {
    fileCount: primaryStorageFiles.length,
    derivedFileCount: derivedStorageFiles.length,
    referencedFileCount: referencedStorageFiles.size,
    orphanFileCount: orphanStorageFiles.length,
    orphanFiles: compactExamples(orphanStorageFiles, 120),
    unknownRecordFileCount: unknownStorageRecordFiles.length,
    unknownRecordFiles: compactExamples(unknownStorageRecordFiles, 120),
    unknownCollections: unknownStorageCollections,
  },
  publicMedia: {
    fileCount: publicMediaFiles.length,
    zeroByteCount: zeroByteMedia.length,
    zeroByteFiles: compactExamples(zeroByteMedia, 100),
    extensionlessCount: extensionlessMedia.length,
    extensionlessFiles: compactExamples(extensionlessMedia, 100),
    caseCollisionCount: caseCollisions.length,
    caseCollisions: compactExamples(caseCollisions, 100),
    duplicateContentGroupCount: duplicateMediaGroups.length,
    duplicateContentGroups: compactExamples(duplicateMediaGroups, 100),
    sourceReferenceCount: sourceMediaReferences.size,
    databaseStaticReferenceCount: databaseStaticReferences.size,
    missingSourceMediaCount: missingSourceMedia.length,
    missingSourceMedia: compactExamples(missingSourceMedia, 150),
    missingDatabaseMediaCount: missingDatabaseMedia.length,
    missingDatabaseMedia: compactExamples(missingDatabaseMedia, 150),
    unreferencedFileCount: unreferencedPublicMedia.length,
    unreferencedFiles: compactExamples(unreferencedPublicMedia, 150),
  },
  legacyMedia: {
    comparedFileCount: legacyMedia.length,
    missingFromPublicCount: legacyMedia.filter((item) => !item.existsInPublic).length,
    missingFromPublic: compactExamples(legacyMedia.filter((item) => !item.existsInPublic), 150),
    contentMismatchCount: legacyMedia.filter((item) => item.existsInPublic && !item.sameContent).length,
    contentMismatches: compactExamples(
      legacyMedia.filter((item) => item.existsInPublic && !item.sameContent),
      150
    ),
  },
  kata: {
    missingTechniquesField: !kataSchemaFields.includes('tecniche_singole'),
    invalidTechniqueJsonCount: invalidKataJson.length,
    invalidTechniqueJson: invalidKataJson,
  },
};

console.log(JSON.stringify(report, null, 2));
db.close();
