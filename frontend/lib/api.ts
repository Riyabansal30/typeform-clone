const API_BASE_URL = "http://127.0.0.1:8000";

export interface Form {
  id: number;
  title: string;
  description: string | null;
  status: string;
  public_slug: string | null;
  thank_you_message: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface FormCreateInput {
  title: string;
  description?: string | null;
  status?: string;
  public_slug?: string | null;
  thank_you_message?: string;
}

export interface FormUpdateInput {
  title?: string;
  description?: string | null;
  status?: string;
  public_slug?: string | null;
  thank_you_message?: string;
  published_at?: string | null;
}

export type QuestionType =
  | "short_text"
  | "long_text"
  | "email"
  | "number"
  | "multiple_choice";

export interface Question {
  id: number;
  form_id: number;
  text: string;
  question_type: QuestionType;
  is_required: boolean;
  display_order: number;
  options: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionCreateInput {
  text: string;
  question_type: QuestionType;
  is_required?: boolean;
  options?: string[] | null;
}

export interface QuestionUpdateInput {
  text?: string;
  question_type?: QuestionType;
  is_required?: boolean;
  display_order?: number;
  options?: string[] | null;
}

export async function getForms(): Promise<Form[]> {
  const response = await fetch(`${API_BASE_URL}/api/forms`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch forms");
  }
  return response.json();
}

export async function getForm(id: number): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${id}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch form");
  }
  return response.json();
}

export async function createForm(input: FormCreateInput): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/forms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to create form");
  }
  return response.json();
}

export async function updateForm(id: number, input: FormUpdateInput): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to update form");
  }
  return response.json();
}

export async function deleteForm(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete form");
  }
}

export async function duplicateForm(id: number): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${id}/duplicate`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to duplicate form");
  }
  return response.json();
}


export async function getQuestions(formId: number): Promise<Question[]> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${formId}/questions`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch questions");
  }
  return response.json();
}

export async function createQuestion(
  formId: number,
  input: QuestionCreateInput,
): Promise<Question> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${formId}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to create question");
  }
  return response.json();
}

export async function updateQuestion(
  id: number,
  input: QuestionUpdateInput,
): Promise<Question> {
  const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to update question");
  }
  return response.json();
}

export async function deleteQuestion(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete question");
  }
}


export interface PublicForm {
  id: number;
  title: string;
  description: string | null;
  thank_you_message: string;
  public_slug: string;
  questions: Question[];
}

export interface SubmissionAnswerInput {
  question_id: number;
  value: string;
}

export interface SubmissionResponse {
  id: number;
  submitted_at: string;
  thank_you_message: string;
}

export async function publishForm(id: number): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${id}/publish`, { method: "POST" });
  if (!response.ok) throw new Error("Failed to publish form");
  return response.json();
}

export async function unpublishForm(id: number): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/forms/${id}/unpublish`, { method: "POST" });
  if (!response.ok) throw new Error("Failed to unpublish form");
  return response.json();
}

export async function getPublicForm(slug: string): Promise<PublicForm> {
  const response = await fetch(`${API_BASE_URL}/api/public/forms/${slug}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Published form not found");
  return response.json();
}

export async function submitPublicForm(
  slug: string,
  answers: SubmissionAnswerInput[],
): Promise<SubmissionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/public/forms/${slug}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? "Failed to submit form");
  }
  return response.json();
}
