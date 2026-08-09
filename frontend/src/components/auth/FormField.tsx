import { forwardRef, useId, type InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, id, ...inputProps }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="mb-5">
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-900 dark:text-paper-50 mb-1.5">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`w-full rounded-xl border bg-white dark:bg-ink-900 px-3.5 py-2.5 text-sm text-ink-950 dark:text-paper-50
            placeholder:text-ink-900/35 dark:placeholder:text-paper-50/35 outline-none transition-colors
            focus:ring-2 focus:ring-accent/30 focus:border-accent
            ${error ? "border-danger" : "border-ink-900/10 dark:border-paper-50/10"}`}
          {...inputProps}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-900/45 dark:text-paper-50/45">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
