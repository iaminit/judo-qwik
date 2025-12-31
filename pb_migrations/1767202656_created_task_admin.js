/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "id_f",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "titolo_f",
        "max": 0,
        "min": 0,
        "name": "titolo",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "convertURLs": false,
        "hidden": false,
        "id": "cont_f",
        "maxSize": 0,
        "name": "contenuto",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "editor"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "desc_f",
        "max": 0,
        "min": 0,
        "name": "descrizione_breve",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "tags_f",
        "max": 0,
        "min": 0,
        "name": "tags",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "data_f",
        "max": "",
        "min": "",
        "name": "data_riferimento",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "compl_f",
        "name": "completato",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "prio_f",
        "maxSelect": 0,
        "name": "priorita",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "bassa",
          "media",
          "alta",
          "urgente"
        ]
      },
      {
        "hidden": false,
        "id": "stato_f",
        "maxSelect": 0,
        "name": "stato",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "aperto",
          "in_corso",
          "bloccato",
          "completato"
        ]
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "ass_f",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "assegnato_a_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "aut_f",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "autore_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "pub_f",
        "name": "pubblicato",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "evid_f",
        "name": "in_evidenza",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "prom_f",
        "name": "promemoria_inviato",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "prom_d_f",
        "max": "",
        "min": "",
        "name": "promemoria_data",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "cr_f",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": true,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "up_f",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": true,
        "type": "autodate"
      }
    ],
    "id": "pbc_2971281094",
    "indexes": [],
    "listRule": "@request.auth.id != \"\"",
    "name": "task_admin",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2971281094");

  return app.delete(collection);
})
