'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  getPublicForm,
  PublicForm,
  submitPublicForm,
} from '@/lib/api';

import { QuestionInput } from '@/components/question-input';

export default function PublicFormPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [form, setForm] = useState<PublicForm | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadForm() {
      try {
        const data = await getPublicForm(slug);
        if (active) {
          setForm(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load form.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadForm();
    return () => { active = false; };
  }, [slug]);

  const currentQuestion = form?.questions[currentIndex];

  const validateCurrent = () => {
    if (currentQuestion?.is_required && !answers[currentQuestion.id]?.trim()) {
      setError('This question is required.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateCurrent() || !form) return;
    setCurrentIndex((index) => Math.min(index + 1, form.questions.length - 1));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form || !validateCurrent()) return;

    const missingRequiredIndex = form.questions.findIndex((question) => (
      question.is_required && !answers[question.id]?.trim()
    ));
    if (missingRequiredIndex !== -1) {
      setCurrentIndex(missingRequiredIndex);
      setError('This question is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const result = await submitPublicForm(
        slug,
        form.questions
          .filter((question) => answers[question.id]?.trim())
          .map((question) => ({
            question_id: question.id,
            value: answers[question.id].trim(),
          })),
      );
      setThankYouMessage(result.thank_you_message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit form.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center">Loading form...</main>;
  }

  if (!form) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold">Form unavailable</h1>
          <p className="mt-2 text-zinc-500">{error}</p>
        </div>
      </main>
    );
  }

  if (thankYouMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-center dark:bg-zinc-950">
        <div className="max-w-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
          <h1 className="mt-5 text-3xl font-bold">{thankYouMessage}</h1>
          <p className="mt-3 text-zinc-500">Your response has been submitted.</p>
        </div>
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-3xl font-bold">{form.title}</h1>
          <p className="mt-3 text-zinc-500">This form has no questions yet.</p>
        </div>
      </main>
    );
  }

  const isLast = currentIndex === form.questions.length - 1;

  return (
    <main className="flex min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {currentIndex + 1} of {form.questions.length}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${((currentIndex + 1) / form.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <p className="mb-2 text-sm font-medium text-zinc-500">{form.title}</p>
        <h1 className="mb-6 text-3xl font-bold leading-tight">
          {currentQuestion.text}
          {currentQuestion.is_required && <span className="ml-1 text-red-500">*</span>}
        </h1>

        <QuestionInput
          question={currentQuestion}
          value={answers[currentQuestion.id] ?? ''}
          autoFocus
          onChange={(value) => {
            setAnswers((current) => ({ ...current, [currentQuestion.id]: value }));
            setError(null);
          }}
        />

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setCurrentIndex((index) => Math.max(0, index - 1));
            }}
            disabled={currentIndex === 0 || submitting}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-zinc-700"
          >
            Previous
          </button>

          {isLast ? (
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Next
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
