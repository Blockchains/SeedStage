#!/usr/bin/env python3
"""Replace short profile lines with longer text taken from the same site. Do not invent amounts or names."""

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from html import unescape
from urllib.parse import urljoin

import importlib.util

spec = importlib.util.spec_from_file_location("fd", "/workspace/scripts/fetch-directory.py")
fd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fd)

GEN = Path("/workspace/src/lib/seedstage/directory.generated.ts")
JUNK = re.compile(
    r"cookie|privacy preference|subscribe|accept all|high-risk investment|don't invest|"
    r"skip to|@media|font-size|function\(|javascript|sign in|log in|all rights reserved|"
    r"enable javascript|loading|careers|newsletter|follow us",
    re.I,
)


def visible(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.I)
    html = re.sub(r"<noscript[\s\S]*?</noscript>", " ", html, flags=re.I)
    return html


def plain(text: str) -> str:
    text = unescape(re.sub(r"<[^>]+>", " ", text or ""))
    return re.sub(r"\s+", " ", text).strip()


def sentences(html: str) -> str:
    html = visible(html)
    parts = []
    desc = ""
    for attr, key in (("name", "description"), ("property", "og:description")):
        m = re.search(rf'<meta[^>]+{attr}=["\']{key}["\'][^>]+content=["\']([^"\']+)', html, re.I) or re.search(
            rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+{attr}=["\']{key}["\']', html, re.I
        )
        if m:
            desc = plain(m.group(1))
            break
    if 40 <= len(desc) <= 360 and not JUNK.search(desc):
        parts.append(desc)
    for raw in re.findall(r"<p[^>]*>([\s\S]*?)</p>", html, flags=re.I):
        text = plain(raw)
        if not (90 <= len(text) <= 480) or JUNK.search(text) or text.count(" ") < 10:
            continue
        if any(text in have or have in text for have in parts):
            continue
        parts.append(text)
        if sum(len(p) for p in parts) > 1500:
            break
    return re.sub(r"\s+", " ", " ".join(parts)).strip()[:1500]


def fetch_text(url: str) -> str:
    try:
        raw, final, _ = fd.get(url, limit=350_000, timeout=12)
    except Exception:
        return ""
    html = raw.decode("utf-8", "ignore")
    body = sentences(html)
    if len(body) >= 500:
        return body
    for path in ("/about", "/about-us", "/about/"):
        try:
            raw2, _, _ = fd.get(urljoin(final, path), limit=250_000, timeout=10)
        except Exception:
            continue
        extra = sentences(raw2.decode("utf-8", "ignore"))
        if len(extra) > len(body):
            body = extra
        if len(body) >= 500:
            break
    return body


def read_string(text: str, i: int) -> tuple[str, int]:
    if text[i] != '"':
        raise ValueError("expected quote")
    i += 1
    out = []
    while i < len(text):
        if text[i] == "\\":
            out.append(text[i + 1])
            i += 2
            continue
        if text[i] == '"':
            return "".join(out), i + 1
        out.append(text[i])
        i += 1
    raise ValueError("unterminated")


def blocks(text: str):
    starts = [m.start() for m in re.finditer(r"\n  \{\n", text)]
    for n, start in enumerate(starts):
        end = starts[n + 1] if n + 1 < len(starts) else text.find("\n];", start)
        yield start, end, text[start:end]


def field_span(block: str, name: str):
    m = re.search(rf"\n    {name}: ", block)
    if not m:
        return None
    i = m.end()
    if block[i] != '"':
        return None
    _value, end = read_string(block, i)
    return m.start(), i, end


def main():
    text = GEN.read_text()
    jobs = []
    for start, end, block in blocks(text):
        id_at = field_span(block, "id")
        url_name = "sourceUrl"
        url_at = field_span(block, url_name)
        kind = "excerpt" if "excerpt:" in block else "summary" if "summary:" in block else ""
        value_at = field_span(block, kind) if kind else None
        if not id_at or not url_at or not value_at:
            continue
        rid, _ = read_string(block, id_at[1])
        url, _ = read_string(block, url_at[1])
        current, _ = read_string(block, value_at[1])
        if url.startswith("http"):
            jobs.append((start, rid, url, kind, len(current)))
    print("jobs", len(jobs))
    found = {}
    with ThreadPoolExecutor(12) as pool:
        futs = {pool.submit(fetch_text, url): (rid, kind, current_len) for _, rid, url, kind, current_len in jobs}
        for fut in as_completed(futs):
            rid, kind, current_len = futs[fut]
            body = fut.result()
            if len(body) >= current_len + 80 and len(body) >= 180:
                found[rid] = (kind, body)
                print("deeper", rid, current_len, "->", len(body))
    if not found:
        print("ADDED 0")
        return
    pieces = []
    cursor = 0
    changed = 0
    for start, end, block in blocks(text):
        id_at = field_span(block, "id")
        if not id_at:
            continue
        rid, _ = read_string(block, id_at[1])
        if rid not in found:
            continue
        kind, body = found[rid]
        span = field_span(block, kind)
        if not span:
            continue
        abs_start = start + span[1]
        abs_end = start + span[2]
        pieces.append(text[cursor:abs_start])
        pieces.append(json.dumps(body, ensure_ascii=False))
        cursor = abs_end
        changed += 1
    pieces.append(text[cursor:])
    GEN.write_text("".join(pieces))
    print("ADDED", changed)


if __name__ == "__main__":
    main()
