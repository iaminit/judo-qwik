import { component$ } from '@builder.io/qwik';
import ProgramForm from '~/components/admin/program-form';

export default component$(() => {
    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Nuova Sezione Programma</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Aggiungi una nuova sezione al programma d'esame.</p>
            </header>

            <ProgramForm isNew={true} />
        </div>
    );
});
