export const CONTENT_SCHEMA_FIELDS = [
  'titolo',
  'titolo_secondario',
  'slug',
  'contenuto',
  'descrizione_breve',
  'tags',
  'categoria_principale',
  'categoria_secondaria',
  'immagine_principale',
  'immagine_secondaria',
  'audio',
  'video_link',
  'video_id',
  'file_allegato',
  'ordine',
  'livello',
  'anno',
  'data_riferimento',
  'data_inizio',
  'data_fine',
  'link_esterno',
  'record_correlato_id',
  'pubblicato',
  'in_evidenza',
  'autore_id',
] as const;

export const CONTENT_FILE_FIELDS = [
  'immagine_principale',
  'immagine_secondaria',
  'audio',
  'file_allegato',
] as const;

const BOOLEAN_FIELDS = ['pubblicato', 'in_evidenza'] as const;

/**
 * Completa un FormData costruito a mano con tutti i campi condivisi dalle
 * raccolte contenuto. I file vuoti vengono ignorati per non cancellare upload
 * già presenti; la cancellazione esplicita usa il checkbox `<campo>__remove`.
 */
export const mergeContentFormData = (source: FormData, target: FormData) => {
  for (const field of CONTENT_SCHEMA_FIELDS) {
    if (BOOLEAN_FIELDS.includes(field as (typeof BOOLEAN_FIELDS)[number])) {
      target.set(field, source.has(field) ? 'true' : 'false');
      continue;
    }

    const removeField = `${field}__remove`;
    if (source.has(removeField)) {
      target.set(field, '');
      continue;
    }

    const value = source.get(field);
    if (value === null) continue;
    if (value instanceof File && value.size === 0) continue;
    if (field === 'slug' && typeof value === 'string' && !value.trim() && target.has('slug')) continue;
    target.set(field, value);
  }

  return target;
};

/**
 * Normalizza un FormData inviato direttamente a PocketBase.
 */
export const normalizeContentFormData = (
  data: FormData,
  options: { removeFields?: string[] } = {},
) => {
  for (const field of CONTENT_FILE_FIELDS) {
    const removeField = `${field}__remove`;
    if (data.has(removeField)) {
      data.set(field, '');
    } else {
      const value = data.get(field);
      if (value instanceof File && value.size === 0) data.delete(field);
    }
    data.delete(removeField);
  }

  for (const field of BOOLEAN_FIELDS) {
    data.set(field, data.has(field) ? 'true' : 'false');
  }

  for (const field of options.removeFields || []) data.delete(field);

  return data;
};
