/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1405033000")

  // update collection data
  unmarshal({
    "name": "fijlkam"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1405033000")

  // update collection data
  unmarshal({
    "name": "programmi_fijlkam"
  }, collection)

  return app.save(collection)
})
