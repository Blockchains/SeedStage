import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DocumentRoom } from "@/components/seedstage/document-room";
import { investorDocuments, investorFolders, type HeldDocument } from "@/lib/seedstage/public-docs";
import { FirmLogo } from "@/components/seedstage/bits";
import { Mark } from "@/components/seedstage/mark";
import { linkedPortfolio } from "@/lib/seedstage/investor-room";
import { publicStartups } from "@/lib/seedstage/startups";
import { useSeedstage } from "@/lib/seedstage/store";

import { publicInvestors } from "@/lib/seedstage/public-investors";
import { readSecInvestor } from "@/lib/seedstage/sec-directory";
import { readRoomExtra } from "@/lib/seedstage/room-extra";
import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/investors/$id")({
  loader: async ({ params }) => (params.id.startsWith("sec-") ? readSecInvestor({ data: { id: params.id } }) : null),
  component: InvestorRoomPage,
  head: ({ params, loaderData }) => {
    const investor = publicInvestors.find((item) => item.id === params.id) ?? loaderData;
    const name = investor?.firm ?? "Investor";
    const description = (investor?.excerpt ?? `Public record for ${name}.`).replace(/\s+/g, " ").trim();
    return pageHead(`/investors/${params.id}`, `${name} — SeedStage`, description.slice(0, 180));
  },
});

function InvestorRoomPage() {
  const { id } = Route.useParams();
  const filed = Route.useLoaderData();
  const investors = useSeedstage((state) => state.workspace.investors);
  const investor = investors.find((item) => item.id === id) ?? publicInvestors.find((item) => item.id === id) ?? filed;
  const [extraDocs, setExtraDocs] = useState<HeldDocument[]>([]);
  useEffect(() => {
    if (!investor) return;
    let current = true;
    readRoomExtra({ data: { id: investor.id, kind: "investor" } })
      .then((files) => {
        if (!current) return;
        setExtraDocs(
          files.map((file, index) => ({
            id: `extra-${index}`,
            title: file.title,
            category: "Firm",
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
  }, [investor?.id]);
  if (!investor) {
    return (
      <div className="min-h-screen bg-bg px-5 py-10 text-fg">
        <Link to="/investors" className="hit inline-flex min-h-11 items-center text-sm font-medium text-primary">Investors</Link>
        <p className="mt-6 text-sm text-muted">No firm with that id.</p>
      </div>
    );
  }
  const documents = investorDocuments(investor);
  const companies = linkedPortfolio(investor, publicStartups);

  return (
    <div className="min-h-screen overflow-x-clip bg-bg text-fg">
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
          <h1 className="mt-6 text-4xl font-semibold tracking-display text-balance break-words md:text-6xl">{investor.firm}</h1>
          {investor.excerpt ? <p className="mt-4 max-w-xl text-base leading-relaxed text-canvas-muted md:text-lg">{investor.excerpt.split(/(?<=[.!?])\s+/)[0]}</p> : null}
          <div className="mt-6 flex flex-wrap gap-2">
            {[...investor.geos.slice(0, 3), ...investor.stages].filter(Boolean).map((item) => (
              <span key={item} className="rounded-full border border-canvas-line px-3 py-1 text-sm">{item}</span>
            ))}
          </div>
          <a className="hit mt-8 inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-fg" href={investor.sourceUrl} target="_blank" rel="noreferrer">{investor.sourceUrl.includes("sec.gov") ? "Filing" : "Firm site"}</a>
        </div>
      </section>

      <main className="mx-auto w-full min-w-0 max-w-5xl px-5 pb-16">
        <div className="-mt-8">
          <DocumentRoom documents={[...documents, ...extraDocs]} folders={investorFolders(investor)} />
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
        </div>
      </main>
    </div>
  );
}
