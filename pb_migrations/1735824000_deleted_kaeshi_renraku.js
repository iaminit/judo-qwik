/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    try {
        const collection = db.findCollectionByNameOrId("kaeshi_renraku");
        db.deleteCollection(collection);
    } catch (e) {
        // Collection might already be deleted or not exist
    }
}, (db) => {
    // No rollback needed for deletion
})
