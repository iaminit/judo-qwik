import PocketBase from './node_modules/pocketbase/dist/pocketbase.es.mjs';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
  const records = await pb.collection('kata').getFullList({ requestKey: null });
  console.log('Found records:', records.length);
  for (const r of records) {
    console.log(`Record ID: ${r.id}, Slug: ${r.slug || r.titolo}`);
  }
}

main();
