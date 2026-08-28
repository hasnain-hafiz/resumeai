import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/auth.types";

const sampleUser: User = {
  id: "user-1",
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  photoUrl: null,
  role: "USER",
  provider: "LOCAL",
  emailVerified: true,
  createdAt: "2024-01-01T00:00:00Z",
};

// The store is a module-level singleton (create() runs once), so its state
// carries over between tests unless explicitly reset here.
beforeEach(() => {
  useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  window.localStorage.clear();
});

describe("useAuthStore", () => {
  it("starts logged out", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it("setSession logs the user in and stores both tokens", () => {
    useAuthStore.getState().setSession({ accessToken: "access-1", refreshToken: "refresh-1", user: sampleUser });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe("access-1");
    expect(state.refreshToken).toBe("refresh-1");
    expect(state.user).toEqual(sampleUser);
  });

  it("setAccessToken replaces only the access token (used after a silent refresh)", () => {
    useAuthStore.getState().setSession({ accessToken: "access-1", refreshToken: "refresh-1", user: sampleUser });
    useAuthStore.getState().setAccessToken("access-2");

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("access-2");
    expect(state.refreshToken).toBe("refresh-1"); // unchanged
  });

  it("clearSession logs the user out and clears both tokens", () => {
    useAuthStore.getState().setSession({ accessToken: "access-1", refreshToken: "refresh-1", user: sampleUser });

    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
