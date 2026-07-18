const API_BASE_URL = "http://127.0.0.1:8000";

export async function getForms() {
  const response = await fetch(`${API_BASE_URL}/api/forms`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch forms");
  }

  return response.json();
}
