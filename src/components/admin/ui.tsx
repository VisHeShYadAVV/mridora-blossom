import { createContext, useContext, type ReactNode } from "react";

import type { Action, Area } from "@/lib/permissions";
import type { StaffRole } from "@/lib/types";

export const btn =
  "inline-flex items-center justify-center gap-2 bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-navy-deep disabled:opacity-50";
export const btnOutline =
  "inline-flex items-center justify-center gap-2 border border-input bg-card px-4 py-2 text-sm hover:border-primary disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive hover:text-white disabled:opacity-50";
export const input =
  "mt-1 w-full border border-input bg-card px-3 py-2 text-sm outline-none focus:border-gold disabled:bg-muted";

export function Field({
  label,
  value,
  onChange,
  hint,
  type = "text",
  disabled,
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
  disabled?: boolean;
  list?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        type={type}
        {...(list ? { list } : {})}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={input}
      />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Area({
  label,
  value,
  onChange,
  rows = 3,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <textarea
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={input}
      />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Check({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function Message({ kind, children }: { kind: "error" | "ok"; children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`whitespace-pre-line border p-3 text-sm ${kind === "error" ? "border-destructive text-destructive" : "border-gold bg-accent"}`}
    >
      {children}
    </p>
  );
}

export function Title({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl text-primary">{children}</h1>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const errorText = (e: unknown) =>
  e && typeof e === "object" && "message" in e
    ? String((e as { message: unknown }).message)
    : "Something went wrong.";

export interface AdminContext {
  email: string;
  userId: string;
  role: StaffRole;
  can: (area: Area, action: Action) => boolean;
}
export const AdminCtx = createContext<AdminContext | null>(null);
export function useAdmin() {
  const value = useContext(AdminCtx);
  if (!value) throw new Error("useAdmin must be used inside the admin layout");
  return value;
}
