import { useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

export const useJudoDB = () => {
  const db = useSignal<Database | null>(dbInstance);
  const error = useSignal<Error | null>(null);
  const loading = useSignal(!dbInstance);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    if (dbInstance) {
      loading.value = false;
      return;
    }

    if (!initPromise) {
      initPromise = (async () => {
        try {
          const SQL = await initSqlJs({
            locateFile: (file: string) => `/${file}`
          });

          const response = await fetch('/judo.sqlite');
          if (!response.ok) {
            throw new Error(`Failed to load database: ${response.statusText}`);
          }

          const buffer = await response.arrayBuffer();
          dbInstance = new SQL.Database(new Uint8Array(buffer));
          return dbInstance;
        } catch (err) {
          console.error("Database initialization error:", err);
          throw err as Error;
        }
      })();
    }

    try {
      const database = await initPromise;
      db.value = database;
      loading.value = false;
    } catch (err) {
      error.value = err as Error;
      loading.value = false;
    }
  });

  const execQuery = $((query: string, params: any[] = []) => {
    if (!db.value) return [];
    try {
      // sql.js returns [{columns: [...], values: [...]}]
      const results = db.value.exec(query, params);
      if (results.length === 0) return [];

      const { columns, values } = results[0];
      return values.map(row => {
        return columns.reduce((obj: Record<string, any>, col: string, index: number) => {
          obj[col] = row[index];
          return obj;
        }, {});
      });
    } catch (err) {
      console.error("Query error:", err);
      return [];
    }
  });

  return { db, loading, error, execQuery };
};
