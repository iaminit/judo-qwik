import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import QuizQuestionForm from '~/components/admin/quiz-question-form';

export default component$(() => (
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-black mb-8">Nuova domanda Quiz</h1>
    <QuizQuestionForm isNew />
  </div>
));

export const head: DocumentHead = { title: 'Nuova Domanda Quiz - JudoOK' };
