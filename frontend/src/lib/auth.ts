export interface AuthUser {
  id: string;
  phone_number: string;
  is_verified: boolean;
}

export interface AuthPayload {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  user: AuthUser;
}

export function saveAuth(data: AuthPayload) {
  localStorage.setItem("user_access_token", data.access_token);
  localStorage.setItem("user_refresh_token", data.refresh_token);
  localStorage.setItem("quakeguard_user", JSON.stringify(data.user));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("user_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("user_refresh_token");
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("quakeguard_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("user_access_token");
  localStorage.removeItem("user_refresh_token");
  localStorage.removeItem("quakeguard_user");
  localStorage.removeItem("quakeguard_emergency");
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}
