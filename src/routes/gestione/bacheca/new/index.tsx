import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import PostForm from '~/components/admin/post-form';

export default component$(() => {
    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Crea Nuova News</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Pubblica un avviso o una notizia in bacheca.</p>
            </header>

            <PostForm isNew={true} />
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Nuova News - JudoOK Gestione',
};
