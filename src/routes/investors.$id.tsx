import { Link, createFileRoute } from "@tanstack/react-router";
import { AskBox } from "@/components/seedstage/ask-box";
import { FirmLogo } from "@/components/seedstage/bits";
import { Mark } from "@/components/seedstage/mark";
import { buildInvestorRoom, linkedPortfolio } from "@/lib/seedstage/investor-room";
import { publicStartups } from "@/lib/seedstage/startups";
import { useSeedstage } from "@/lib/seedstage/store";

export const Route = createFileRoute("/investors/$id")({ component: InvestorRoomPage });

function InvestorRoomPage() {
  const { id } = Route.useParams();
  const investors = useSeedstage((state) => state.workspace.investors);
  const investor = investors.find((item) => item.id === id);
  if (!investor) {
    return (
      <div className="min-h-screen bg-bg px-5 py-10 text-fg">
        <Link to="/investors" className="hit inline-flex min-h-11 items-center text-sm font-medium text-primary">Investors</Link>
        <p className="mt-6 text-sm text-muted">No firm with that id.</p>
      </div>
    );
  }
  const room = buildInvestorRoom(investor);
  const companies = linkedPortfolio(investor, publicStartups);
  const passages = [
    { id: "profile", title: "Firm", text: investor.excerpt, entitled: true },
    ...(investor.files ?? []).map((file, index) => ({ id: `file-${index}`, title: file.title, text: file.text, entitled: true })),
  ];
  const folders = [
    ...room.sections.map((section) => ({ id: section.id, label: section.label, onFile: true })),
    ...room.missing.map((label) => ({ id: label, label, onFile: false })),
  ];

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-canvas-line bg-canvas text-canvas-fg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link to="/investors" className="hit inline-flex min-h-11 items-center text-sm">Investors</Link>
          <Link to="/" className="hit flex items-center gap-2 text-sm font-semibold tracking-display">
            <Mark className="size-7" />
            SeedStage
          </Link>
        </div>
      </header>

      <section className="bg-canvas text-canvas-fg">
        <div className="mx-auto max-w-5xl px-5 pt-8 pb-16">
          <FirmLogo src={investor.logo} name={investor.firm} className="size-20 rounded-2xl bg-white" />
          <h1 className="mt-6 text-4xl font-semibold tracking-display text-balance md:text-6xl">{investor.firm}</h1>
          {investor.excerpt ? <p className="mt-4 max-w-xl text-base leading-relaxed text-canvas-muted md:text-lg">{investor.excerpt.split(/(?<=[.!?])\s+/)[0]}</p> : null}
          <div className="mt-6 flex flex-wrap gap-2">
            {[...investor.geos.slice(0, 3), ...investor.stages].filter(Boolean).map((item) => (
              <span key={item} className="rounded-full border border-canvas-line px-3 py-1 text-sm">{item}</span>
            ))}
          </div>
          <a className="hit mt-8 inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-fg" href={investor.sourceUrl} target="_blank" rel="noreferrer">Firm site</a>
        </div>
      </section>

      <main className="mx-auto grid max-w-5xl gap-4 px-5 pb-16 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="hidden lg:block" aria-label="Room index">
          <ul className="sticky top-20 -mt-8 flex flex-col gap-1">
            {folders.map((folder) => (
              <li key={folder.id}>
                <a href={`#${folder.id}`} className="hit flex min-h-11 items-center justify-between gap-2 rounded-md px-3 text-sm">
                  <span>{folder.label}</span>
                  <span className={folder.onFile ? "text-primary" : "text-muted"}>{folder.onFile ? "●" : "–"}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="-mt-8 min-w-0">
          <div className="mb-4">
            <AskBox passages={passages} />
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lift">
            {room.sections.map((section) => (
              <section key={section.id} id={section.id} className="border-t border-border px-5 py-5 first:border-t-0 md:px-8">
                <h2 className="text-xs font-medium tracking-kicker text-muted uppercase">{section.label}</h2>
                <dl className="mt-4 flex flex-col gap-4">
                  {section.lines.map((line) => (
                    <div key={line.label}>
                      <dt className="text-xs text-muted">{line.label}</dt>
                      <dd className="mt-1 text-base leading-relaxed break-words md:text-lg">{line.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
          {companies.length > 0 ? (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {companies.map((company) => (
                <li key={company.id}>
                  <Link to="/startups/$id" params={{ id: company.id }} className="hit flex min-h-14 items-center gap-2 rounded-xl border border-border bg-surface px-3">
                    <FirmLogo src={company.logo} name={company.name} />
                    <span className="truncate text-sm font-medium">{company.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <ul className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
            {room.missing.map((label) => (
              <li key={label} id={label} className="flex min-h-12 items-center justify-between border-t border-border px-5 text-sm text-muted first:border-t-0">
                <span>{label}</span>
                <span>Not on file</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
