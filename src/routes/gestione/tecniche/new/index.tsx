import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import TechniqueForm from '~/components/admin/technique-form';

export default component$(() => {
    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Nuova Tecnica</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Inserisci una nuova tecnica nel database.</p>
            </header>

            <TechniqueForm isNew={true} />
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Nuova Tecnica - JudoOK Gestione',
};
