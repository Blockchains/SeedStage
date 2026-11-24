import { Link, createFileRoute } from "@tanstack/react-router";
import { EntityTable } from "@/components/seedstage/entity-table";
import { FactGrid, MorePanel } from "@/components/seedstage/fact-sheet";
import { RelationshipGraph } from "@/components/seedstage/relationship-graph";
import { FirmLogo } from "@/components/seedstage/bits";
import { Mark } from "@/components/seedstage/mark";
import { companyEntities } from "@/lib/seedstage/entities";
import { DocumentRoom } from "@/components/seedstage/document-room";
import { useEffect, useState } from "react";
import { STARTUP_FOLDERS, startupDocuments, type HeldDocument } from "@/lib/seedstage/public-docs";
import { readRoomExtra } from "@/lib/seedstage/room-extra";
import { publicStartups } from "@/lib/seedstage/startups";
import { readSecStartup } from "@/lib/seedstage/sec-directory";
import { startupFacts } from "@/lib/seedstage/record-facts";
import { useSeedstage } from "@/lib/seedstage/store";

import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/startups/$id")({
  loader: async ({ params }) => (params.id.startsWith("sec-") ? readSecStartup({ data: { id: params.id } }) : null),
  component: StartupRoomPage,
  head: ({ params, loaderData }) => {
    const company = publicStartups.find((item) => item.id === params.id) ?? loaderData;
    const name = company?.name ?? "Startup";
    const description = (company?.summary ?? `Public record for ${name}.`).replace(/\s+/g, " ").trim();
    return pageHead(`/startups/${params.id}`, `${name} — SeedStage`, description.slice(0, 180));
  },
});

function StartupRoomPage() {
  const { id } = Route.useParams();
  const filed = Route.useLoaderData();
  const investors = useSeedstage((state) => state.workspace.investors);
  const company = publicStartups.find((item) => item.id === id) ?? filed;
  const [extraDocs, setExtraDocs] = useState<HeldDocument[]>([]);
  useEffect(() => {
    if (!company) return;
    let current = true;
    readRoomExtra({ data: { id: company.id, kind: "startup" } })
      .then((files) => {
        if (!current) return;
        setExtraDocs(
          files.map((file, index) => ({
            id: `extra-${index}`,
            title: file.title,
            category: file.title === "Index facts" ? "03 Ownership and financing" : "01 Company overview",
            text: file.text,
          })),
        );
      })
      .catch(() => {
        if (current) setExtraDocs([]);
      });
    return () => {
      current = false;
    };
  }, [company?.id]);
  if (!company) {
    return (
      <div className="min-h-screen bg-bg px-5 py-10 text-fg">
        <Link to="/startups" className="hit inline-flex min-h-11 items-center text-sm font-medium text-primary">Startups</Link>
        <p className="mt-6 text-sm text-muted">No company with that id.</p>
      </div>
    );
  }
  const roomDocs = startupDocuments(company);

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
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="hit inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-fg" href={company.website} target="_blank" rel="noreferrer">{company.website.includes("sec.gov") ? "Filing" : "Website"}</a>
            <a className="hit inline-flex min-h-11 items-center rounded-full border border-canvas-line px-4 text-sm" href={company.sourceUrl} target="_blank" rel="noreferrer">Source</a>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full min-w-0 max-w-5xl px-5 pb-16">
        <div className="-mt-8">
          <FactGrid facts={startupFacts(company)} />
          <MorePanel count={roomDocs.length + extraDocs.length}>
            <DocumentRoom documents={[...roomDocs, ...extraDocs]} folders={STARTUP_FOLDERS} />
            <div className="mt-4 flex flex-col gap-3">
              <EntityTable rows={companyEntities(company, investors)} />
              <RelationshipGraph rows={companyEntities(company, investors)} />
            </div>
          </MorePanel>
        </div>
      </main>
    </div>
  );
}
