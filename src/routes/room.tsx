import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Frame } from "@/components/seedstage/shell";
import { FirmLogo, GhostButton, Notice, Panel, Pill } from "@/components/seedstage/bits";
import { can } from "@/lib/seedstage/permissions";
import { ROOM_CATEGORIES, categoryReadiness, investorRoom, roomFile } from "@/lib/seedstage/room";
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
  const readiness = categoryReadiness(workspace);
  const room = investorRoom(workspace, investorId);
  const investor = firms.find((item) => item.id === investorId) ?? null;
  const canFile = can(workspace.role, "edit_diligence");
  const canGrant = can(workspace.role, "approve");

  return (
    <Frame title="Data room" lede="Approved documents and accepted claims only. A disagreement stays out. A missing file stays missing.">
      <div className="flex flex-col gap-4">
        <Panel title="Audience">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              {investor ? <FirmLogo src={investor.logo} name={investor.firm} /> : null}
              <select className="min-h-11 w-full rounded-md border border-border bg-bg px-3" value={investorId} onChange={(event) => setInvestorId(event.target.value)}>
                {firms.length === 0 ? <option value="">No firm in the pipeline</option> : null}
                {firms.map((item) => <option key={item.id} value={item.id}>{item.firm}</option>)}
              </select>
            </label>
            <GhostButton onClick={() => setAsInvestor((value) => !value)}>{asInvestor ? "Back to internal" : "View as this investor"}</GhostButton>
          </div>
          <p className="mt-3 text-sm text-muted">This view is in this browser. It does not create a separate login.</p>
        </Panel>

        {asInvestor ? (
          <InvestorPreview investorName={investor?.firm ?? "This investor"} documents={room.documents} claims={room.claims} questions={room.questions} />
        ) : (
          <>
            <Panel title="Readiness">
              <ul className="flex flex-col gap-2">
                {readiness.map((item) => (
                  <li key={item.category} className="flex items-start justify-between gap-3 text-sm">
                    <span>
                      <span className="block font-medium">{item.category}</span>
                      <span className="text-muted">{item.detail}</span>
                    </span>
                    <Pill tone={item.status === "approved" ? "ok" : item.status === "missing" || item.status === "needs_review" ? "warn" : "neutral"}>{item.status.replaceAll("_", " ")}</Pill>
                  </li>
                ))}
              </ul>
            </Panel>
            <div className="flex flex-col gap-3">
              {workspace.documents.map((document) => {
                const file = roomFile(workspace.roomFiles, document.id);
                const granted = workspace.roomGrants.some((grant) => grant.investorId === investorId && grant.documentIds.includes(document.id));
                return (
                  <Panel key={document.id} title={document.name} aside={<Pill>{file.share}</Pill>}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="text-muted">Category</span>
                        <select className="min-h-11 rounded-md border border-border bg-bg px-3" disabled={!canFile} value={file.category} onChange={(event) => setRoomCategory(document.id, event.target.value as typeof file.category)}>
                          {ROOM_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                      </label>
                      <div className="flex flex-wrap items-end gap-2">
                        <GhostButton disabled={!canFile} onClick={() => setRoomShare(document.id, "held")}>Hold</GhostButton>
                        <GhostButton disabled={!canFile} onClick={() => setRoomShare(document.id, "approved")}>Approve</GhostButton>
                        <GhostButton disabled={!canFile} onClick={() => setRoomShare(document.id, "restricted")}>Restrict</GhostButton>
                        <GhostButton disabled={!canGrant || file.share !== "approved" || !investorId} onClick={() => toggleRoomGrant(investorId, document.id)}>
                          {granted ? "Remove grant" : "Grant to this investor"}
                        </GhostButton>
                      </div>
                    </div>
                  </Panel>
                );
              })}
              {workspace.documents.length === 0 ? <Notice>No documents. Add one under Evidence.</Notice> : null}
            </div>
          </>
        )}
      </div>
    </Frame>
  );
}

function InvestorPreview({ investorName, documents, claims, questions }: { investorName: string; documents: { id: string; name: string; text: string }[]; claims: { id: string; text: string; evidenceQuote: string }[]; questions: { id: string; text: string }[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Panel title={`Room for ${investorName}`}>
        {documents.length === 0 ? <p className="text-sm text-muted">No approved document has been granted.</p> : null}
        <ul className="mt-2 flex flex-col gap-3">
          {documents.map((document) => (
            <li key={document.id}>
              <p className="text-sm font-medium">{document.name}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{document.text.slice(0, 500)}</p>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Accepted claims">
        {claims.length === 0 ? <p className="text-sm text-muted">No accepted claim is both sourced and free of a disagreement.</p> : null}
        <ul className="flex flex-col gap-3">
          {claims.map((claim) => (
            <li key={claim.id} className="text-sm">
              <p>{claim.text}</p>
              <p className="mt-1 text-muted">“{claim.evidenceQuote}”</p>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Open">
        <ul className="flex flex-col gap-2 text-sm">
          {questions.map((item) => <li key={item.id}>{item.text}</li>)}
        </ul>
      </Panel>
    </div>
  );
}
