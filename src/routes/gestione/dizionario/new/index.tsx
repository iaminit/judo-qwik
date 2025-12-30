import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import DictionaryForm from '~/components/admin/dictionary-form';

export default component$(() => {
    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Nuovo Termine</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Aggiungi un termine al dizionario giapponese del Judo.</p>
            </header>

            <DictionaryForm isNew={true} />
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Nuovo Termine - JudoOK Gestione',
};
