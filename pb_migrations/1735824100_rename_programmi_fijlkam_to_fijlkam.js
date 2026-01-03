/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    try {
        const collection = db.findCollectionByNameOrId("programmi_fijlkam");
        collection.name = "fijlkam";
        db.saveCollection(collection);
    } catch (e) {
        // Collection might already be renamed or not exist
    }
}, (db) => {
    try {
        const collection = db.findCollectionByNameOrId("fijlkam");
        collection.name = "programmi_fijlkam";
        db.saveCollection(collection);
    } catch (e) {
        // Fallback
    }
})
