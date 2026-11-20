import { Link, createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useState } from "react";
import { FirmLogo } from "@/components/seedstage/bits";
import { Mark } from "@/components/seedstage/mark";
import { buildStartupRoom, type StartupRoomSection } from "@/lib/seedstage/startup-room";
import { publicStartups } from "@/lib/seedstage/startups";

export const Route = createFileRoute("/startups/$id")({ component: StartupRoomPage });

function StartupRoomPage() {
  const { id } = Route.useParams();
  const company = publicStartups.find((item) => item.id === id);
  if (!company) {
    return (
      <div className="min-h-screen bg-bg px-4 py-10 text-fg">
        <Link to="/startups" className="hit inline-flex min-h-11 items-center text-sm font-medium text-primary">Startups</Link>
        <p className="mt-6 text-sm text-muted">No company with that id.</p>
      </div>
    );
  }
  const room = buildStartupRoom(company);
  const folders: StartupRoomSection[] = [
    ...room.sections,
    ...room.missing.map((label) => ({ id: label, label, lines: [] })),
  ];
  const [sectionId, setSectionId] = useState(folders[0]?.id ?? "");
  const section = folders.find((item) => item.id === sectionId) ?? folders[0];
  const onFile = room.sections.length;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-canvas-line bg-canvas text-canvas-fg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/startups" className="hit inline-flex min-h-11 items-center text-sm">Startups</Link>
          <Link to="/" className="hit flex items-center gap-2 text-sm font-semibold tracking-display">
            <Mark className="size-7" />
            SeedStage
          </Link>
          <a className="hit inline-flex min-h-11 items-center text-sm" href={company.website} target="_blank" rel="noreferrer">Site</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 md:py-8">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lift">
          <div className="flex items-center gap-4 border-b border-border px-4 py-4 md:px-6">
            <FirmLogo src={company.logo} name={company.name} className="size-14 rounded-lg" />
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-kicker text-muted uppercase">Data room</p>
              <h1 className="truncate text-2xl font-semibold tracking-display md:text-3xl">{company.name}</h1>
              <p className="text-sm text-muted">{onFile} on file · {room.missing.length} not on file</p>
            </div>
          </div>

          <div className="grid lg:min-h-[32rem] lg:grid-cols-[260px_minmax(0,1fr)]">
            <nav className="border-b border-border bg-surface-2 lg:border-r lg:border-b-0" aria-label="Room index">
              <ul className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
                {folders.map((item) => {
                  const active = item.id === section?.id;
                  const filled = item.lines.length > 0;
                  return (
                    <li key={item.id} className="shrink-0 lg:shrink">
                      <button
                        type="button"
                        className={`hit flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm ${active ? "bg-canvas text-canvas-fg" : "text-fg"}`}
                        onClick={() => setSectionId(item.id)}
                      >
                        <FileText className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{item.label}</span>
                        <span className={`ml-auto text-xs ${active ? "text-canvas-muted" : "text-muted"}`}>{filled ? "On file" : "—"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <article className="min-w-0 px-4 py-6 md:px-10 md:py-10">
              {section && section.lines.length > 0 ? (
                <>
                  <p className="text-xs font-medium tracking-kicker text-muted uppercase">{section.label}</p>
                  <dl className="mt-6 flex flex-col gap-6">
                    {section.lines.map((line) => (
                      <div key={line.label}>
                        <dt className="text-xs text-muted">{line.label}</dt>
                        <dd className="mt-1 text-base leading-relaxed md:text-lg">{line.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <div className="flex min-h-64 flex-col items-start justify-center">
                  <p className="text-xs font-medium tracking-kicker text-muted uppercase">{section?.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-display">Not on file</p>
                </div>
              )}
              <a className="hit mt-8 inline-flex min-h-11 items-center text-sm font-medium text-primary" href={room.sourceUrl} target="_blank" rel="noreferrer">
                Open source
              </a>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}
