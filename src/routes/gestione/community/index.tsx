import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { parsePbError } from '~/lib/error-parser';

interface UserItem {
    id: string;
    email: string;
    name: string;
    avatar: string;
    verified: boolean;
    created: string;
    collectionId: string;
}

export default component$(() => {
    const users = useSignal<UserItem[]>([]);
    const isLoading = useSignal(true);
    const error = useSignal<string | null>(null);
    const searchTerm = useSignal('');
    const selectedIds = useSignal<string[]>([]);
    const isDeleting = useSignal(false);

    const fetchUsers = $(async () => {
        isLoading.value = true;
        try {
            const records = await pbAdmin.collection('users').getFullList<UserItem>({
                sort: '-created',
                filter: searchTerm.value ? `name ~ "${searchTerm.value}" || email ~ "${searchTerm.value}"` : '',
                requestKey: null
            });
            users.value = records;
        } catch (err: any) {
            error.value = parsePbError(err);
        } finally {
            isLoading.value = false;
        }
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
        track(() => searchTerm.value);
        selectedIds.value = []; // Reset selection on search
        fetchUsers();
    });

    const handleDelete = $(async (id: string, name: string) => {
        if (!confirm(`Sei sicuro di voler eliminare l'utente ${name}? L'azione è irreversibile.`)) return;

        try {
            await pbAdmin.collection('users').delete(id);
            users.value = users.value.filter(u => u.id !== id);
            selectedIds.value = selectedIds.value.filter(sid => sid !== id);
        } catch (err: any) {
            alert('Errore durante l\'eliminazione: ' + parsePbError(err));
        }
    });

    const handleBulkDelete = $(async () => {
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.value.length} utenti selezionati? L'azione è IRREVERSIBILE.`)) return;

        isDeleting.value = true;
        try {
            for (const id of selectedIds.value) {
                await pbAdmin.collection('users').delete(id);
            }
            users.value = users.value.filter(u => !selectedIds.value.includes(u.id));
            selectedIds.value = [];
        } catch (err: any) {
            alert('Errore durante l\'eliminazione di massa: ' + parsePbError(err));
        } finally {
            isDeleting.value = false;
        }
    });

    const toggleSelect = $((id: string) => {
        if (selectedIds.value.includes(id)) {
            selectedIds.value = selectedIds.value.filter(sid => sid !== id);
        } else {
            selectedIds.value = [...selectedIds.value, id];
        }
    });

    const toggleSelectAll = $(() => {
        if (selectedIds.value.length === users.value.length && users.value.length > 0) {
            selectedIds.value = [];
        } else {
            selectedIds.value = users.value.map(u => u.id);
        }
    });

    const getAvatarUrl = (user: UserItem) => {
        if (!user.avatar) return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`;
        return pbAdmin.files.getUrl(user, user.avatar, { thumb: '100x100' });
    };

    return (
        <div class="space-y-10 animate-in fade-in duration-700">
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gestione Membri</h2>
                    <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Anagrafica e controllo degli utenti registrati nel Dojo.</p>
                </div>
                <div class="flex items-center gap-4">
                    {selectedIds.value.length > 0 && (
                        <button
                            onClick$={handleBulkDelete}
                            disabled={isDeleting.value}
                            class="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold border border-red-100 dark:bg-red-950/20 dark:border-red-900 shadow-sm animate-in slide-in-from-right-4 duration-300"
                        >
                            {isDeleting.value ? 'Eliminazione...' : `Elimina ${selectedIds.value.length} selezionati`}
                        </button>
                    )}
                    <div class="relative flex-shrink-0 w-full md:w-80">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Cerca per nome o email..."
                            onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
                            class="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all dark:text-white font-bold text-sm shadow-sm"
                        />
                    </div>
                </div>
            </header>

            {error.value && (
                <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 font-bold flex items-center gap-3">
                    <span>⚠️</span> {error.value}
                </div>
            )}

            <div class="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <th class="px-6 py-5 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={users.value.length > 0 && selectedIds.value.length === users.value.length}
                                        onClick$={toggleSelectAll}
                                        class="w-5 h-5 rounded-lg accent-red-600 cursor-pointer"
                                    />
                                </th>
                                <th class="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Utente</th>
                                <th class="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                                <th class="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Stato</th>
                                <th class="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Iscritto il</th>
                                <th class="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                            {isLoading.value ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} class="animate-pulse">
                                        <td colSpan={6} class="px-6 py-8">
                                            <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : users.value.length === 0 ? (
                                <tr>
                                    <td colSpan={6} class="px-6 py-20 text-center">
                                        <p class="text-gray-400 font-bold uppercase tracking-widest">Nessun membro trovato.</p>
                                    </td>
                                </tr>
                            ) : (
                                users.value.map(user => (
                                    <tr key={user.id} class={`group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${selectedIds.value.includes(user.id) ? 'bg-red-50/20 dark:bg-red-900/10' : ''}`}>
                                        <td class="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.value.includes(user.id)}
                                                onClick$={() => toggleSelect(user.id)}
                                                class="w-5 h-5 rounded-lg accent-red-600 cursor-pointer"
                                            />
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="flex items-center gap-4">
                                                <img src={getAvatarUrl(user)} width="40" height="40" class="w-10 h-10 rounded-xl object-cover shadow-sm bg-gray-200" />
                                                <span class="font-black text-gray-900 dark:text-white uppercase tracking-tight">{user.name || 'Senza Nome'}</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4">
                                            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{user.email}</span>
                                        </td>
                                        <td class="px-6 py-4 text-center">
                                            <span class={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                                                {user.verified ? 'Verificato' : 'In attesa'}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4">
                                            <span class="text-xs font-bold text-gray-400 uppercase">{new Date(user.created).toLocaleDateString('it-IT')}</span>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <div class="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick$={() => handleDelete(user.id, user.name || user.email)}
                                                    class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="Elimina"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div class="p-6 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {users.value.length} membri • {selectedIds.value.length} selezionati
                </div>
            </div>
        </div>
    );
});
