'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  deleteFormSubmissions,
  FormResults,
  getFormResults,
  QuestionSummary,
} from '@/lib/api';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatNumber(value: number | null) {
  return value === null ? '—' : Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function SummaryCard({ question }: { question: QuestionSummary }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="font-semibold">{question.title}</h3>
      <p className="mt-1 text-xs capitalize text-zinc-400">{question.type.replace('_', ' ')}</p>
      <div className="mt-4 flex gap-4 text-sm">
        <div><span className="block font-bold">{question.answered_count}</span><span className="text-zinc-500">Answered</span></div>
        <div><span className="block font-bold">{question.unanswered_count}</span><span className="text-zinc-500">Unanswered</span></div>
      </div>

      {question.type === 'number' && (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
          <div><span className="block text-xs text-zinc-500">Average</span>{formatNumber(question.average)}</div>
          <div><span className="block text-xs text-zinc-500">Minimum</span>{formatNumber(question.minimum)}</div>
          <div><span className="block text-xs text-zinc-500">Maximum</span>{formatNumber(question.maximum)}</div>
        </div>
      )}

      {question.type === 'multiple_choice' && (
        <div className="mt-4 space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {(question.options ?? []).map((option) => (
            <div key={option.value}>
              <div className="mb-1 flex justify-between gap-3 text-xs">
                <span className="truncate">{option.value}</span>
                <span className="shrink-0 text-zinc-500">{option.count} · {option.percentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${option.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function ResponsesPage() {
  const params = useParams<{ id: string }>();
  const formId = Number(params.id);
  const [results, setResults] = useState<FormResults | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadResults() {
      if (!Number.isInteger(formId) || formId < 1) {
        setError('Unknown form.');
        setLoading(false);
        return;
      }
      try {
        const data = await getFormResults(formId);
        if (active) {
          setResults(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load results.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadResults();
    return () => { active = false; };
  }, [formId]);

  const toggleSelection = (submissionId: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(submissionId)) next.delete(submissionId);
      else next.add(submissionId);
      return next;
    });
  };

  const allSelected = Boolean(
    results?.submissions.length && selectedIds.size === results.submissions.length,
  );

  const toggleSelectAll = () => {
    if (!results) return;
    setSelectedIds(allSelected ? new Set() : new Set(results.submissions.map((item) => item.id)));
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected response${selectedIds.size === 1 ? '' : 's'}?`)) return;

    try {
      setDeleting(true);
      setError(null);
      await deleteFormSubmissions(formId, Array.from(selectedIds));
      const refreshed = await getFormResults(formId);
      setResults(refreshed);
      setSelectedIds(new Set());
      setFeedback('Selected responses deleted');
      window.setTimeout(() => setFeedback(null), 2500);
    } catch (err: unknown) {
      setFeedback(null);
      setError(err instanceof Error ? err.message : 'Failed to delete responses.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center">Loading results...</main>;
  }

  if (!results || error && !results) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Results unavailable</h1>
        <p className="text-zinc-500">{error ?? 'Unknown form.'}</p>
        <Link href="/" className="font-semibold text-indigo-600">Back to Dashboard</Link>
      </main>
    );
  }

  const totalResponses = results.summary.total_responses;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            ← Back to Dashboard
          </Link>
          <div className="mt-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-zinc-500">Results for</p>
              <h1 className="text-2xl font-bold">{results.form.title}</h1>
            </div>
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        )}
        {feedback && (
          <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
            {feedback}
          </div>
        )}

        <section>
          <h2 className="mb-4 text-xl font-bold">Summary</h2>
          {totalResponses === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              Summary statistics will appear after the first response.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.summary.questions.map((question) => (
                <SummaryCard key={question.question_id} question={question} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex min-h-10 flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-xl font-bold">Responses</h2>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500">{selectedIds.size} selected</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          {totalResponses === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-lg font-bold">No responses yet</h3>
              <p className="mt-2 text-sm text-zinc-500">Submitted responses will appear here.</p>
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <table className="min-w-max border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-zinc-100 text-xs uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all responses"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="min-w-28 px-4 py-3">Response</th>
                    <th className="min-w-52 px-4 py-3">Submitted</th>
                    {results.questions.map((question) => (
                      <th key={question.id} className="min-w-52 max-w-xs px-4 py-3 normal-case">
                        {question.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {results.submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select response ${submission.id}`}
                          checked={selectedIds.has(submission.id)}
                          onChange={() => toggleSelection(submission.id)}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold">#{submission.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{formatDateTime(submission.submitted_at)}</td>
                      {results.questions.map((question) => {
                        const answer = submission.answers[String(question.id)]?.trim();
                        return (
                          <td key={question.id} className="max-w-xs whitespace-pre-wrap break-words px-4 py-3 align-top">
                            {answer || <span className="text-zinc-400">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
