/// <reference path="../pb_data/types.d.ts" />

const slugCollections = [
  "bacheca",
  "dizionario",
  "fijlkam",
  "galleria",
  "kata",
  "storia",
  "tecniche",
];

migrate((app) => {
  for (const name of slugCollections) {
    const collection = app.findCollectionByNameOrId(name);
    const indexName = `idx_${name}_slug_unique`;
    collection.indexes = [
      ...collection.indexes.filter((index) => !index.includes(indexName)),
      `CREATE UNIQUE INDEX ${indexName} ON ${name} (slug) WHERE slug <> ''`,
    ];
    app.save(collection);
  }
}, (app) => {
  for (const name of slugCollections) {
    const collection = app.findCollectionByNameOrId(name);
    const indexName = `idx_${name}_slug_unique`;
    collection.indexes = collection.indexes.filter((index) => !index.includes(indexName));
    app.save(collection);
  }
});
