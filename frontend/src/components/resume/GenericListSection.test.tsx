import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenericListSection, type FieldConfig } from "@/components/resume/GenericListSection";

interface Certification {
  id: string;
  name: string;
  issuer: string;
  sortOrder: number;
}

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "issuer", label: "Issuer", type: "text" },
];

const EXISTING: Certification[] = [
  { id: "cert-1", name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", sortOrder: 0 },
];

describe("GenericListSection", () => {
  it("shows an empty state when there are no items", () => {
    render(
      <GenericListSection<Certification>
        title="Certifications"
        fields={FIELDS}
        items={[]}
        titleField="name"
        subtitleField="issuer"
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/nothing added yet/i)).toBeInTheDocument();
  });

  it("lists existing items by their title and subtitle fields", () => {
    render(
      <GenericListSection<Certification>
        title="Certifications"
        fields={FIELDS}
        items={EXISTING}
        titleField="name"
        subtitleField="issuer"
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("AWS Certified Solutions Architect")).toBeInTheDocument();
    expect(screen.getByText("Amazon Web Services")).toBeInTheDocument();
  });

  it("submits new field values through onAdd when the Add form is filled in", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();

    render(
      <GenericListSection<Certification>
        title="Certifications"
        fields={FIELDS}
        items={[]}
        titleField="name"
        subtitleField="issuer"
        onAdd={handleAdd}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /add/i }));
    await user.type(screen.getByLabelText("Name"), "PMP");
    await user.type(screen.getByLabelText("Issuer"), "PMI");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(handleAdd).toHaveBeenCalledWith({ name: "PMP", issuer: "PMI" });
  });

  it("pre-fills the form with an item's current values when editing, and calls onUpdate with its id", async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn();

    render(
      <GenericListSection<Certification>
        title="Certifications"
        fields={FIELDS}
        items={EXISTING}
        titleField="name"
        subtitleField="issuer"
        onAdd={vi.fn()}
        onUpdate={handleUpdate}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByLabelText("Name")).toHaveValue("AWS Certified Solutions Architect");

    await user.clear(screen.getByLabelText("Issuer"));
    await user.type(screen.getByLabelText("Issuer"), "AWS");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(handleUpdate).toHaveBeenCalledWith("cert-1", { name: "AWS Certified Solutions Architect", issuer: "AWS" });
  });

  it("calls onDelete with the item's id", async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();

    render(
      <GenericListSection<Certification>
        title="Certifications"
        fields={FIELDS}
        items={EXISTING}
        titleField="name"
        subtitleField="issuer"
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={handleDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(handleDelete).toHaveBeenCalledWith("cert-1");
  });

  it("cancel closes the form without calling onAdd", async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();

    render(
      <GenericListSection<Certification>
        title="Certifications"
        fields={FIELDS}
        items={[]}
        titleField="name"
        subtitleField="issuer"
        onAdd={handleAdd}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /add/i }));
    await user.type(screen.getByLabelText("Name"), "Should be discarded");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(handleAdd).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("reports the in-progress edit to onDraftItems on every keystroke, without calling onUpdate", async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn();
    const handleDraft = vi.fn();

    render(
      <GenericListSection<Certification>
        title="Certifications"
        fields={FIELDS}
        items={EXISTING}
        titleField="name"
        subtitleField="issuer"
        onAdd={vi.fn()}
        onUpdate={handleUpdate}
        onDelete={vi.fn()}
        onDraftItems={handleDraft}
      />
    );

    // Mounts with no unsaved edit in progress.
    expect(handleDraft).toHaveBeenLastCalledWith(undefined);

    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.clear(screen.getByLabelText("Issuer"));
    await user.type(screen.getByLabelText("Issuer"), "A");

    // The unsaved value is reflected in the reported draft list immediately -
    // before Save is clicked and without ever calling onUpdate.
    expect(handleDraft).toHaveBeenLastCalledWith([
      { id: "cert-1", name: "AWS Certified Solutions Architect", issuer: "A", sortOrder: 0 },
    ]);
    expect(handleUpdate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /save/i }));

    // Once submitted there's no unsaved edit left to preview - the real,
    // saved data (invalidated/refetched by the caller) should take over.
    expect(handleDraft).toHaveBeenLastCalledWith(undefined);
  });

  it("reports a synthetic draft item while adding, before it has a real id", async () => {
    const user = userEvent.setup();
    const handleDraft = vi.fn();

    render(
      <GenericListSection<Certification>
        title="Certifications"
        fields={FIELDS}
        items={[]}
        titleField="name"
        subtitleField="issuer"
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDraftItems={handleDraft}
      />
    );

    await user.click(screen.getByRole("button", { name: /add/i }));
    await user.type(screen.getByLabelText("Name"), "PMP");

    const lastCall = handleDraft.mock.calls.at(-1)?.[0];
    expect(lastCall).toHaveLength(1);
    expect(lastCall[0]).toMatchObject({ name: "PMP", issuer: "" });
  });
});
