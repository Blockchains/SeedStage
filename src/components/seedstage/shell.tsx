import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  ClipboardCheck,
  FileText,
  Files,
  ListChecks,
  Menu,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  FolderLock,
  Layers,
  Waypoints,
  House,
  Rocket,
  ChartColumn,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ROLE_LABEL } from "@/lib/seedstage/permissions";
import { Mark } from "@/components/seedstage/mark";
import { useSeedstage } from "@/lib/seedstage/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: House },
  { to: "/company", label: "Company", icon: Building2 },
  { to: "/evidence", label: "Evidence", icon: Files },
  { to: "/plan", label: "Funding plan", icon: WalletCards },
  { to: "/round", label: "Round", icon: Scale },
  { to: "/metrics", label: "Metrics", icon: ChartColumn },
  { to: "/investors", label: "Investors", icon: Search },
  { to: "/startups", label: "Startups", icon: Rocket },
  { to: "/pipeline", label: "Pipeline", icon: ClipboardCheck },
  { to: "/materials", label: "Materials", icon: FileText },
  { to: "/diligence", label: "Diligence", icon: ListChecks },
  { to: "/room", label: "Data room", icon: FolderLock },
  { to: "/graph", label: "Graph", icon: Waypoints },
  { to: "/stack", label: "Stack", icon: Layers },
  { to: "/approvals", label: "Approvals", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Frame({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  const workspace = useSeedstage((state) => state.workspace);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    void useSeedstage.persist.rehydrate();
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen overflow-x-clip bg-bg text-fg">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
          <Brand />
          <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
            {NAV.map((item) => (
              <NavLink key={item.to} {...item} active={pathname === item.to} />
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 md:px-8">
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-md border border-border md:hidden"
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
              <div className="min-w-0 md:hidden">
                <Brand compact />
              </div>
              <p className="ml-auto truncate text-sm text-muted">{ROLE_LABEL[workspace.role]}</p>
            </div>
          </header>
          {open ? (
            <nav className="grid grid-cols-2 gap-2 border-b border-border bg-surface px-4 py-3 md:hidden">
              {NAV.map((item) => (
                <NavLink key={item.to} {...item} active={pathname === item.to} />
              ))}
            </nav>
          ) : null}
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-8">
            <header className="mb-6">
              <h1 className="display text-3xl tracking-tight md:text-4xl">{title}</h1>
              {lede ? <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">{lede}</p> : null}
            </header>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 px-4 py-4", compact && "px-0 py-0")}>
      <Mark className="size-7 shrink-0 text-fg" />
      <span className="display text-2xl leading-none tracking-tight">SeedStage</span>
    </Link>
  );
}

function NavLink({ to, label, icon: Icon, active }: { to: string; label: string; icon: typeof Files; active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-md px-3 text-sm",
        active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
