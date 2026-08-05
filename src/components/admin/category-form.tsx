import { $, component$, useSignal } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { parsePbError } from '~/lib/error-parser';

interface CategoryFormProps {
  item?: Record<string, any>;
  isNew: boolean;
}

const FIELD_CLASS = 'w-full px-4 py-3 rounded-xl border outline-none';

export default component$<CategoryFormProps>(({ item, isNew }) => {
  const nav = useNavigate();
  const loading = useSignal(false);
  const error = useSignal('');

  const save = $(async (event: Event) => {
    event.preventDefault();
    loading.value = true;
    error.value = '';
    const formData = new FormData(event.target as HTMLFormElement);
    const data = {
      tipo_categoria: String(formData.get('tipo_categoria') || '').trim(),
      nome: String(formData.get('nome') || '').trim(),
      descrizione: String(formData.get('descrizione') || '').trim(),
      icona: String(formData.get('icona') || '').trim(),
      colore: String(formData.get('colore') || '').trim(),
      ordine: Number(formData.get('ordine') || 0),
    };

    try {
      if (isNew) await pbAdmin.collection('categorie').create(data);
      else await pbAdmin.collection('categorie').update(item!.id, data);
      nav('/gestione/categorie');
    } catch (saveError) {
      error.value = parsePbError(saveError);
    } finally {
      loading.value = false;
    }
  });

  return (
    <form onSubmit$={save} class="space-y-6 p-6 md:p-8 rounded-2xl border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      {error.value && <p class="p-4 rounded-xl bg-red-50 text-red-700 font-bold">{error.value}</p>}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label class="space-y-2">
          <span class="block text-xs font-black uppercase">Tipo categoria *</span>
          <input name="tipo_categoria" required value={item?.tipo_categoria || ''} placeholder="es. gruppo_tecnica" class={FIELD_CLASS} />
        </label>
        <label class="space-y-2">
          <span class="block text-xs font-black uppercase">Nome *</span>
          <input name="nome" required value={item?.nome || ''} class={FIELD_CLASS} />
        </label>
        <label class="space-y-2">
          <span class="block text-xs font-black uppercase">Icona</span>
          <input name="icona" value={item?.icona || ''} placeholder="Emoji, nome icona o percorso" class={FIELD_CLASS} />
        </label>
        <label class="space-y-2">
          <span class="block text-xs font-black uppercase">Colore</span>
          <input type="color" name="colore" value={item?.colore || '#b4232d'} class="w-full h-12 p-1 rounded-xl border" />
        </label>
        <label class="space-y-2">
          <span class="block text-xs font-black uppercase">Ordine</span>
          <input type="number" name="ordine" value={item?.ordine ?? 0} class={FIELD_CLASS} />
        </label>
      </div>

      <label class="block space-y-2">
        <span class="block text-xs font-black uppercase">Descrizione</span>
        <textarea name="descrizione" rows={5} value={item?.descrizione || ''} class={FIELD_CLASS} />
      </label>

      <div class="flex gap-3">
        <button type="submit" disabled={loading.value} class="px-6 py-3 rounded-xl bg-red-600 text-white font-bold disabled:opacity-50">
          {loading.value ? 'Salvataggio...' : 'Salva categoria'}
        </button>
        <button type="button" onClick$={() => nav('/gestione/categorie')} class="px-6 py-3 rounded-xl bg-gray-100 font-bold">
          Annulla
        </button>
      </div>
    </form>
  );
});
