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
  publishForm,
  Question,
  QuestionType,
  QuestionUpdateInput,
  unpublishForm,
  updateForm,
  updateQuestion,
} from '@/lib/api';
import { QuestionInput } from '@/components/question-input';

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'rating', label: 'Rating' },
];

function configurationForType(type: QuestionType, current: string[] = []) {
  if (type === 'multiple_choice') return current.length >= 2 ? current : ['Option 1', 'Option 2'];
  if (type === 'dropdown') return current.length >= 1 ? current : ['Option 1'];
  if (type === 'rating') {
    const maximum = Number(current[0] ?? 5);
    return [String(Number.isInteger(maximum) && maximum >= 3 && maximum <= 10 ? maximum : 5)];
  }
  return [];
}

function validateConfiguration(type: QuestionType, options: string[]) {
  if (type === 'multiple_choice' || type === 'dropdown') {
    const cleaned = options.map((option) => option.trim());
    const minimum = type === 'multiple_choice' ? 2 : 1;
    if (cleaned.length < minimum || cleaned.some((option) => !option)) {
      return { error: `Add at least ${minimum} non-empty option${minimum === 1 ? '' : 's'}.`, options: cleaned };
    }
    if (new Set(cleaned).size !== cleaned.length) {
      return { error: 'Options must be unique.', options: cleaned };
    }
    return { error: null, options: cleaned };
  }
  if (type === 'rating') return { error: null, options: configurationForType(type, options) };
  return { error: null, options: [] };
}

