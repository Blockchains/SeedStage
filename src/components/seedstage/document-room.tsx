import { FileText } from "lucide-react";
import { useState } from "react";
import { AskBox } from "@/components/seedstage/ask-box";
import type { HeldDocument } from "@/lib/seedstage/public-docs";

export function DocumentRoom({ documents, folders }: { documents: HeldDocument[]; folders: readonly string[] }) {
  const [folder, setFolder] = useState<string>("all");
  const [documentId, setDocumentId] = useState(documents[0]?.id ?? "");
  const visible = documents.filter((document) => folder === "all" || document.category === folder);
  const selected = visible.find((document) => document.id === documentId) ?? visible[0] ?? null;
  const passages = documents.map((document) => ({ id: document.id, title: document.title, text: document.text, entitled: true }));
  const present = new Set(documents.map((document) => document.category));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lift">
      <div className="grid lg:min-h-[36rem] lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="border-b border-border bg-surface-2 lg:border-r lg:border-b-0" aria-label="Folders">
          <ul className="flex gap-1 overflow-x-auto p-2 lg:flex-col">
            <li>
              <FolderButton active={folder === "all"} label="All files" meta={String(documents.length)} onClick={() => setFolder("all")} />
            </li>
            {folders.map((name) => (
              <li key={name}>
                <FolderButton
                  active={folder === name}
                  label={name.replace(/^\d+\s/, "")}
                  meta={present.has(name) ? String(documents.filter((document) => document.category === name).length) : "—"}
                  onClick={() => setFolder(name)}
                />
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid min-w-0 md:grid-cols-[220px_minmax(0,1fr)]">
          <ul className="border-b border-border md:border-r md:border-b-0">
            {visible.map((document) => {
              const active = document.id === selected?.id;
              return (
                <li key={document.id}>
                  <button type="button" className={`hit flex min-h-14 w-full items-center gap-2 px-3 text-left text-sm ${active ? "bg-canvas text-canvas-fg" : ""}`} onClick={() => setDocumentId(document.id)}>
                    <FileText className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate">{document.title}</span>
                      <span className={`block truncate text-xs ${active ? "text-canvas-muted" : "text-muted"}`}>{document.category.replace(/^\d+\s/, "")}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {visible.length === 0 ? <li className="px-3 py-6 text-sm text-muted">Not on file</li> : null}
          </ul>
          <article className="min-w-0 px-4 py-5 md:px-6">
            <AskBox passages={passages} />
            {selected ? (
              <>
                <h2 className="mt-4 text-lg font-semibold tracking-display">{selected.title}</h2>
                <p className="mt-1 text-xs text-muted">{selected.category.replace(/^\d+\s/, "")}</p>
                <pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed">{selected.text}</pre>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted">Not on file</p>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}

function FolderButton({ active, label, meta, onClick }: { active: boolean; label: string; meta: string; onClick: () => void }) {
  return (
    <button type="button" className={`hit flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-sm ${active ? "bg-canvas text-canvas-fg" : ""}`} onClick={onClick}>
      <span className="truncate">{label}</span>
      <span className={`num shrink-0 text-xs ${active ? "text-canvas-muted" : "text-muted"}`}>{meta}</span>
    </button>
  );
}
