import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // onMouseDown (not onClick) preserves the text selection the command should act on.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="flex h-7 w-7 items-center justify-center rounded-md text-sm text-ink-900/70 hover:bg-ink-900/[0.06] dark:text-paper-50/70 dark:hover:bg-paper-50/10"
    >
      {children}
    </button>
  );
}

/**
 * A small contentEditable-based editor rather than pulling in a rich-text
 * library outside the agreed stack. Supports bold, italic, and bullet lists -
 * the formatting resumes actually use - and stores/emits sanitized-by-the-
 * browser HTML, matching the `summary` column (stored as TEXT/HTML).
 */
export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  // Keep the DOM in sync with external value changes (e.g. loading a resume),
  // but never overwrite the DOM while the user is actively typing in it.
  useEffect(() => {
    if (editorRef.current && !isFocused.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (command: string) => {
    document.execCommand(command, false);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="rounded-xl border border-ink-900/10 dark:border-paper-50/10 bg-white dark:bg-ink-900">
      <div className="flex items-center gap-1 border-b border-ink-900/8 dark:border-paper-50/10 px-2 py-1.5">
        <ToolbarButton label="Bold" onClick={() => exec("bold")}>
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec("italic")}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton label="Bullet list" onClick={() => exec("insertUnorderedList")}>
          •≡
        </ToolbarButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-placeholder={placeholder}
        onFocus={() => (isFocused.current = true)}
        onBlur={() => (isFocused.current = false)}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="min-h-[120px] px-3.5 py-3 text-sm text-ink-950 dark:text-paper-50 outline-none [&_ul]:list-disc [&_ul]:pl-5 empty:before:text-ink-900/35 empty:before:content-[attr(aria-placeholder)] dark:empty:before:text-paper-50/35"
      />
    </div>
  );
}
