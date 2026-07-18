'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  createQuestion,
  deleteQuestion,
  Form,
  getForm,
  getQuestions,
  Question,
  QuestionType,
  QuestionUpdateInput,
  publishForm,
  unpublishForm,
  updateQuestion,
} from '@/lib/api';

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'multiple_choice', label: 'Multiple choice' },
];

function QuestionEditor({
  question,
  isFirst,
  isLast,
  onSaved,
  onDelete,
  onMove,
}: {
  question: Question;
  isFirst: boolean;
  isLast: boolean;
  onSaved: (question: Question) => void;
  onDelete: (id: number) => Promise<void>;
  onMove: (question: Question, direction: -1 | 1) => Promise<void>;
}) {
  const [text, setText] = useState(question.text);
  const [questionType, setQuestionType] = useState<QuestionType>(question.question_type);
  const [isRequired, setIsRequired] = useState(question.is_required);
  const [options, setOptions] = useState<string[]>(question.options ?? ['Option 1', 'Option 2']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (value: QuestionType) => {
    setQuestionType(value);
    if (value === 'multiple_choice' && options.length < 2) {
      setOptions(['Option 1', 'Option 2']);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      setError('Question text is required.');
      return;
    }

    const cleanedOptions = options.map((option) => option.trim()).filter(Boolean);
    if (questionType === 'multiple_choice' && cleanedOptions.length < 2) {
      setError('Add at least two multiple-choice options.');
      return;
    }

    const input: QuestionUpdateInput = {
      text: text.trim(),
      question_type: questionType,
      is_required: isRequired,
      options: questionType === 'multiple_choice' ? cleanedOptions : null,
    };

    try {
      setSaving(true);
      setError(null);
      const updated = await updateQuestion(question.id, input);
      setOptions(updated.options ?? ['Option 1', 'Option 2']);
      onSaved(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const updateOption = (index: number, value: string) => {
    setOptions((current) => current.map((option, optionIndex) => (
      optionIndex === index ? value : option
    )));
  };

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-500">Question {question.display_order}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMove(question, -1)}
            disabled={isFirst || saving}
            className="rounded border border-zinc-200 px-2.5 py-1 text-sm disabled:opacity-40 dark:border-zinc-700"
          >
            Up
          </button>
          <button
            type="button"
            onClick={() => onMove(question, 1)}
            disabled={isLast || saving}
            className="rounded border border-zinc-200 px-2.5 py-1 text-sm disabled:opacity-40 dark:border-zinc-700"
          >
            Down
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Question text</label>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select
              value={questionType}
              onChange={(event) => handleTypeChange(event.target.value as QuestionType)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              {QUESTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-end gap-2 pb-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(event) => setIsRequired(event.target.checked)}
              className="h-4 w-4"
            />
            Required question
          </label>
        </div>

        {questionType === 'multiple_choice' && (
          <div>
            <label className="mb-2 block text-sm font-medium">Options</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <button
                    type="button"
                    onClick={() => setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))}
                    disabled={options.length <= 2}
                    className="rounded border border-zinc-200 px-3 text-sm disabled:opacity-40 dark:border-zinc-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOptions((current) => [...current, `Option ${current.length + 1}`])}
              className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
            >
              + Add option
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => onDelete(question.id)}
            disabled={saving}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save question'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function FormBuilderPage() {
  const params = useParams<{ id: string }>();
  const formId = Number(params.id);
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState<QuestionType>('short_text');
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState<string[]>(['Option 1', 'Option 2']);

  useEffect(() => {
    let active = true;

    async function loadBuilder() {
      if (!Number.isInteger(formId) || formId < 1) {
        setError('Invalid form id.');
        setLoading(false);
        return;
      }

      try {
        const [formData, questionData] = await Promise.all([
          getForm(formId),
          getQuestions(formId),
        ]);
        if (active) {
          setForm(formData);
          setQuestions(questionData);
          setError(null);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load form builder.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBuilder();
    return () => { active = false; };
  }, [formId]);

  const refreshQuestions = async () => {
    const data = await getQuestions(formId);
    setQuestions(data);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!newText.trim()) {
      setError('Question text is required.');
      return;
    }

    const cleanedOptions = newOptions.map((option) => option.trim()).filter(Boolean);
    if (newType === 'multiple_choice' && cleanedOptions.length < 2) {
      setError('Add at least two multiple-choice options.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await createQuestion(formId, {
        text: newText.trim(),
        question_type: newType,
        is_required: newRequired,
        options: newType === 'multiple_choice' ? cleanedOptions : null,
      });
      setNewText('');
      setNewType('short_text');
      setNewRequired(false);
      setNewOptions(['Option 1', 'Option 2']);
      await refreshQuestions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add question.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      setActionLoading(true);
      setError(null);
      await deleteQuestion(id);
      await refreshQuestions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete question.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMove = async (question: Question, direction: -1 | 1) => {
    try {
      setActionLoading(true);
      setError(null);
      await updateQuestion(question.id, {
        display_order: question.display_order + direction,
      });
      await refreshQuestions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reorder question.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!form) return;
    try {
      setActionLoading(true);
      setError(null);
      const updated = form.status === 'published'
        ? await unpublishForm(form.id)
        : await publishForm(form.id);
      setForm(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update publish status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center">Loading builder...</main>;
  }

  if (!form) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error ?? 'Form not found.'}</p>
        <Link href="/" className="font-semibold text-indigo-600">Back to dashboard</Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <Link href="/" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-bold">{form.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {form.status === 'published' && form.public_slug && (
              <Link
                href={`/forms/public/${form.public_slug}`}
                target="_blank"
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400"
              >
                Open public form
              </Link>
            )}
            <button
              type="button"
              onClick={handlePublishToggle}
              disabled={actionLoading}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${form.status === 'published' ? 'bg-zinc-600' : 'bg-emerald-600'}`}
            >
              {form.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-bold">Add question</h2>
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <input
              value={newText}
              onChange={(event) => setNewText(event.target.value)}
              placeholder="Enter question text"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                value={newType}
                onChange={(event) => setNewType(event.target.value as QuestionType)}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              >
                {QUESTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={(event) => setNewRequired(event.target.checked)}
                />
                Required question
              </label>
            </div>

            {newType === 'multiple_choice' && (
              <div className="space-y-2">
                {newOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={option}
                      onChange={(event) => setNewOptions((current) => current.map((item, itemIndex) => (
                        itemIndex === index ? event.target.value : item
                      )))}
                      className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                    <button
                      type="button"
                      disabled={newOptions.length <= 2}
                      onClick={() => setNewOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      className="rounded border border-zinc-200 px-3 text-sm disabled:opacity-40 dark:border-zinc-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setNewOptions((current) => [...current, `Option ${current.length + 1}`])}
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  + Add option
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {actionLoading ? 'Adding...' : 'Add question'}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Questions</h2>
            <span className="text-sm text-zinc-500">{questions.length} total</span>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center text-zinc-500 dark:border-zinc-800">
              No questions yet. Add the first one above.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  isFirst={index === 0}
                  isLast={index === questions.length - 1}
                  onSaved={(updated) => setQuestions((current) => current.map((item) => (
                    item.id === updated.id ? updated : item
                  )))}
                  onDelete={handleDelete}
                  onMove={handleMove}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
