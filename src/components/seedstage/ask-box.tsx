import { useState } from "react";
import { answerFromRoom, type RoomPassage } from "@/lib/seedstage/ask";

export function AskBox({ passages }: { passages: RoomPassage[] }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const answer = asked ? answerFromRoom(asked, passages) : null;

  return (
    <form
      className="rounded-xl border border-border bg-surface p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setAsked(question);
      }}
    >
      <label className="text-xs font-medium tracking-kicker text-muted uppercase" htmlFor="room-ask">
        Ask the room
      </label>
      <div className="mt-2 flex gap-2">
        <input id="room-ask" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask from the files on this page" className="min-h-11 w-full rounded-md border border-border bg-bg px-3 text-sm" />
        <button type="submit" className="hit inline-flex min-h-11 shrink-0 items-center rounded-md bg-canvas px-3 text-sm font-medium text-canvas-fg">Ask</button>
      </div>
      {answer?.answer ? (
        <p className="mt-3 text-sm leading-relaxed">
          {answer.answer}
          {answer.sourceTitle ? <span className="mt-1 block text-xs text-muted">{answer.sourceTitle}</span> : null}
        </p>
      ) : null}
    </form>
  );
}
