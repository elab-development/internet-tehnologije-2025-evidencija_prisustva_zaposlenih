const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  // default content-type (ako šalješ body)
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // token iz localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    // NEMA potrebe za cookies
    credentials: "omit",
  });

  if (!res.ok) {
    let msg = "Greška na serveru.";
    try {
      const json = await res.json();
      msg = json.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  return (await res.json()) as T;
}
