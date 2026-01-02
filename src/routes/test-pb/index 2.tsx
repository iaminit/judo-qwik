import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';

export const useTestData = routeLoader$(async () => {
  console.log('[TEST] Starting PocketBase test...');
  console.log('[TEST] PocketBase URL:', pb.baseUrl);

  try {
    console.log('[TEST] Fetching dictionary records...');
    const records = await pb.collection('dictionary').getList(1, 5);
    console.log('[TEST] Success! Got', records.totalItems, 'total items');
    console.log('[TEST] First 5 records:', records.items.length);

    return {
      success: true,
      totalItems: records.totalItems,
      items: records.items.map((r: any) => r.term),
    };
  } catch (error: any) {
    console.error('[TEST] Error:', error.message);
    console.error('[TEST] Stack:', error.stack);
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
});

export default component$(() => {
  const data = useTestData();

  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-4">PocketBase Test</h1>

      {data.value.success ? (
        <div class="bg-green-100 dark:bg-green-900 p-4 rounded">
          <p class="font-bold text-green-800 dark:text-green-100">✓ Connection successful!</p>
          <p class="mt-2">Total items: {data.value.totalItems}</p>
          <p class="mt-2">First 5 terms:</p>
          <ul class="list-disc ml-6">
            {data.value.items?.map((term: string) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div class="bg-red-100 dark:bg-red-900 p-4 rounded">
          <p class="font-bold text-red-800 dark:text-red-100">✗ Connection failed</p>
          <p class="mt-2">Error: {data.value.error}</p>
          <pre class="mt-2 text-xs overflow-auto">{data.value.stack}</pre>
        </div>
      )}
    </div>
  );
});
