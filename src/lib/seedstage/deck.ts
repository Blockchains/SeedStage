import { unzipSync, strFromU8 } from "fflate";
import { createServerFn } from "@tanstack/react-start";

const TEXT_NAME = /\.(txt|md|csv|json)$/i;
const OFFICE_NAME = /\.(docx|pptx|odt|odp|ppt|doc)$/i;

function decodeXml(value: string): string {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}

function tags(xml: string, tag: string): string[] {
  const found: string[] = [];
  const pattern = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "g");
  for (const match of xml.matchAll(pattern)) {
    const text = decodeXml(match[1] ?? "").replace(/\s+/g, " ").trim();
    if (text) found.push(text);
  }
  return found;
}

function officeText(bytes: Uint8Array): string {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    return "";
  }
  const names = Object.keys(files).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const lines: string[] = [];
  for (const name of names) {
    if (!/word\/document|word\/header|ppt\/slides\/slide|content\.xml/i.test(name)) continue;
    const xml = strFromU8(files[name]);
    lines.push(...tags(xml, "w:t"), ...tags(xml, "a:t"), ...tags(xml, "text:p"));
  }
  return lines.join("\n");
}

async function pdfText(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const pages: string[] = [];
  for (let index = 1; index <= doc.numPages; index += 1) {
    const page = await doc.getPage(index);
    const content = await page.getTextContent();
    const line = content.items.map((item) => ("str" in item ? item.str : "")).join(" ").replace(/\s+/g, " ").trim();
    if (line) pages.push(line);
  }
  return pages.join("\n");
}

export async function extractDeckText(name: string, bytes: Uint8Array): Promise<string> {
  if (TEXT_NAME.test(name) || bytes.length < 20) return new TextDecoder().decode(bytes);
  if (OFFICE_NAME.test(name) || bytes[0] === 0x50 && bytes[1] === 0x4b) {
    const office = officeText(bytes);
    if (office.trim()) return office;
  }
  if (/\.pdf$/i.test(name) || (bytes[0] === 0x25 && bytes[1] === 0x50)) {
    try {
      return await pdfText(bytes);
    } catch {
      return "";
    }
  }
  const office = officeText(bytes);
  if (office.trim()) return office;
  const plain = new TextDecoder().decode(bytes);
  if (/[\x00]/.test(plain)) return "";
  return plain;
}

async function doclingText(name: string, bytes: Uint8Array): Promise<string> {
  try {
    const health = await fetch("http://127.0.0.1:5001/health", { signal: AbortSignal.timeout(800) });
    if (!health.ok) return "";
    const form = new FormData();
    form.append("files", new Blob([Buffer.from(bytes)]), name);
    const response = await fetch("http://127.0.0.1:5001/v1/convert/file", { method: "POST", body: form, signal: AbortSignal.timeout(20000) });
    if (!response.ok) return "";
    const data = (await response.json()) as { document?: { md_content?: string }; status?: string };
    if (data.status !== "success") return "";
    return data.document?.md_content ?? "";
  } catch {
    return "";
  }
}

export const readDeck = createServerFn({ method: "POST" })
  .validator((input: { name: string; data: string }) => {
    const name = String(input?.name ?? "deck").slice(0, 180);
    const data = String(input?.data ?? "");
    if (data.length < 8) throw new Error("The file was empty.");
    if (data.length > 8_000_000) throw new Error("Use a deck under 6 MB.");
    return { name, data };
  })
  .handler(async ({ data }) => {
    const bytes = new Uint8Array(Buffer.from(data.data, "base64"));
    const local = await extractDeckText(data.name, bytes);
    const parsed = local.trim().length >= 40 ? local : await doclingText(data.name, bytes);
    const text = parsed.replace(/\s+\n/g, "\n").trim().slice(0, 12000);
    if (text.length < 20) throw new Error("No readable text in that file. Export it as PDF, PowerPoint, or Word.");
    return { text, name: data.name };
  });
