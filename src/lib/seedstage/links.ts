export type TextPart = { kind: "text"; text: string } | { kind: "link"; text: string; href: string };

const TOKEN = /(?:https?:\/\/|github\.com\/)[^\s<>"']+/gi;

function splitTrailing(raw: string): { body: string; trailing: string } {
  let body = raw;
  let trailing = "";
  while (body.length > 0 && /[.,;:!?)]$/.test(body)) {
    const last = body.at(-1) ?? "";
    if (last === ")" && (body.match(/\(/g)?.length ?? 0) >= (body.match(/\)/g)?.length ?? 0)) break;
    trailing = last + trailing;
    body = body.slice(0, -1);
  }
  return { body, trailing };
}

export function linkParts(value: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of value.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ kind: "text", text: value.slice(last, start) });
    const { body, trailing } = splitTrailing(match[0]);
    if (body) {
      parts.push({ kind: "link", text: body, href: body.startsWith("http") ? body : `https://${body}` });
    }
    if (trailing) parts.push({ kind: "text", text: trailing });
    last = start + match[0].length;
  }
  if (last < value.length) parts.push({ kind: "text", text: value.slice(last) });
  return parts.length > 0 ? parts : [{ kind: "text", text: value }];
}