function OptionEditor({ options, onChange, minimum }: { options: string[]; onChange: (options: string[]) => void; minimum: number }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">Options</label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={option}
              onChange={(event) => onChange(options.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <button
              type="button"
              disabled={options.length <= minimum}
              onClick={() => onChange(options.filter((_, itemIndex) => itemIndex !== index))}
              className="rounded border border-zinc-200 px-3 text-sm disabled:opacity-40 dark:border-zinc-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...options, `Option ${options.length + 1}`])}
        className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
      >
        + Add option
      </button>
    </div>
  );
}

function QuestionEditor({
  question,
  isFirst,
  isLast,
  onDraft,
  onSaved,
  onDelete,
  onMove,
}: {
  question: Question;
  isFirst: boolean;
  isLast: boolean;
  onDraft: (question: Question) => void;
  onSaved: (question: Question) => void;
  onDelete: (id: number) => Promise<void>;
  onMove: (question: Question, direction: -1 | 1) => Promise<void>;
}) {
  const [text, setText] = useState(question.text);
  const [type, setType] = useState<QuestionType>(question.question_type);
  const [required, setRequired] = useState(question.is_required);
  const [options, setOptions] = useState<string[]>(configurationForType(question.question_type, question.options ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOptions = (next: string[]) => {
    setOptions(next);
    onDraft({ ...question, text, question_type: type, is_required: required, options: next });
  };

  const changeType = (nextType: QuestionType) => {
    const nextOptions = configurationForType(nextType, options);
    setType(nextType);
    setOptions(nextOptions);
    onDraft({ ...question, text, question_type: nextType, is_required: required, options: nextOptions.length ? nextOptions : null });
  };

  const save = async () => {
    if (!text.trim()) return setError('Question text is required.');
    const configuration = validateConfiguration(type, options);
    if (configuration.error) return setError(configuration.error);

    const input: QuestionUpdateInput = {
      text: text.trim(),
      question_type: type,
      is_required: required,
      options: configuration.options.length ? configuration.options : null,
    };
    try {
      setSaving(true);
      setError(null);
      const updated = await updateQuestion(question.id, input);
      setOptions(configurationForType(updated.question_type, updated.options ?? []));
      onSaved(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-500">Question {question.display_order}</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => onMove(question, -1)} disabled={isFirst || saving} className="rounded border border-zinc-200 px-2.5 py-1 text-sm disabled:opacity-40 dark:border-zinc-700">Up</button>
          <button type="button" onClick={() => onMove(question, 1)} disabled={isLast || saving} className="rounded border border-zinc-200 px-2.5 py-1 text-sm disabled:opacity-40 dark:border-zinc-700">Down</button>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Question text</label>
          <input
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              onDraft({ ...question, text: event.target.value, question_type: type, is_required: required, options: options.length ? options : null });
            }}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select value={type} onChange={(event) => changeType(event.target.value as QuestionType)} className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
              {QUESTION_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={required}
              onChange={(event) => {
                setRequired(event.target.checked);
                onDraft({ ...question, text, question_type: type, is_required: event.target.checked, options: options.length ? options : null });
              }}
            /> Required question
          </label>
        </div>
        {(type === 'multiple_choice' || type === 'dropdown') && (
          <OptionEditor options={options} onChange={updateOptions} minimum={type === 'multiple_choice' ? 2 : 1} />
        )}
        {type === 'rating' && (
          <div>
            <label className="mb-1 block text-sm font-medium">Maximum rating</label>
            <select value={options[0] ?? '5'} onChange={(event) => updateOptions([event.target.value])} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
              {Array.from({ length: 8 }, (_, index) => index + 3).map((value) => <option key={value}>{value}</option>)}
            </select>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button type="button" onClick={() => onDelete(question.id)} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Delete</button>
          <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save question'}</button>
        </div>
      </div>
    </article>
  );
}

function PreviewPanel({ form, questions }: { form: Form; questions: Question[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const safeIndex = Math.min(index, Math.max(questions.length - 1, 0));
  const question = questions[safeIndex];

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:sticky lg:top-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">Live preview</h2>
        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Preview mode</span>
      </div>
      <div className="flex min-h-[520px] flex-col justify-center rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-900">
        {questions.length === 0 || !question ? (
          <div className="text-center text-zinc-500">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">No questions yet</h3>
            <p className="mt-2 text-sm">Add a question to see the live form preview.</p>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <div className="flex justify-between text-xs font-semibold text-indigo-600"><span>{safeIndex + 1} of {questions.length}</span><span>{Math.round(((safeIndex + 1) / questions.length) * 100)}%</span></div>
              <div className="mt-2 h-1 rounded bg-zinc-200 dark:bg-zinc-800"><div className="h-full rounded bg-indigo-600" style={{ width: `${((safeIndex + 1) / questions.length) * 100}%` }} /></div>
            </div>
            <p className="text-sm font-medium text-zinc-500">{form.title}</p>
            {form.description && <p className="mt-1 text-sm text-zinc-400">{form.description}</p>}
            <h3 className="mb-6 mt-4 text-2xl font-bold">{question.text}{question.is_required && <span className="ml-1 text-red-500">*</span>}</h3>
            <QuestionInput question={question} value={answers[question.id] ?? ''} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} />
            <div className="mt-8 flex justify-between">
              <button type="button" disabled={safeIndex === 0} onClick={() => setIndex(Math.max(0, safeIndex - 1))} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-zinc-700">Previous</button>
              <button type="button" onClick={() => setIndex(safeIndex === questions.length - 1 ? 0 : safeIndex + 1)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">{safeIndex === questions.length - 1 ? 'Restart' : 'Next'}</button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default function FormBuilderPage() {
  const params = useParams<{ id: string }>();
  const formId = Number(params.id);
  const invalidFormId = !Number.isInteger(formId) || formId < 1;
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'build' | 'preview'>('build');
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState<QuestionType>('short_text');
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    if (invalidFormId) return;
    Promise.all([getForm(formId), getQuestions(formId)])
      .then(([formData, questionData]) => {
        if (active) { setForm(formData); setQuestions(questionData); }
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load builder.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [formId, invalidFormId]);

  const refreshQuestions = async () => setQuestions(await getQuestions(formId));

  const createNewQuestion = async (event: FormEvent) => {
    event.preventDefault();
    if (!newText.trim()) return setError('Question text is required.');
    const configuration = validateConfiguration(newType, newOptions);
    if (configuration.error) return setError(configuration.error);
    try {
      setActionLoading(true); setError(null);
      await createQuestion(formId, {
        text: newText.trim(), question_type: newType, is_required: newRequired,
        options: configuration.options.length ? configuration.options : null,
      });
      setNewText(''); setNewType('short_text'); setNewRequired(false); setNewOptions([]);
      await refreshQuestions();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to add question.'); }
    finally { setActionLoading(false); }
  };

  const saveFormSettings = async () => {
    if (!form || !form.title.trim()) return;
    try {
      setActionLoading(true); setError(null);
      setForm(await updateForm(form.id, { title: form.title.trim(), description: form.description }));
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to save form.'); }
    finally { setActionLoading(false); }
  };

  const deleteOne = async (id: number) => {
    if (!window.confirm('Delete this question?')) return;
    try { await deleteQuestion(id); await refreshQuestions(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to delete question.'); }
  };

  const move = async (question: Question, direction: -1 | 1) => {
    try { await updateQuestion(question.id, { display_order: question.display_order + direction }); await refreshQuestions(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to reorder question.'); }
  };

  const togglePublish = async () => {
    if (!form) return;
    try {
      setActionLoading(true); setError(null);
      setForm(form.status === 'published' ? await unpublishForm(form.id) : await publishForm(form.id));
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to update publish status.'); }
    finally { setActionLoading(false); }
  };

  if (invalidFormId) return <main className="flex min-h-screen flex-col items-center justify-center gap-4"><p className="text-red-600">Invalid form id.</p><Link href="/" className="font-semibold text-indigo-600">Back to dashboard</Link></main>;
  if (loading) return <main className="flex min-h-screen items-center justify-center">Loading builder...</main>;
  if (!form) return <main className="flex min-h-screen flex-col items-center justify-center gap-4"><p className="text-red-600">{error ?? 'Form not found.'}</p><Link href="/" className="font-semibold text-indigo-600">Back to dashboard</Link></main>;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div><Link href="/" className="text-sm font-semibold text-indigo-600">← Dashboard</Link><h1 className="mt-1 text-2xl font-bold">{form.title}</h1></div>
          <div className="flex items-center gap-3">
            {form.status === 'published' && form.public_slug && <Link href={`/forms/public/${form.public_slug}`} target="_blank" className="hidden text-sm font-semibold text-indigo-600 sm:block">Open public form</Link>}
            <button type="button" onClick={togglePublish} disabled={actionLoading} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${form.status === 'published' ? 'bg-zinc-600' : 'bg-emerald-600'}`}>{form.status === 'published' ? 'Unpublish' : 'Publish'}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 grid grid-cols-2 rounded-lg bg-zinc-200 p-1 dark:bg-zinc-800 lg:hidden">
          <button type="button" onClick={() => setMobilePanel('build')} className={`rounded-md px-3 py-2 text-sm font-semibold ${mobilePanel === 'build' ? 'bg-white shadow dark:bg-zinc-900' : ''}`}>Build</button>
          <button type="button" onClick={() => setMobilePanel('preview')} className={`rounded-md px-3 py-2 text-sm font-semibold ${mobilePanel === 'preview' ? 'bg-white shadow dark:bg-zinc-900' : ''}`}>Preview</button>
        </div>
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className={`space-y-6 ${mobilePanel === 'build' ? 'block' : 'hidden'} lg:block`}>
            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Form details</h2><button type="button" onClick={saveFormSettings} className="text-sm font-semibold text-indigo-600">Save details</button></div>
              <div className="mt-4 space-y-3">
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
                <textarea value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value || null })} placeholder="Form description" className="h-20 w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-bold">Add question</h2>
              <form onSubmit={createNewQuestion} className="mt-4 space-y-4">
                <input value={newText} onChange={(event) => setNewText(event.target.value)} placeholder="Enter question text" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <select value={newType} onChange={(event) => { const type = event.target.value as QuestionType; setNewType(type); setNewOptions(configurationForType(type)); }} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">{QUESTION_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
                  <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={newRequired} onChange={(event) => setNewRequired(event.target.checked)} /> Required question</label>
                </div>
                {(newType === 'multiple_choice' || newType === 'dropdown') && <OptionEditor options={newOptions} onChange={setNewOptions} minimum={newType === 'multiple_choice' ? 2 : 1} />}
                {newType === 'rating' && <div><label className="mr-3 text-sm font-medium">Maximum rating</label><select value={newOptions[0] ?? '5'} onChange={(event) => setNewOptions([event.target.value])} className="rounded-lg border px-3 py-2 dark:bg-zinc-800">{Array.from({ length: 8 }, (_, index) => index + 3).map((value) => <option key={value}>{value}</option>)}</select></div>}
                <button type="submit" disabled={actionLoading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Add question</button>
              </form>
            </section>

            <section className="space-y-4">
              <div className="flex justify-between"><h2 className="text-xl font-bold">Questions</h2><span className="text-sm text-zinc-500">{questions.length} total</span></div>
              {questions.length === 0 ? <div className="rounded-xl border-2 border-dashed border-zinc-200 py-12 text-center text-zinc-500">No questions yet.</div> : questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  isFirst={index === 0}
                  isLast={index === questions.length - 1}
                  onDraft={(draft) => setQuestions((current) => current.map((item) => item.id === draft.id ? draft : item))}
                  onSaved={(saved) => setQuestions((current) => current.map((item) => item.id === saved.id ? saved : item))}
                  onDelete={deleteOne}
                  onMove={move}
                />
              ))}
            </section>
          </div>

          <div className={`${mobilePanel === 'preview' ? 'block' : 'hidden'} lg:block`}>
            <PreviewPanel form={form} questions={questions} />
          </div>
        </div>
      </main>
    </div>
  );
}
