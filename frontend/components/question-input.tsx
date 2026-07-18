'use client';

import { Question } from '@/lib/api';

export function getRatingMaximum(question: Pick<Question, 'options'>) {
  const parsed = Number(question.options?.[0] ?? 5);
  return Number.isInteger(parsed) && parsed >= 3 && parsed <= 10 ? parsed : 5;
}

export function QuestionInput({
  question,
  value,
  onChange,
  autoFocus = false,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const baseInput = 'w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900';

  if (question.question_type === 'long_text') {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        autoFocus={autoFocus}
        className={baseInput}
      />
    );
  }

  if (question.question_type === 'multiple_choice' || question.question_type === 'yes_no') {
    const choices = question.question_type === 'yes_no' ? ['Yes', 'No'] : question.options ?? [];
    return (
      <div className="space-y-3">
        {choices.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${value === option ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-zinc-300 hover:border-indigo-300 dark:border-zinc-700'}`}
          >
            <span className={`h-4 w-4 rounded-full border ${value === option ? 'border-indigo-600 bg-indigo-600 ring-2 ring-indigo-200' : 'border-zinc-400'}`} />
            <span>{option}</span>
          </button>
        ))}
      </div>
    );
  }

  if (question.question_type === 'dropdown') {
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)} className={baseInput}>
        <option value="">Select an option</option>
        {(question.options ?? []).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (question.question_type === 'rating') {
    const maximum = getRatingMaximum(question);
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: maximum }, (_, index) => String(index + 1)).map((rating) => (
          <button
            key={rating}
            type="button"
            aria-label={`Rating ${rating} of ${maximum}`}
            aria-pressed={value === rating}
            onClick={() => onChange(rating)}
            className={`h-11 min-w-11 rounded-lg border px-3 font-semibold transition-colors ${value === rating ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-zinc-300 bg-white hover:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900'}`}
          >
            {rating}
          </button>
        ))}
      </div>
    );
  }

  const inputType = question.question_type === 'email'
    ? 'email'
    : question.question_type === 'number'
      ? 'number'
      : 'text';

  return (
    <input
      type={inputType}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoFocus={autoFocus}
      className={baseInput}
    />
  );
}
