export interface CurrentUser {
  id: string;
  email: string;
  role: "merchant" | "supplier" | "admin";
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}
