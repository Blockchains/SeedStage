export type RoomPassage = {
  id: string;
  title: string;
  text: string;
  entitled: boolean;
};

export type RoomAnswer = {
  answer: string;
  sourceId: string | null;
  sourceTitle: string | null;
};

const STOP = new Set(["what", "which", "where", "when", "with", "from", "that", "this", "have", "does", "about", "their", "there", "into", "your"]);

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 40);
}

export function answerFromRoom(question: string, passages: RoomPassage[]): RoomAnswer {
  const asked = question.trim();
  const refuse: RoomAnswer = { answer: "The authorised documents do not establish this.", sourceId: null, sourceTitle: null };
  if (asked.length < 3) return { answer: "", sourceId: null, sourceTitle: null };
  if (/\b(ignore|send all|export all|system prompt|exfiltrate)\b/i.test(asked)) return refuse;
  const terms = asked.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3 && !STOP.has(word));
  if (terms.length === 0) return refuse;
  let best: { passage: RoomPassage; sentence: string; score: number } | null = null;
  for (const passage of passages) {
    if (!passage.entitled) continue;
    for (const sentence of sentences(passage.text)) {
      const hay = sentence.toLowerCase();
      const score = terms.filter((term) => hay.includes(term)).length;
      if (score > 0 && (!best || score > best.score)) best = { passage, sentence, score };
    }
  }
  const needed = Math.min(2, terms.length);
  if (!best || best.score < needed) return refuse;
  return { answer: best.sentence, sourceId: best.passage.id, sourceTitle: best.passage.title };
}
