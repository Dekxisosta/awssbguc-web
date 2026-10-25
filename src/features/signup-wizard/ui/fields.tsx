"use client";

import { Field } from "@/src/features/auth";
import { inputClass } from "@/src/features/auth";

export function TextField({
  id, label, value, onChange, onBlur, error, hint, checking, required, disabled,
  type = "text", placeholder, autoComplete, inputMode, maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  checking?: boolean;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
}) {
  return (
    <Field id={id} label={label} required={required} error={error} hint={checking ? "Checking availability…" : hint}>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-required={required || undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={inputClass(!!error)}
      />
    </Field>
  );
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="note" className="border-4 border-black bg-[#2c8f8f]/25 px-4 py-3 text-base leading-relaxed text-black">
      {children}
    </div>
  );
}
