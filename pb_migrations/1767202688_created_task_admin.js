/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\"",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
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
        "id": "text113252604",
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
        "id": "editor2405003578",
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
        "id": "text2032360091",
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
        "id": "text1874629670",
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
        "id": "date1170764179",
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
        "id": "bool3908345290",
        "name": "completato",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "select1909081201",
        "maxSelect": 1,
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
        "id": "select1128676325",
        "maxSelect": 1,
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
        "id": "relation1334253151",
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
        "id": "relation3201236918",
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
        "id": "bool1021080226",
        "name": "pubblicato",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "bool3623175757",
        "name": "in_evidenza",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "bool2206362413",
        "name": "promemoria_inviato",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "date3333882016",
        "max": "",
        "min": "",
        "name": "promemoria_data",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
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
