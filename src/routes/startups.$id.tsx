import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FirmLogo } from "@/components/seedstage/bits";
import { Mark } from "@/components/seedstage/mark";
import { buildStartupRoom } from "@/lib/seedstage/startup-room";
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
  const [sectionId, setSectionId] = useState(room.sections[0]?.id ?? "");
  const section = room.sections.find((item) => item.id === sectionId) ?? room.sections[0];

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

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-10">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Room sections">
          {room.sections.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`hit inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-left text-sm lg:w-full ${item.id === section?.id ? "bg-canvas text-canvas-fg" : "bg-surface text-fg"}`}
              onClick={() => setSectionId(item.id)}
            >
              {item.label}
            </button>
          ))}
          <p className="hidden px-3 pt-4 text-xs text-muted lg:block">{room.missing.length} sections not on file</p>
        </nav>

        <div className="min-w-0">
          <section className="rounded-xl bg-surface p-6 shadow-lift md:p-10">
            <FirmLogo src={company.logo} name={company.name} className="size-16 rounded-xl" />
            <h1 className="mt-6 text-4xl font-semibold tracking-display text-balance md:text-6xl">{company.name}</h1>
            {section ? (
              <dl className="mt-8 flex flex-col gap-6">
                {section.lines.map((line) => (
                  <div key={line.label}>
                    <dt className="text-xs font-medium tracking-kicker text-muted uppercase">{line.label}</dt>
                    <dd className="mt-2 text-base leading-relaxed md:text-lg">{line.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <a className="hit mt-8 inline-flex min-h-11 items-center text-sm font-medium text-primary" href={room.sourceUrl} target="_blank" rel="noreferrer">
              Open source
            </a>
          </section>

          <section className="mt-6 rounded-xl border border-border bg-surface p-6 md:p-8">
            <h2 className="text-sm font-medium">Not on file</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {room.missing.map((item) => (
                <li key={item} className="flex min-h-11 items-center border-t border-border text-sm text-muted">{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
