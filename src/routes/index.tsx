import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HomePreview, type PreviewTab } from "@/components/seedstage/home-preview";
import { FirmLogo } from "@/components/seedstage/bits";
import { Mark } from "@/components/seedstage/mark";
import { track } from "@/lib/seedstage/analytics";
import { publicStartups } from "@/lib/seedstage/startups";
import { useSeedstage } from "@/lib/seedstage/store";

export const Route = createFileRoute("/")({ component: HomePage });

const NAV = [
  { to: "/startups", label: "Startups" },
  { to: "/investors", label: "Investors" },
  { to: "/round", label: "Round" },
  { to: "/metrics", label: "Metrics" },
  { to: "/plan", label: "Plan" },
  { to: "/pipeline", label: "Pipeline" },
  { to: "/room", label: "Room" },
  { to: "/graph", label: "Graph" },
  { to: "/stack", label: "Stack" },
] as const;

function HomePage() {
  const investors = useSeedstage((state) => state.workspace.investors);
  const [tab, setTab] = useState<PreviewTab>("round");
  const [entered, setEntered] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    void useSeedstage.persist.rehydrate();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setEntered(true);
      return;
    }
    const timer = window.setTimeout(() => setEntered(true), 1700);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-canvas-line bg-canvas text-canvas-fg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link to="/" className="hit flex items-center gap-2 text-sm font-semibold tracking-display">
            <Mark className="size-8" live={live} />
            SeedStage
          </Link>
          <Link to="/company" className="hit inline-flex min-h-11 items-center text-sm font-medium text-canvas-fg" onClick={() => track("sample_opened")}>
            Workspace
          </Link>
        </div>
        <nav className="mx-auto flex min-w-0 max-w-5xl gap-1 overflow-x-auto px-3 pb-2" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="hit inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-medium text-canvas-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto min-w-0 max-w-5xl overflow-x-clip px-4 py-8">
        <p className="text-xs font-medium tracking-kicker text-muted uppercase">Seed funding</p>
        <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-display text-balance md:text-5xl">See your next funding move.</h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">Price the round in the workspace. Open the lists when you want the companies or the firms.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link to="/startups" className="hit flex min-h-24 flex-col justify-between rounded-md bg-primary px-4 py-4 text-primary-fg">
            <span className="text-lg font-semibold tracking-display">Startups</span>
            <span className="text-sm text-primary-fg/80">{publicStartups.length} companies</span>
          </Link>
          <Link to="/investors" className="hit flex min-h-24 flex-col justify-between rounded-md border border-border bg-surface px-4 py-4" onClick={() => track("sample_opened")}>
            <span className="text-lg font-semibold tracking-display">Investors</span>
            <span className="text-sm text-muted">{investors.length} firms</span>
          </Link>
        </div>

        <section className="mt-10 grid items-start gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-display">Raising</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">Ownership, cash and the shortlist live in one company record. The lists above are separate.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/round" className="hit inline-flex min-h-11 items-center rounded-full bg-canvas px-4 text-sm font-medium text-canvas-fg">Model a round</Link>
              <Link to="/plan" className="hit inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium">Funding plan</Link>
              <Link to="/pipeline" className="hit inline-flex min-h-11 items-center px-2 text-sm font-medium text-primary">Pipeline</Link>
            </div>
            <div className="mt-5" onFocus={() => setLive(true)} onBlur={() => setLive(false)}>
              <HomePreview tab={tab} onTab={setTab} onUseful={() => track("first_output")} onSave={() => track("save_intent")} onComplete={() => track("preview_completed")} />
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <LogoBlock title="Companies" href="/startups" count={publicStartups.length} rows={publicStartups.slice(0, 24).map((company) => ({ id: company.id, name: company.name, logo: company.logo, href: `/startups/${company.id}`, meta: company.stage, room: "startup" as const }))} />
            <LogoBlock title="Firms" href="/investors" count={investors.length} rows={investors.slice(0, 24).map((investor) => ({ id: investor.id, name: investor.firm, logo: investor.logo, href: `/investors/${investor.id}`, meta: investor.stages[0] ?? investor.geos[0] ?? "", room: "investor" as const }))} />
          </div>
        </section>
      </main>

      {entered ? null : (
        <div className="intro-screen intro-leave" role="presentation">
          <div className="intro-glow" />
          <Mark className="relative size-28" live />
          <p className="relative mt-6 text-3xl font-semibold tracking-display">SeedStage</p>
        </div>
      )}
    </div>
  );
}

function LogoBlock({ title, href, count, rows }: { title: string; href: "/startups" | "/investors"; count: number; rows: { id: string; name: string; logo: string; href: string; meta: string; room?: "startup" | "investor" }[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-display">{title}</h2>
        <Link to={href} className="hit inline-flex min-h-11 items-center text-sm font-medium text-primary">All {count}</Link>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <li key={row.id}>
            {row.room ? (
              <Link to={row.room === "startup" ? "/startups/$id" : "/investors/$id"} params={{ id: row.id }} className="hit flex min-h-14 items-center gap-2 rounded-md border border-border bg-surface px-2">
                <FirmLogo src={row.logo} name={row.name} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{row.name}</span>
                  {row.meta ? <span className="block truncate text-xs text-muted">{row.meta}</span> : null}
                </span>
              </Link>
            ) : (
              <a className="hit flex min-h-14 items-center gap-2 rounded-md border border-border bg-surface px-2" href={row.href} target="_blank" rel="noreferrer">
                <FirmLogo src={row.logo} name={row.name} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{row.name}</span>
                  {row.meta ? <span className="block truncate text-xs text-muted">{row.meta}</span> : null}
                </span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
