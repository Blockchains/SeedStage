import { cn } from "@/lib/utils";

export function Mark({ className, live = false }: { className?: string; live?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("mark", live && "mark-live", className)} aria-hidden>
      <g className="orbit orbit-a">
        <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="34 130" strokeLinecap="round" />
        <circle cx="32" cy="6" r="2.1" fill="currentColor" />
      </g>
      <g className="orbit orbit-b">
        <circle cx="32" cy="32" r="17.5" fill="none" stroke="var(--color-primary)" strokeWidth="1.4" strokeDasharray="16 94" strokeLinecap="round" />
      </g>
      <circle className="core" cx="32" cy="32" r="3" />
    </svg>
  );
}
