#!/usr/bin/env python3
"""Replace profile text with sentences taken from the firm's own page."""

import importlib.util
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin, urlparse

spec = importlib.util.spec_from_file_location("fd", "/workspace/scripts/fetch-directory.py")
fd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fd)

FILES = [
    Path("/workspace/src/lib/seedstage/directory.generated.ts"),
    Path("/workspace/src/lib/seedstage/public-investors.ts"),
    Path("/workspace/src/lib/seedstage/startups.ts"),
]
JUNK = re.compile(
    r"cookie|privacy preference|subscribe|accept all|high-risk investment|don't invest|"
    r"skip to|@media|font-size|function\(|javascript|sign in|log in|all rights reserved|"
    r"enable javascript|loading",
    re.I,
)
STOP_NAME = {
    "portfolio", "companies", "company", "about", "team", "news", "blog", "read", "more",
    "learn", "view", "home", "contact", "careers", "founders", "approach", "focus",
    "invest", "investment", "investments", "the", "our", "and", "back", "next", "see",
}


def visible(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.I)
    html = re.sub(r"<noscript[\s\S]*?</noscript>", " ", html, flags=re.I)
    return html


def prose(html: str) -> str:
    html = visible(html)
    parts = []
    desc = fd.meta(html, "name", "description") or fd.meta(html, "property", "og:description")
    if desc and len(desc) > 40 and not JUNK.search(desc):
        parts.append(desc)
    for raw in re.findall(r"<p[^>]*>([\s\S]*?)</p>", html, flags=re.I):
        text = fd.clean(re.sub(r"<[^>]+>", " ", raw))
        text = re.sub(r"\s+", " ", text).strip()
        if not (70 <= len(text) <= 360):
            continue
        if JUNK.search(text):
            continue
        if text not in parts and not any(text in have or have in text for have in parts):
            parts.append(text)
        if sum(len(p) for p in parts) > 720:
            break
    body = " ".join(parts)
    body = re.sub(r"\s+", " ", body).strip()
    return body[:680]


def names_from(html: str, base: str) -> list[str]:
    html = visible(html)
    found = []
    for tag in re.findall(r"<a\b[^>]*>[\s\S]*?</a>", html, flags=re.I):
        href = re.search(r'href=["\']([^"\']+)', tag, re.I)
        if not href:
            continue
        link = urljoin(base, href.group(1))
        if not re.search(r"portfolio|compan", link, re.I):
            continue
        text = fd.clean(re.sub(r"<[^>]+>", " ", tag))
        words = text.split()
        if not (1 <= len(words) <= 3) or not (2 <= len(text) <= 32):
            continue
        if text.lower() in STOP_NAME or any(w.lower() in STOP_NAME for w in words):
            continue
        if not text[0].isupper():
            continue
        if text not in found:
            found.append(text)
        if len(found) == 8:
            break
    return found


def about_link(html: str, base: str) -> str | None:
    host = urlparse(base).netloc
    for tag in re.findall(r"<a\b[^>]*>", html, flags=re.I):
        href = re.search(r'href=["\']([^"\']+)', tag, re.I)
        if not href:
            continue
        link = urljoin(base, href.group(1))
        if urlparse(link).netloc != host:
            continue
        if re.search(r"/(about|approach|focus|strategy|portfolio)(/|$)", link, re.I):
            return link
    return None


def cheque(text: str):
    m = re.search(
        r"(?:invest(?:s|ing|ed)?|cheques?|checks?|tickets?).{0,48}"
        r"(£|\$|€)\s?(\d+(?:\.\d+)?)\s?(k|m)?\s?(?:–|-|to|and|&)\s?(?:£|\$|€)?\s?(\d+(?:\.\d+)?)\s?(k|m|million)?",
        text,
        re.I,
    )
    if not m:
        return None
    symbol, a, au, b, bu = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)

    def major(num, unit):
        value = float(num)
        unit = (unit or "").lower()
        if unit == "k":
            value *= 1_000
        elif unit in {"m", "million"}:
            value *= 1_000_000
        return int(value)

    lo, hi = major(a, au), major(b, bu)
    if hi < lo or lo < 10_000 or hi > 50_000_000:
        return None
    currency = {"£": "GBP", "$": "USD", "€": "EUR"}[symbol]
    return lo * 100, hi * 100, currency


def deepen(url: str):
    try:
        raw, final, _ = fd.get(url, limit=350_000)
    except Exception as e:
        return None, str(e)[:80]
    html = raw.decode("utf-8", "ignore")
    text = prose(html)
    extra = about_link(html, final)
    names = names_from(html, final)
    if extra:
        try:
            raw2, final2, _ = fd.get(extra, limit=250_000)
            html2 = raw2.decode("utf-8", "ignore")
            more = prose(html2)
            if more and more not in text:
                text = (text + " " + more).strip()[:680]
            for name in names_from(html2, final2):
                if name not in names:
                    names.append(name)
        except Exception:
            pass
    if len(text) < 50:
        return None, "thin"
    return {"text": text, "names": names[:8], "cheque": cheque(text + " " + (html[:5000] if False else ""))}, "ok"


def records(text: str):
    rows = []
    for id_, url in re.findall(r'id: "([^"]+)"[\s\S]{0,2500}?sourceUrl: ("(?:\\.|[^"\\])*")', text):
        try:
            rows.append((id_, json.loads(url)))
        except Exception:
            continue
    return rows


def patch(text: str, id_: str, new_text: str, names: list[str]):
    marker = f'id: "{id_}"'
    i = text.find(marker)
    if i < 0:
        return text, False
    j = text.find("\n  }", i)
    if j < 0:
        return text, False
    block = text[i:j]
    field = "excerpt" if "excerpt:" in block else "summary" if "summary:" in block else ""
    if not field:
        return text, False
    block2, n = re.subn(
        rf'{field}: ("(?:\\.|[^"\\])*")',
        f"{field}: {json.dumps(new_text, ensure_ascii=False)}",
        block,
        count=1,
    )
    if n != 1:
        return text, False
    if names and "portfolio: []" in block2:
        block2 = block2.replace("portfolio: []", "portfolio: " + json.dumps(names, ensure_ascii=False), 1)
    return text[:i] + block2 + text[j:], True


def main():
    blobs = {path: path.read_text() for path in FILES}
    jobs = []
    for path, text in blobs.items():
        for id_, url in records(text):
            jobs.append((path, id_, url))
    # one fetch per url
    by_url = {}
    urls = list({url for _, _, url in jobs})
    print("fetch", len(urls))
    with ThreadPoolExecutor(14) as pool:
        futs = {pool.submit(deepen, url): url for url in urls}
        done = 0
        for fut in as_completed(futs):
            url = futs[fut]
            rec, status = fut.result()
            done += 1
            if rec:
                by_url[url] = rec
            if done % 40 == 0:
                print("progress", done, "kept", len(by_url))
    print("usable", len(by_url), "of", len(urls))
    updated = 0
    for path in FILES:
        text = blobs[path]
        for id_, url in records(text):
            rec = by_url.get(url)
            if not rec:
                continue
            text, ok = patch(text, id_, rec["text"], rec["names"] if path.name != "startups.ts" else [])
            updated += int(ok)
        path.write_text(text)
        print(path.name, "patched objects", updated)
        updated = 0


if __name__ == "__main__":
    main()
