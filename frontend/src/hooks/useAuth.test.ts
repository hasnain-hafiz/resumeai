import { describe, expect, it } from "vitest";
import { apiErrorCode, apiErrorMessage } from "@/hooks/useAuth";

/** Builds a minimal object shaped enough like an AxiosError for these helpers, without needing a real HTTP call. */
function fakeAxiosError(data?: { message?: string; code?: string | null }) {
  return data === undefined ? {} : { response: { data } };
}

describe("apiErrorMessage", () => {
  it("returns the server-provided message when present", () => {
    const error = fakeAxiosError({ message: "Invalid email or password" });
    expect(apiErrorMessage(error)).toBe("Invalid email or password");
  });

  it("falls back to the default fallback text when there is no response", () => {
    expect(apiErrorMessage(fakeAxiosError(undefined))).toBe("Something went wrong. Please try again.");
  });

  it("falls back to a custom fallback when provided", () => {
    expect(apiErrorMessage(fakeAxiosError(undefined), "Custom fallback")).toBe("Custom fallback");
  });

  it("handles a thrown non-axios value without crashing", () => {
    expect(apiErrorMessage("just a string")).toBe("Something went wrong. Please try again.");
    expect(apiErrorMessage(null)).toBe("Something went wrong. Please try again.");
  });
});

describe("apiErrorCode", () => {
  it("returns the stable error code when present", () => {
    const error = fakeAxiosError({ message: "Please verify your email", code: "EMAIL_NOT_VERIFIED" });
    expect(apiErrorCode(error)).toBe("EMAIL_NOT_VERIFIED");
  });

  it("returns null when there is no code (e.g. an unexpected 500)", () => {
    const error = fakeAxiosError({ message: "An unexpected error occurred", code: null });
    expect(apiErrorCode(error)).toBeNull();
  });

  it("returns null when there is no response at all", () => {
    expect(apiErrorCode(fakeAxiosError(undefined))).toBeNull();
  });
});
