const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const api = {
  get: async (path: string) => {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error("API error");
    return res.json();
  },

  post: async (path: string, body: unknown) => {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message ?? "Request failed");
    }
    return res.json();
  },
};

export async function login(email: string, password: string) {
  const data = await api.post("/auth/login", { email, password });
  if (data.token) {
    localStorage.setItem("ravro_token", data.token);
    localStorage.setItem("ravro_user", JSON.stringify(data.user ?? {}));
  }
  return data;
}

export async function register(
  email: string,
  password: string,
  role: "merchant" | "supplier",
  name: string
) {
  const data = await api.post("/auth/register", { email, password, role, name });
  if (data.token) {
    localStorage.setItem("ravro_token", data.token);
    localStorage.setItem("ravro_user", JSON.stringify(data.user ?? {}));
  }
  return data;
}

export function logout() {
  localStorage.removeItem("ravro_token");
  localStorage.removeItem("ravro_user");
}
