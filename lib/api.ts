const rawBase =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:3001";
const API_BASE = rawBase === "" ? "" : rawBase.replace(/\/$/, "");

export function getApiBase() {
  return API_BASE;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("metasight-token");
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("metasight-token", token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("metasight-token");
}

export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${getApiBase()}${path}`;
  return fetch(url, { ...init, headers });
}
