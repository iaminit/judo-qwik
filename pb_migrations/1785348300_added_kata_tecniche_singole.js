/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("kata");

  collection.fields.add(new JSONField({
    name: "tecniche_singole",
    required: false,
    maxSize: 1048576,
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("kata");
  collection.fields.removeByName("tecniche_singole");

  return app.save(collection);
});
