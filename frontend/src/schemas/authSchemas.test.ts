import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, resetPasswordSchema, forgotPasswordSchema } from "@/schemas/authSchemas";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.safeParse({ email: "ada@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "ada@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    password: "Password1",
    confirmPassword: "Password1",
  };

  it("accepts a fully valid registration", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("rejects when passwords don't match", () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: "Different1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it.each([
    ["short", "Ab1"],
    ["no uppercase", "password1"],
    ["no lowercase", "PASSWORD1"],
    ["no digit", "Password"],
  ])("rejects a password that is %s", (_label, password) => {
    const result = registerSchema.safeParse({ ...base, password, confirmPassword: password });
    expect(result.success).toBe(false);
  });

  it("rejects a full name under 2 characters", () => {
    const result = registerSchema.safeParse({ ...base, fullName: "A" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("rejects mismatched new passwords", () => {
    const result = resetPasswordSchema.safeParse({ newPassword: "Password1", confirmPassword: "Password2" });
    expect(result.success).toBe(false);
  });

  it("accepts matching, valid passwords", () => {
    const result = resetPasswordSchema.safeParse({ newPassword: "Password1", confirmPassword: "Password1" });
    expect(result.success).toBe(true);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a non-empty, valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: "ada@example.com" }).success).toBe(true);
  });
});
