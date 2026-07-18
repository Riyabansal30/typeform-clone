'use client';

import { useEffect, useState } from 'react';
import {
  getForms,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
  Form
} from '@/lib/api';

export default function FormsDashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal triggers & form values
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameFormId, setRenameFormId] = useState<number | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFormId, setDeleteFormId] = useState<number | null>(null);
  const [deleteFormTitle, setDeleteFormTitle] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  // Load / Refresh forms
  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await getForms();
      setForms(data);
      setError(null);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch forms. Is the backend server running? (${msg})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function initLoad() {
      try {
        const data = await getForms();
        if (active) {
          setForms(data);
          setError(null);
        }
      } catch (err: unknown) {
        console.error(err);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (active) {
          setError(`Failed to fetch forms. Is the backend server running? (${msg})`);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    initLoad();
    return () => {
      active = false;
    };
  }, []);

  // Handle Form Creation
  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    try {
      setActionLoading(true);
      await createForm({
        title: createTitle,
        description: createDesc || null,
        status: 'draft',
      });
      setCreateTitle('');
      setCreateDesc('');
      setShowCreateModal(false);
      await loadForms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Error creating form: ' + msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Form Duplication
  const handleDuplicate = async (id: number) => {
    try {
      setActionLoading(true);
      await duplicateForm(id);
      await loadForms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Error duplicating form: ' + msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Form Rename
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFormId || !renameTitle.trim()) return;

    try {
      setActionLoading(true);
      await updateForm(renameFormId, { title: renameTitle });
      setRenameTitle('');
      setRenameFormId(null);
      setShowRenameModal(false);
      await loadForms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Error renaming form: ' + msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Form Deletion
  const handleDeleteSubmit = async () => {
    if (!deleteFormId) return;

    try {
      setActionLoading(true);
      await deleteForm(deleteFormId);
      setDeleteFormId(null);
      setDeleteFormTitle('');
      setShowDeleteModal(false);
      await loadForms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Error deleting form: ' + msg);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans pb-12">
      {/* Navbar Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur sticky top-0 z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-600/20">
              T
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              Typeform Clone
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              API Connected
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              Build, duplicate, and manage your interactive workspace forms.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <svg
              className="mr-2 h-4 w-4 stroke-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Form
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={loadForms} className="text-sm font-semibold underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-zinc-500">Loading forms...</p>
          </div>
        ) : forms.length === 0 ? (
          /* Empty State */
          <div className="text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl py-16 px-4 max-w-lg mx-auto bg-white dark:bg-zinc-900/50 shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-650"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold">No forms yet</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Create your very first form to start collecting feedback. It only takes a second.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        ) : (
          /* Forms Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <div
                key={form.id}
                className="group flex flex-col justify-between p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/[0.02] transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {form.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${form.status === 'published'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                    >
                      {form.status}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-500 dark:text-zinc-400 min-h-[40px] line-clamp-2 mb-4">
                    {form.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <span>Created {formatDate(form.created_at)}</span>

                  <div className="flex items-center gap-1">
                    {/* Rename */}
                    <button
                      onClick={() => {
                        setRenameFormId(form.id);
                        setRenameTitle(form.title);
                        setShowRenameModal(true);
                      }}
                      className="p-1.5 rounded text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Rename Form"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicate(form.id)}
                      className="p-1.5 rounded text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Duplicate Form"
                      disabled={actionLoading}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        setDeleteFormId(form.id);
                        setDeleteFormTitle(form.title);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                      title="Delete Form"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE FORM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Create New Form</h3>
            <form onSubmit={handleCreateForm}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Form Title</label>
                  <input
                    type="text"
                    required
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="e.g. User Contact Form"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description (Optional)</label>
                  <textarea
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="Briefly describe what this form is for..."
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateTitle('');
                    setCreateDesc('');
                    setShowCreateModal(false);
                  }}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-100 cursor-pointer"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-600/10 cursor-pointer"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating...' : 'Create Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Rename Form</h3>
            <form onSubmit={handleRenameSubmit}>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">New Title</label>
                <input
                  type="text"
                  required
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  placeholder="e.g. New Form Title"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRenameTitle('');
                    setRenameFormId(null);
                    setShowRenameModal(false);
                  }}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-100 cursor-pointer"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-600/10 cursor-pointer"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Rename'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Delete Form?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
              Are you sure you want to delete <strong className="text-zinc-800 dark:text-zinc-200">&quot;{deleteFormTitle}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteFormId(null);
                  setDeleteFormTitle('');
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-100 cursor-pointer"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="px-4 py-2 bg-red-650 text-white rounded-lg text-sm font-semibold hover:bg-red-500 shadow-md shadow-red-600/10 cursor-pointer"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
