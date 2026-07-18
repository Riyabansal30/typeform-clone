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

export async function getForms(): Promise<Form[]> {
  const response = await fetch(`${API_BASE_URL}/api/forms`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch forms");
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
