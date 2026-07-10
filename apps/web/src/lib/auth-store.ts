import { create } from "zustand";
import { AuthenticatedUser } from "@druksave/shared";

interface AuthState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  setSession: (user: AuthenticatedUser, accessToken: string) => void;
  clearSession: () => void;
  setStatus: (status: AuthState["status"]) => void;
}

/**
 * Access token lives only in memory (this store) — never localStorage — so
 * it can't be read by an XSS payload that persists across reloads. The
 * refresh token lives in an httpOnly cookie the browser JS never sees; on
 * a fresh page load, hydrateSession() below calls /api/auth/refresh to
 * silently re-establish an access token from that cookie.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  setSession: (user, accessToken) => set({ user, accessToken, status: "authenticated" }),
  clearSession: () => set({ user: null, accessToken: null, status: "unauthenticated" }),
  setStatus: (status) => set({ status }),
}));

export async function hydrateSession(): Promise<void> {
  useAuthStore.getState().setStatus("loading");
  try {
    const response = await fetch("/api/auth/refresh", { method: "POST" });
    if (!response.ok) {
      useAuthStore.getState().clearSession();
      return;
    }
    const data = await response.json();
    useAuthStore.getState().setSession(data.user, data.accessToken);
  } catch {
    useAuthStore.getState().clearSession();
  }
}
