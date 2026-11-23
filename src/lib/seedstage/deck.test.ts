import assert from "node:assert/strict";
import test from "node:test";
import { zipSync, strToU8 } from "fflate";
import { extractDeckText } from "./deck.ts";

test("a PowerPoint and a Word file yield the slide text", async () => {
  const pptx = zipSync({ "ppt/slides/slide1.xml": strToU8("<a:t>Seed fintech for UK banks</a:t>") });
  const docx = zipSync({ "word/document.xml": strToU8("<w:t>Raising £2m seed in London</w:t>") });
  assert.match(await extractDeckText("deck.pptx", pptx), /UK banks/);
  assert.match(await extractDeckText("memo.docx", docx), /London/);
});

test("a text PDF yields the page sentence", async () => {
  const pdf = new TextEncoder().encode(`%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 73>>stream
BT /F1 18 Tf 20 80 Td (Seed fintech in London) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`);
  assert.match(await extractDeckText("deck.pdf", pdf), /Seed fintech in London/);
});
