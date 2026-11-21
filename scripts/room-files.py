#!/usr/bin/env python3
"""Add extra pages from each site into the data room. Keep only new prose."""

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path
from urllib.parse import urljoin

import importlib.util

spec = importlib.util.spec_from_file_location("fd", "/workspace/scripts/fetch-directory.py")
fd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fd)

GEN = Path("/workspace/src/lib/seedstage/directory.generated.ts")
JUNK = re.compile(
    r"cookie|subscribe|accept all|javascript|all rights reserved|rich text element|"
    r"sign in|log in|privacy preference|enable javascript|for static content",
    re.I,
)


def plain(text: str) -> str:
    text = unescape(re.sub(r"<[^>]+>", " ", text or ""))
    return re.sub(r"\s+", " ", text).strip()


def prose(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", html, flags=re.I)
    parts = []
    for raw in re.findall(r"<p[^>]*>([\s\S]*?)</p>", html, flags=re.I):
        text = plain(raw)
        if not (120 <= len(text) <= 700) or JUNK.search(text) or text.count(" ") < 12:
            continue
        if any(text in have or have in text for have in parts):
            continue
        parts.append(text)
        if sum(len(p) for p in parts) > 1200:
            break
    return " ".join(parts)[:1200]


def novel(text: str, existing: str) -> bool:
    if not text or text in existing or existing in text:
        return False
    old = set(existing.lower().split())
    new = set(text.lower().split())
    if len(new) < 20:
        return False
    return len(old & new) / len(new) < 0.55


def title_for(url: str) -> str:
    path = url.lower()
    if "product" in path:
        return "Product"
    if "team" in path:
        return "Team"
    if "company" in path or "story" in path:
        return "Company"
    return "About"


def pages_for(url: str, existing: str):
    try:
        raw, final, _ = fd.get(url, timeout=8, limit=220_000)
    except Exception:
        return []
    html = raw.decode("utf-8", "ignore")
    found = []
    for href in re.findall(r'href=["\']([^"\']+)["\']', html, re.I):
        link = urljoin(final, href).split("#")[0]
        if re.search(r"/(about|about-us|company|our-story|product)(/|$)", link, re.I):
            if link not in found and link.rstrip("/") != final.rstrip("/"):
                found.append(link)
    for path in ("/about", "/about-us", "/company", "/product"):
        link = urljoin(final, path)
        if link not in found:
            found.append(link)
    files = []
    used = {existing}
    for link in found[:4]:
        try:
            raw2, landed, _ = fd.get(link, timeout=8, limit=180_000)
        except Exception:
            continue
        if landed.rstrip("/") == final.rstrip("/"):
            continue
        text = prose(raw2.decode("utf-8", "ignore"))
        if not novel(text, " ".join(used)):
            continue
        files.append({"title": title_for(landed), "text": text})
        used.add(text)
        if len(files) == 3:
            break
    return files


def read_string(text: str, i: int):
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


def field(block: str, name: str):
    m = re.search(rf"\n    {name}: \"", block)
    if not m:
        return ""
    value, _ = read_string(block, m.end() - 1)
    return value


def main():
    text = GEN.read_text()
    jobs = []
    for start, end, block in blocks(text):
        if "files:" in block:
            continue
        url = field(block, "sourceUrl") or field(block, "website")
        existing = field(block, "excerpt") or field(block, "summary")
        rid = field(block, "id")
        if url.startswith("http") and rid:
            jobs.append((rid, url, existing, start, end))
    print("jobs", len(jobs))
    got = {}
    with ThreadPoolExecutor(10) as pool:
        futs = {pool.submit(pages_for, url, existing): rid for rid, url, existing, _, _ in jobs}
        for fut in as_completed(futs):
            files = fut.result()
            if files:
                got[futs[fut]] = files
                print("files", futs[fut], len(files), files[0]["title"], len(files[0]["text"]))
    pieces = []
    cursor = 0
    added = 0
    for start, end, block in blocks(text):
        rid = field(block, "id")
        if rid not in got:
            continue
        line = "    files: " + json.dumps(got[rid], ensure_ascii=False) + ",\n"
        # place the files before the closing brace of the object
        close = block.rfind("\n  }")
        if close < 0:
            continue
        pieces.append(text[cursor:start])
        pieces.append(block[:close] + "\n" + line + block[close:])
        cursor = end
        added += 1
    pieces.append(text[cursor:])
    GEN.write_text("".join(pieces))
    print("ADDED", added)


if __name__ == "__main__":
    main()
