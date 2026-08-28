import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormField } from "@/components/auth/FormField";

describe("FormField", () => {
  it("renders a label wired to the input via htmlFor/id", () => {
    render(<FormField label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("shows an error message and marks the input invalid", () => {
    render(<FormField label="Email" error="Enter a valid email address" />);
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a hint only when there is no error", () => {
    render(<FormField label="Password" hint="At least 8 characters" />);
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
  });

  it("hides the hint once an error is present", () => {
    render(<FormField label="Password" hint="At least 8 characters" error="Too short" />);
    expect(screen.queryByText("At least 8 characters")).not.toBeInTheDocument();
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });

  it("forwards typing through to the underlying input", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<FormField label="Full name" onChange={handleChange} />);

    await user.type(screen.getByLabelText("Full name"), "Ada");

    expect(handleChange).toHaveBeenCalled();
    expect(screen.getByLabelText("Full name")).toHaveValue("Ada");
  });
});
