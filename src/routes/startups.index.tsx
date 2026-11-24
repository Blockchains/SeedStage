import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FirmLogo } from "@/components/seedstage/bits";
import { FactList, MoreDisclosure } from "@/components/seedstage/fact-sheet";
import { Frame } from "@/components/seedstage/shell";
import { searchSecStartups } from "@/lib/seedstage/sec-directory";
import { SEC_CANDIDATE_COUNT, SEC_FUND_ISSUER_COUNT, SEC_OTHER_COUNT, SEC_STARTUP_COUNT, SEC_THIN_COUNT } from "@/lib/seedstage/sec-counts";
import { publicStartups } from "@/lib/seedstage/startups";
import { startupFacts } from "@/lib/seedstage/record-facts";

import { pageHead } from "@/lib/seedstage/seo";

export const Route = createFileRoute("/startups/")({
  component: StartupsPage,
  head: () => pageHead("/startups", "Startups — SeedStage", "Named companies, plus Form D issuers screened as early-stage candidates. A filing is not a seed round."),
});

type SecView = "candidates" | "issuers" | "other" | "funds" | "thin";

type SecRow = {
  id: string;
  name: string;
  stage: string;
  summary: string;
  industry: string | null;
  offering: string | null;
  sold: string | null;
  person: string | null;
  phone: string | null;
  sourceUrl: string;
};

const VIEWS: { id: SecView; label: string; fallback: number }[] = [
  { id: "candidates", label: "Candidates", fallback: SEC_CANDIDATE_COUNT },
  { id: "issuers", label: "All issuers", fallback: SEC_STARTUP_COUNT },
  { id: "other", label: "Other", fallback: SEC_OTHER_COUNT },
  { id: "funds", label: "Funds", fallback: SEC_FUND_ISSUER_COUNT },
  { id: "thin", label: "Thin", fallback: SEC_THIN_COUNT },
];

function StartupsPage() {
  const [tab, setTab] = useState<"named" | "filing">("named");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(40);
  const [secView, setSecView] = useState<SecView>("candidates");
  const [secQuery, setSecQuery] = useState("");
  const [secRows, setSecRows] = useState<SecRow[]>([]);
  const [secTotal, setSecTotal] = useState(SEC_CANDIDATE_COUNT);
  const [secCounts, setSecCounts] = useState<Record<SecView, number> | null>(null);
  const [secOffset, setSecOffset] = useState(0);
  const [secState, setSecState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const needle = query.trim().toLowerCase();
  const rows = publicStartups.filter((company) => !needle || `${company.name} ${company.summary} ${company.stage} ${company.funder}`.toLowerCase().includes(needle));
  const visible = rows.slice(0, shown);

  useEffect(() => {
    if (tab !== "filing") return;
    const handle = window.setTimeout(() => {
      setSecState("loading");
      searchSecStartups({ data: { q: secQuery, offset: 0, view: secView } })
        .then((result) => {
          setSecRows(result.rows);
          setSecTotal(result.total);
          setSecCounts(result.counts);
          setSecOffset(result.rows.length);
          setSecState("ready");
        })
        .catch(() => setSecState("error"));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [tab, secQuery, secView]);

  function moreFilings() {
    setSecState("loading");
    searchSecStartups({ data: { q: secQuery, offset: secOffset, view: secView } })
      .then((result) => {
        setSecRows((current) => [...current, ...result.rows]);
        setSecTotal(result.total);
        setSecOffset((current) => current + result.rows.length);
        setSecState("ready");
      })
      .catch(() => setSecState("error"));
  }

  return (
    <Frame title="Startups">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <button type="button" className={`hit inline-flex min-h-11 items-center rounded-full border px-3 text-sm ${tab === "named" ? "border-primary text-primary" : "border-border"}`} onClick={() => setTab("named")}>
            Named {publicStartups.length.toLocaleString("en-GB")}
          </button>
          <button type="button" className={`hit inline-flex min-h-11 items-center rounded-full border px-3 text-sm ${tab === "filing" ? "border-primary text-primary" : "border-border"}`} onClick={() => setTab("filing")}>
            Form D filings
          </button>
        </div>
        {tab === "named" ? (
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShown(40);
            }}
            placeholder="Search companies"
            aria-label="Search companies"
            className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm md:max-w-xs"
          />
        ) : (
          <>
            <input
              value={secQuery}
              onChange={(event) => setSecQuery(event.target.value)}
              placeholder="Search Form D issuers"
              aria-label="Search Form D issuers"
              className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm md:max-w-xs"
            />
            <p className="text-sm text-muted">A Form D notice is not a seed round. Offering amount and amount sold are shown separately. Amendments are not added up. Related persons are not investors.</p>
            <div className="flex gap-2 overflow-x-auto">
              {VIEWS.map((item) => (
                <button key={item.id} type="button" className={`hit inline-flex min-h-11 shrink-0 items-center rounded-full border px-3 text-sm ${secView === item.id ? "border-primary text-primary" : "border-border"}`} onClick={() => setSecView(item.id)}>
                  {item.label} {(secCounts?.[item.id] ?? item.fallback).toLocaleString("en-GB")}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {tab === "named" ? (
        <>
          <ul className="flex flex-col gap-3">
            {visible.map((company) => (
              <li key={company.id} className="rounded-md border border-border bg-surface p-4">
                <Link to="/startups/$id" params={{ id: company.id }} className="hit flex items-center gap-3">
                  <FirmLogo src={company.logo} name={company.name} />
                  <span className="min-w-0 text-base font-medium">{company.name}</span>
                </Link>
                <FactList facts={startupFacts(company, "card")} />
                {company.summary.trim() ? (
                  <MoreDisclosure>
                    <p className="text-sm leading-relaxed text-muted">{company.summary}</p>
                  </MoreDisclosure>
                ) : null}
              </li>
            ))}
          </ul>
          {shown < rows.length ? (
            <button type="button" className="hit mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary" onClick={() => setShown((count) => count + 40)}>
              Show more ({(rows.length - shown).toLocaleString("en-GB")})
            </button>
          ) : null}
        </>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {secRows.map((company) => {
              const facts = [
                company.stage ? { label: "Stage", value: company.stage } : null,
                company.industry ? { label: "Industry", value: company.industry } : null,
                company.offering ? { label: "Offering amount", value: company.offering } : null,
                company.sold ? { label: "Amount sold", value: company.sold } : null,
                company.person ? { label: "Person", value: company.person } : null,
                company.phone ? { label: "Phone", value: company.phone } : null,
              ].filter((fact): fact is { label: string; value: string } => fact !== null);
              return (
                <li key={company.id} className="rounded-md border border-border bg-surface p-4">
                  <Link to="/startups/$id" params={{ id: company.id }} className="hit text-base font-medium">{company.name}</Link>
                  <FactList facts={facts} />
                  {company.summary.trim() ? (
                    <MoreDisclosure>
                      <p className="text-sm leading-relaxed text-muted">{company.summary}</p>
                    </MoreDisclosure>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {secState === "loading" ? <p className="mt-4 text-sm text-muted">Loading filings.</p> : null}
          {secState === "error" ? <p className="mt-4 text-sm text-muted">The filing list did not load.</p> : null}
          {secState === "ready" && secRows.length === 0 ? <p className="mt-4 text-sm text-muted">No filing matches that search.</p> : null}
          {secOffset < secTotal ? (
            <button type="button" className="hit mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary" onClick={moreFilings}>
              Show more ({(secTotal - secOffset).toLocaleString("en-GB")})
            </button>
          ) : null}
        </>
      )}
    </Frame>
  );
}
