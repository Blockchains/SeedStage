import { poundsToMinor } from "@/lib/seedstage/money";
import { can, type Action } from "@/lib/seedstage/permissions";
import { useSeedstage } from "@/lib/seedstage/store";
import { cn } from "@/lib/utils";

export function Panel({ title, children, aside }: { title?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4 md:p-5">
      {title ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="display text-xl">{title}</h2>
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs",
        tone === "neutral" && "border-border text-muted",
        tone === "ok" && "border-ok/40 text-ok",
        tone === "warn" && "border-primary/50 text-primary",
        tone === "bad" && "border-danger/50 text-danger",
      )}
    >
      {children}
    </span>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm leading-relaxed text-muted">{children}</p>;
}

const control = "min-h-11 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50";

export function TextField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <input className={control} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function AreaField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <textarea className={cn(control, "min-h-28 py-2")} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function MoneyField({ label, minor, onChange, disabled }: { label: string; minor: number; onChange: (minor: number) => void; disabled?: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <input
        className={cn(control, "num")}
        inputMode="decimal"
        disabled={disabled}
        value={Number.isFinite(minor) ? (minor / 100).toString() : ""}
        onChange={(event) => {
          const next = poundsToMinor(Number(event.target.value));
          if (next !== null && next >= 0) onChange(next);
        }}
      />
    </label>
  );
}

export function NumberField({ label, value, onChange, disabled }: { label: string; value: number; onChange: (value: number) => void; disabled?: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <input
        className={cn(control, "num")}
        inputMode="numeric"
        disabled={disabled}
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isSafeInteger(next)) onChange(next);
        }}
      />
    </label>
  );
}

export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={cn("min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-50", props.className)}>
      {children}
    </button>
  );
}

export function GhostButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={cn("min-h-11 rounded-md border border-border px-3 text-sm disabled:opacity-50", props.className)}>
      {children}
    </button>
  );
}

export function Gate({ action, children }: { action: Action; children: React.ReactNode }) {
  const role = useSeedstage((state) => state.workspace.role);
  if (can(role, action)) return children;
  return <Notice>The {role} role cannot change this. Switch role in Settings if you are exploring the demonstration.</Notice>;
}
