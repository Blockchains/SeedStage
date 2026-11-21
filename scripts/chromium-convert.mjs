import { createServer } from "node:http";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/health") {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ status: "up", details: { chromium: { status: "up" }, libreoffice: { status: "down" } } }));
      return;
    }
    if (request.method === "POST" && request.url === "/forms/chromium/convert/html") {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      const start = raw.search(/<!doctype html|<html/i);
      const html = start >= 0 ? raw.slice(start) : `<!doctype html><html><body>${raw}</body></html>`;
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const pdf = await page.pdf({ format: "A4" });
      await page.close();
      response.setHeader("content-type", "application/pdf");
      response.end(pdf);
      return;
    }
    response.statusCode = 404;
    response.end();
  } catch (error) {
    response.statusCode = 500;
    response.end(error instanceof Error ? error.message : "convert failed");
  }
});

server.listen(3010, "127.0.0.1");
