export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:4000").replace(/\/$/, "");

export async function apiRequest(path, { token = "", method = "GET", body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }
  return data;
}
