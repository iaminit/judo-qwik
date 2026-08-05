import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import QuizQuestionForm from '~/components/admin/quiz-question-form';
import { pb } from '~/lib/pocketbase';

export const useQuestion = routeLoader$(({ params }) =>
  pb.collection('domande_quiz').getOne(params.id, { requestKey: null })
);

export default component$(() => {
  const item = useQuestion();
  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-black mb-8">Modifica domanda Quiz</h1>
      <QuizQuestionForm item={item.value} isNew={false} />
    </div>
  );
});

export const head: DocumentHead = { title: 'Modifica Domanda Quiz - JudoOK' };
