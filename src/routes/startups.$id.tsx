import { Link, createFileRoute } from "@tanstack/react-router";
import { EntityTable } from "@/components/seedstage/entity-table";
import { RelationshipGraph } from "@/components/seedstage/relationship-graph";
import { FirmLogo } from "@/components/seedstage/bits";
import { Mark } from "@/components/seedstage/mark";
import { companyEntities } from "@/lib/seedstage/entities";
import { DocumentRoom } from "@/components/seedstage/document-room";
import { STARTUP_FOLDERS, startupDocuments } from "@/lib/seedstage/public-docs";
import { publicStartups } from "@/lib/seedstage/startups";
import { useSeedstage } from "@/lib/seedstage/store";
import type { Investor } from "@/lib/seedstage/types";

export const Route = createFileRoute("/startups/$id")({ component: StartupRoomPage });

function findBacker(funder: string, investors: Investor[]): Investor | null {
  const needle = funder.trim().toLowerCase();
  if (!needle) return null;
  const exact = investors.find((investor) => investor.firm.toLowerCase() === needle);
  if (exact) return exact;
  return (
    investors.find((investor) => {
      const firm = investor.firm.toLowerCase();
      if (firm.length < 4 || needle.length < 4) return false;
      return needle.includes(firm) || firm.includes(needle);
    }) ?? null
  );
}

function StartupRoomPage() {
  const { id } = Route.useParams();
  const investors = useSeedstage((state) => state.workspace.investors);
  const company = publicStartups.find((item) => item.id === id);
  if (!company) {
    return (
      <div className="min-h-screen bg-bg px-5 py-10 text-fg">
        <Link to="/startups" className="hit inline-flex min-h-11 items-center text-sm font-medium text-primary">Startups</Link>
        <p className="mt-6 text-sm text-muted">No company with that id.</p>
      </div>
    );
  }
  const roomDocs = startupDocuments(company);
  const backer = findBacker(company.funder, investors);

  return (
    <div className="min-h-screen overflow-x-clip bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-canvas-line bg-canvas text-canvas-fg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link to="/startups" className="hit inline-flex min-h-11 items-center text-sm">Startups</Link>
          <Link to="/" className="hit flex items-center gap-2 text-sm font-semibold tracking-display">
            <Mark className="size-7" />
            SeedStage
          </Link>
        </div>
      </header>

      <section className="bg-canvas text-canvas-fg">
        <div className="mx-auto max-w-5xl px-5 pt-8 pb-16">
          <FirmLogo src={company.logo} name={company.name} className="size-20 rounded-2xl bg-white" />
          <h1 className="mt-6 text-4xl font-semibold tracking-display text-balance break-words md:text-6xl">{company.name}</h1>
          {company.summary ? <p className="mt-4 max-w-xl text-base leading-relaxed text-canvas-muted md:text-lg">{company.summary.split(/(?<=[.!?])\s+/)[0]}</p> : null}
          <div className="mt-6 flex flex-wrap gap-2">
            {[company.stage, company.round, company.funder].filter(Boolean).map((item) => (
              <span key={item} className="rounded-full border border-canvas-line px-3 py-1 text-sm">{item}</span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="hit inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-fg" href={company.website} target="_blank" rel="noreferrer">Website</a>
            <a className="hit inline-flex min-h-11 items-center rounded-full border border-canvas-line px-4 text-sm" href={company.sourceUrl} target="_blank" rel="noreferrer">Source</a>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full min-w-0 max-w-5xl px-5 pb-16">
        <div className="-mt-8">
          <DocumentRoom documents={roomDocs} folders={STARTUP_FOLDERS} />
          <div className="mt-4 flex flex-col gap-3">
            <EntityTable rows={companyEntities(company, investors)} />
            <RelationshipGraph rows={companyEntities(company, investors)} />
          </div>
          {company.person || company.funder ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {company.person ? (
                  <article className="rounded-xl border border-border bg-surface p-5">
                    <p className="text-xs font-medium tracking-kicker text-muted uppercase">Person</p>
                    <p className="mt-3 text-xl font-semibold tracking-display">{company.person}</p>
                  </article>
                ) : null}
                {company.funder ? (
                  <article className="rounded-xl border border-border bg-surface p-5">
                    <p className="text-xs font-medium tracking-kicker text-muted uppercase">Backer</p>
                    <div className="mt-3 flex items-center gap-3">
                      {backer ? <FirmLogo src={backer.logo} name={backer.firm} className="size-11" /> : null}
                      <div>
                        <p className="text-xl font-semibold tracking-display">{backer?.firm ?? company.funder}</p>
                        {backer?.geos[0] ? <p className="text-xs text-muted">{backer.geos.slice(0, 2).join(" · ")}</p> : null}
                      </div>
                    </div>
                    {backer?.excerpt ? <p className="mt-3 text-sm leading-relaxed text-muted">{backer.excerpt}</p> : null}
                    {backer ? <a className="hit mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary" href={backer.sourceUrl} target="_blank" rel="noreferrer">Firm site</a> : null}
                  </article>
                ) : null}
              </div>
            ) : null}
        </div>
      </main>
    </div>
  );
}
