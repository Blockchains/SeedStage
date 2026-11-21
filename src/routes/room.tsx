import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useState } from "react";
import { AskBox } from "@/components/seedstage/ask-box";
import { DocumentRoom } from "@/components/seedstage/document-room";
import { STARTUP_FOLDERS, investorDocuments, investorFolders, startupDocuments } from "@/lib/seedstage/public-docs";
import { publicStartups } from "@/lib/seedstage/startups";
import { canView, documentObject, type Tuple } from "@/lib/seedstage/authz";
import { FirmLogo, GhostButton, Notice } from "@/components/seedstage/bits";
import { Frame } from "@/components/seedstage/shell";
import { can } from "@/lib/seedstage/permissions";
import { ROOM_CATEGORIES, categoryReadiness, investorRoom, roomFile, type RoomCategory } from "@/lib/seedstage/room";
import { useSeedstage } from "@/lib/seedstage/store";

export const Route = createFileRoute("/room")({ component: RoomPage });

function RoomPage() {
  const workspace = useSeedstage((state) => state.workspace);
  const setRoomShare = useSeedstage((state) => state.setRoomShare);
  const setRoomCategory = useSeedstage((state) => state.setRoomCategory);
  const toggleRoomGrant = useSeedstage((state) => state.toggleRoomGrant);
  const audience = workspace.opportunities.map((item) => item.investorId);
  const firms = workspace.investors.filter((investor) => audience.includes(investor.id));
  const [investorId, setInvestorId] = useState(firms[0]?.id ?? "");
  const [asInvestor, setAsInvestor] = useState(false);
  const [category, setCategory] = useState<RoomCategory | "all">("all");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [documentId, setDocumentId] = useState(workspace.documents[0]?.id ?? "");
  const richest = publicStartups.reduce((best, company) => ((company.files?.length ?? 0) > (best.files?.length ?? 0) ? company : best), publicStartups[0]);
  const [libraryId, setLibraryId] = useState(richest ? `c:${richest.id}` : "");
  const library = publicStartups.find((company) => libraryId === `c:${company.id}`) ?? null;
  const libraryFirm = workspace.investors.find((item) => libraryId === `i:${item.id}`) ?? null;
  const backer = library ? workspace.investors.find((item) => item.firm.toLowerCase() === library.funder.trim().toLowerCase()) ?? null : null;
  const readiness = categoryReadiness(workspace);
  const room = investorRoom(workspace, investorId);
  const investor = firms.find((item) => item.id === investorId) ?? null;
  const canFile = can(workspace.role, "edit_diligence");
  const canGrant = can(workspace.role, "approve");
  const visibleDocs = workspace.documents.filter((document) => category === "all" || roomFile(workspace.roomFiles, document.id).category === category);
  const selected = visibleDocs.find((document) => document.id === documentId) ?? visibleDocs[0] ?? null;
  const selectedFile = selected ? roomFile(workspace.roomFiles, selected.id) : null;
  const granted = selected ? workspace.roomGrants.some((grant) => grant.investorId === investorId && grant.documentIds.includes(selected.id)) : false;
  const tuples: Tuple[] = workspace.roomGrants.flatMap((grant) =>
    grant.documentIds
      .filter((documentId) => roomFile(workspace.roomFiles, documentId).share === "approved")
      .map((documentId) => ({ user: `user:${grant.investorId}`, relation: "viewer" as const, object: documentObject(documentId) })),
  );
  const passages = workspace.documents.map((document) => ({
    id: document.id,
    title: document.name,
    text: document.text,
    entitled: asInvestor ? canView(tuples, investorId, documentObject(document.id)) : true,
  }));
  const company = workspace.company.tradingName.value ?? "Company";

  return (
    <Frame title="Data room">
      <label className="mb-4 flex min-w-0 flex-col gap-1 text-sm md:max-w-sm">
        <span className="text-muted">{publicStartups.length} companies · {workspace.investors.length} firms</span>
        <select className="min-h-11 rounded-md border border-border bg-surface px-3" value={libraryId} onChange={(event) => setLibraryId(event.target.value)} aria-label="Company or firm">
          <option value="">Workspace</option>
          <optgroup label="Companies">
            {publicStartups.map((company) => (
              <option key={`c:${company.id}`} value={`c:${company.id}`}>{company.name}</option>
            ))}
          </optgroup>
          <optgroup label="Firms">
            {workspace.investors.map((item) => (
              <option key={`i:${item.id}`} value={`i:${item.id}`}>{item.firm}</option>
            ))}
          </optgroup>
        </select>
      </label>
      {library ? (
        <div className="flex flex-col gap-4">
          <DocumentRoom documents={startupDocuments(library)} folders={STARTUP_FOLDERS} />
          {backer ? (
            <section>
              <h2 className="mb-3 text-xl font-semibold tracking-display">{backer.firm}</h2>
              <DocumentRoom documents={investorDocuments(backer)} folders={investorFolders(backer)} />
            </section>
          ) : null}
        </div>
      ) : libraryFirm ? (
        <DocumentRoom documents={investorDocuments(libraryFirm)} folders={investorFolders(libraryFirm)} />
      ) : (
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-kicker text-muted uppercase">Data room</p>
            <p className="truncate text-xl font-semibold tracking-display">{company}</p>
          </div>
          <label className="flex min-w-0 items-center gap-2 text-sm md:w-72">
            {investor ? <FirmLogo src={investor.logo} name={investor.firm} /> : null}
            <select className="min-h-11 w-full rounded-md border border-border bg-bg px-3" value={investorId} onChange={(event) => setInvestorId(event.target.value)} aria-label="Investor">
              {firms.length === 0 ? <option value="">No firm in the pipeline</option> : null}
              {firms.map((item) => <option key={item.id} value={item.id}>{item.firm}</option>)}
            </select>
          </label>
          <GhostButton onClick={() => setAsInvestor((value) => !value)}>{asInvestor ? "Internal index" : "Investor view"}</GhostButton>
        </div>

        {asInvestor ? (
          <InvestorPreview investorName={investor?.firm ?? "This investor"} documents={room.documents} claims={room.claims} questions={room.questions} />
        ) : (
          <div className="grid min-w-0 lg:min-h-[36rem] lg:grid-cols-[240px_minmax(0,1fr)]">
            <nav className="min-w-0 border-b border-border bg-surface-2 lg:border-r lg:border-b-0" aria-label="Categories">
              <div className="flex items-center justify-between gap-2 px-3 lg:hidden">
                <span className="truncate text-sm font-medium">{category === "all" ? "All" : category.replace(/^\d+\s/, "")}</span>
                <button type="button" className="hit inline-flex min-h-11 items-center text-sm font-medium text-primary" aria-expanded={categoriesOpen} onClick={() => setCategoriesOpen((open) => !open)}>
                  {categoriesOpen ? "Close" : "Expand"}
                </button>
              </div>
              <ul className={`${categoriesOpen ? "flex" : "hidden"} flex-col gap-1 p-2 lg:flex`}>
                <li>
                  <IndexButton active={category === "all"} label="All files" meta={String(workspace.documents.length)} onClick={() => { setCategory("all"); setCategoriesOpen(false); }} />
                </li>
                {readiness.map((item) => (
                  <li key={item.category}>
                    <IndexButton
                      active={category === item.category}
                      label={item.category.replace(/^\d+\s/, "")}
                      meta={item.status === "missing" ? "—" : item.status.replaceAll("_", " ")}
                      onClick={() => { setCategory(item.category); setCategoriesOpen(false); }}
                    />
                  </li>
                ))}
              </ul>
            </nav>
            <div className="grid min-w-0 md:grid-cols-[220px_minmax(0,1fr)]">
              <ul className="border-b border-border md:border-r md:border-b-0">
                {visibleDocs.map((document) => {
                  const file = roomFile(workspace.roomFiles, document.id);
                  const active = document.id === selected?.id;
                  return (
                    <li key={document.id}>
                      <button type="button" className={`hit flex min-h-14 w-full items-center gap-2 px-3 text-left text-sm ${active ? "bg-canvas text-canvas-fg" : ""}`} onClick={() => setDocumentId(document.id)}>
                        <FileText className="size-4 shrink-0" aria-hidden />
                        <span className="min-w-0">
                          <span className="block truncate">{document.name}</span>
                          <span className={`block text-xs ${active ? "text-canvas-muted" : "text-muted"}`}>{file.share}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
                {visibleDocs.length === 0 ? <li className="px-3 py-6 text-sm text-muted">No file in this section.</li> : null}
              </ul>
              <article className="min-w-0 px-4 py-5 md:px-6">
                <div className="mb-4">
                  <AskBox passages={passages} />
                </div>
                {selected && selectedFile ? (
                  <>
                    <h2 className="text-lg font-semibold tracking-display">{selected.name}</h2>
                    <p className="mt-1 text-xs text-muted">{selectedFile.category}</p>
                    <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted">{selected.text.slice(0, 2000)}</pre>
                    <label className="mt-4 flex flex-col gap-1 text-sm">
                      <span className="text-muted">Category</span>
                      <select className="min-h-11 rounded-md border border-border bg-bg px-3" disabled={!canFile} value={selectedFile.category} onChange={(event) => setRoomCategory(selected.id, event.target.value as RoomCategory)}>
                        {ROOM_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <GhostButton disabled={!canFile} onClick={() => setRoomShare(selected.id, "held")}>Hold</GhostButton>
                      <GhostButton disabled={!canFile} onClick={() => setRoomShare(selected.id, "approved")}>Approve</GhostButton>
                      <GhostButton disabled={!canFile} onClick={() => setRoomShare(selected.id, "restricted")}>Restrict</GhostButton>
                      <GhostButton disabled={!canGrant || selectedFile.share !== "approved" || !investorId} onClick={() => toggleRoomGrant(investorId, selected.id)}>
                        {granted ? "Remove grant" : "Grant"}
                      </GhostButton>
                    </div>
                  </>
                ) : (
                  <Notice>No documents. Add one under Evidence.</Notice>
                )}
              </article>
            </div>
          </div>
        )}
      </div>
      )}
    </Frame>
  );
}

function IndexButton({ active, label, meta, onClick }: { active: boolean; label: string; meta: string; onClick: () => void }) {
  return (
    <button type="button" className={`hit flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm ${active ? "bg-canvas text-canvas-fg" : ""}`} onClick={onClick}>
      <span className="truncate">{label}</span>
      <span className={`ml-auto shrink-0 text-xs ${active ? "text-canvas-muted" : "text-muted"}`}>{meta}</span>
    </button>
  );
}

function InvestorPreview({ investorName, documents, claims, questions }: { investorName: string; documents: { id: string; name: string; text: string }[]; claims: { id: string; text: string; evidenceQuote: string }[]; questions: { id: string; text: string }[] }) {
  const [documentId, setDocumentId] = useState(documents[0]?.id ?? "");
  const selected = documents.find((document) => document.id === documentId) ?? documents[0] ?? null;
  return (
    <div className="grid min-w-0 lg:min-h-[32rem] lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav className="min-w-0 border-b border-border bg-surface-2 lg:border-r lg:border-b-0" aria-label={`${investorName} room`}>
        <p className="px-3 pt-3 text-xs font-medium tracking-kicker text-muted uppercase">{investorName}</p>
        <ul className="p-2">
          {documents.map((document) => (
            <li key={document.id}>
              <button type="button" className={`hit flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm ${document.id === selected?.id ? "bg-canvas text-canvas-fg" : ""}`} onClick={() => setDocumentId(document.id)}>
                <FileText className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{document.name}</span>
              </button>
            </li>
          ))}
          {documents.length === 0 ? <li className="px-3 py-4 text-sm text-muted">No granted file.</li> : null}
        </ul>
      </nav>
      <div className="grid min-w-0 gap-0 md:grid-cols-[minmax(0,1fr)_240px]">
        <article className="min-w-0 px-4 py-5 md:px-6">
          {selected ? (
            <>
              <h2 className="text-lg font-semibold tracking-display">{selected.name}</h2>
              <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed">{selected.text.slice(0, 2000)}</pre>
            </>
          ) : (
            <p className="text-sm text-muted">Nothing has been granted to {investorName}.</p>
          )}
          {claims.length > 0 ? (
            <ul className="mt-6 flex flex-col gap-3 border-t border-border pt-4">
              {claims.map((claim) => (
                <li key={claim.id} className="text-sm">
                  <p>{claim.text}</p>
                  <p className="mt-1 text-muted">“{claim.evidenceQuote}”</p>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
        <aside className="border-t border-border bg-surface-2 px-4 py-5 md:border-t-0 md:border-l">
          <p className="text-xs font-medium tracking-kicker text-muted uppercase">Open</p>
          <ul className="mt-3 flex flex-col gap-3">
            {questions.slice(0, 12).map((item) => (
              <li key={item.id} className="text-sm text-muted">{item.text}</li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
