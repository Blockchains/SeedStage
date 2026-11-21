import { useState } from "react";
import { AskBox } from "@/components/seedstage/ask-box";
import type { HeldDocument } from "@/lib/seedstage/public-docs";

export function DocumentRoom({ documents, folders }: { documents: HeldDocument[]; folders: readonly string[] }) {
  const [folder, setFolder] = useState<string>("all");
  const [foldersOpen, setFoldersOpen] = useState(false);
  const visible = documents.filter((document) => folder === "all" || document.category === folder);
  const passages = documents.map((document) => ({ id: document.id, title: document.title, text: document.text, entitled: true }));
  const present = new Set(documents.map((document) => document.category));
  const current = folder === "all" ? "All" : folder.replace(/^\d+\s/, "");

  function choose(next: string) {
    setFolder(next);
    setFoldersOpen(false);
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lift">
      <div className="grid min-w-0 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="min-w-0 border-b border-border bg-surface-2 lg:border-r lg:border-b-0" aria-label="Folders">
          <div className="flex items-center justify-between gap-2 px-3 lg:hidden">
            <span className="truncate text-sm font-medium">{current}</span>
            <button type="button" className="hit inline-flex min-h-11 items-center text-sm font-medium text-primary" aria-expanded={foldersOpen} onClick={() => setFoldersOpen((open) => !open)}>
              {foldersOpen ? "Close" : "Expand"}
            </button>
          </div>
          <ul className={`${foldersOpen ? "flex" : "hidden"} flex-col gap-1 p-2 lg:flex`}>
            <li>
              <FolderButton active={folder === "all"} label="All" meta={String(documents.length)} onClick={() => choose("all")} />
            </li>
            {folders.map((name) => (
              <li key={name}>
                <FolderButton
                  active={folder === name}
                  label={name.replace(/^\d+\s/, "")}
                  meta={present.has(name) ? String(documents.filter((document) => document.category === name).length) : "—"}
                  onClick={() => choose(name)}
                />
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 px-4 py-5 md:px-6">
          <AskBox passages={passages} />
          {visible.length === 0 ? <p className="mt-4 text-sm text-muted">Not on file</p> : null}
          <div className="mt-4 flex flex-col gap-8">
            {visible.map((document) => (
              <section key={document.id} id={document.id}>
                <h2 className="text-lg font-semibold tracking-display break-words">{document.title}</h2>
                <p className="mt-1 text-xs text-muted">{document.category.replace(/^\d+\s/, "")}</p>
                <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-wrap">{document.text}</p>
              </section>
            ))}
          </div>
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
