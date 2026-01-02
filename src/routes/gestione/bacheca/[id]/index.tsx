import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import PostForm from '~/components/admin/post-form';

export const usePostDetail = routeLoader$(async ({ params, fail }) => {
    try {
        const record = await pbAdmin.collection('bacheca').getOne(params.id, {
            requestKey: null
        });
        return JSON.parse(JSON.stringify(record));
    } catch (err) {
        return fail(404, { message: 'News non trovata' });
    }
});

export default component$(() => {
    const post = usePostDetail();

    if (post.value.failed) {
        return (
            <div class="text-center py-20">
                <h2 class="text-2xl font-bold text-red-600">Errore 404</h2>
                <p class="text-gray-500 mt-2">News non trovata nel database.</p>
            </div>
        );
    }

    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Modifica News</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Stai modificando: <span class="text-orange-600 font-black">{post.value.titolo}</span></p>
            </header>

            <PostForm post={post.value} isNew={false} />
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Modifica News - JudoOK Gestione',
};
