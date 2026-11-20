#!/usr/bin/env python3
"""Fill empty fields from text and links already on each firm's own site."""

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin

import importlib.util

spec = importlib.util.spec_from_file_location("fd", "/workspace/scripts/fetch-directory.py")
fd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fd)

GEN = Path("/workspace/src/lib/seedstage/directory.generated.ts")
THEMES = ["AI", "fintech", "climate", "health", "consumer", "enterprise", "security", "infrastructure", "biotech", "crypto"]
STOP = {
    "portfolio", "companies", "company", "about", "team", "news", "blog", "home", "contact",
    "careers", "all", "view", "focus", "approach", "invest", "investment", "investments",
    "founders", "founder", "people", "jobs", "legal", "privacy",
}


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


def field_string(block: str, name: str):
    m = re.search(rf"\n    {name}: \"", block)
    if not m:
        return ""
    value, _ = read_string(block, m.end() - 1)
    return value


def stages_of(text: str):
    low = text.lower()
    found = []
    if "pre-seed" in low or "preseed" in low:
        found.append("pre-seed")
    if re.search(r"\bseed\b", low):
        found.append("seed")
    if not found and re.search(r"early[- ]stage|from day one", low):
        found.append("early-stage")
    return found


def themes_of(text: str):
    found = []
    for theme in THEMES:
        if re.search(rf"\b{re.escape(theme)}\b", text, re.I):
            found.append(theme)
    return found[:4]


def minor(raw: str, unit: str):
    n = float(raw.replace(",", ""))
    unit = (unit or "").lower()
    if unit in {"k", "thousand"}:
        n *= 1_000
    elif unit in {"m", "million"}:
        n *= 1_000_000
    elif unit in {"bn", "billion"}:
        return None
    elif n < 1000:
        return None
    if n < 10_000 or n > 30_000_000:
        return None
    return int(round(n * 100))


def cheque_of(text: str):
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        if not re.search(r"invest|ticket|cheque|check", sentence, re.I):
            continue
        if re.search(r"fund size|assets under|aum|billion", sentence, re.I):
            continue
        amounts = re.findall(r"([£$€])\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m|million|bn|billion)?", sentence, re.I)
        if len(amounts) < 2:
            continue
        symbols = {a[0] for a in amounts[:2]}
        if len(symbols) != 1:
            continue
        lo = minor(amounts[0][1], amounts[0][2])
        hi = minor(amounts[1][1], amounts[1][2])
        if lo is None or hi is None or lo >= hi:
            continue
        currency = {"£": "GBP", "$": "USD", "€": "EUR"}[amounts[0][0]]
        return lo, hi, currency
    return None


def title_slug(link: str):
    slug = link.split("#", 1)[1] if "#" in link else link.rstrip("/").split("/")[-1]
    slug = slug.split("?")[0].lower()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+){0,2}", slug):
        return None
    if slug in STOP or any(part in STOP for part in slug.split("-")):
        return None
    words = [part.capitalize() for part in slug.split("-") if part]
    if not words or len(" ".join(words)) > 28:
        return None
    return " ".join(words)


def portfolio_from(url: str):
    try:
        raw, final, _ = fd.get(url, timeout=10, limit=250_000)
    except Exception:
        return []
    html = raw.decode("utf-8", "ignore")
    names = []
    for href in re.findall(r'href=["\']([^"\']+)["\']', html, re.I):
        link = urljoin(final, href)
        if not re.search(r"/(portfolio|companies|founder-companies)(/|#|$)", link, re.I):
            continue
        name = title_slug(link)
        if name and name not in names:
            names.append(name)
        if len(names) >= 12:
            break
    return names if len(names) >= 3 else []


def main():
    text = GEN.read_text()
    jobs = []
    for _start, _end, block in blocks(text):
        if "excerpt:" not in block or "portfolio: []" not in block:
            continue
        url = field_string(block, "sourceUrl")
        rid = field_string(block, "id")
        if url.startswith("http") and rid:
            jobs.append((rid, url))
    portfolios = {}
    with ThreadPoolExecutor(12) as pool:
        futs = {pool.submit(portfolio_from, url): rid for rid, url in jobs}
        for fut in as_completed(futs):
            names = fut.result()
            if names:
                portfolios[futs[fut]] = names
                print("portfolio", futs[fut], ", ".join(names[:6]))
    pieces = []
    cursor = 0
    stats = {"stages": 0, "themes": 0, "cheque": 0, "portfolio": 0, "startupStage": 0}
    for start, end, block in blocks(text):
        new = block
        if "excerpt:" in block:
            excerpt = field_string(block, "excerpt")
            rid = field_string(block, "id")
            if "stages: []" in new:
                stages = stages_of(excerpt)
                if stages:
                    new = new.replace("stages: []", "stages: " + json.dumps(stages), 1)
                    stats["stages"] += 1
            if "themes: []" in new:
                themes = themes_of(excerpt)
                if themes:
                    new = new.replace("themes: []", "themes: " + json.dumps(themes), 1)
                    stats["themes"] += 1
            if "chequeMaxMinor: 0" in new:
                found = cheque_of(excerpt)
                if found:
                    lo, hi, currency = found
                    new = new.replace("chequeMinMinor: 0", f"chequeMinMinor: {lo}", 1)
                    new = new.replace("chequeMaxMinor: 0", f"chequeMaxMinor: {hi}", 1)
                    new = re.sub(r'currency: "GBP"', f'currency: "{currency}"', new, count=1)
                    stats["cheque"] += 1
                    print("cheque", rid, lo, hi, currency)
            if rid in portfolios and "portfolio: []" in new:
                new = new.replace("portfolio: []", "portfolio: " + json.dumps(portfolios[rid], ensure_ascii=False), 1)
                stats["portfolio"] += 1
        elif "summary:" in block and 'stage: ""' in block:
            stage = stages_of(field_string(block, "summary"))
            if stage:
                label = "Pre-seed" if "pre-seed" in stage else "Seed" if "seed" in stage else "Early"
                new = new.replace('stage: ""', f"stage: {json.dumps(label)}", 1)
                stats["startupStage"] += 1
        if new != block:
            pieces.append(text[cursor:start])
            pieces.append(new)
            cursor = end
    pieces.append(text[cursor:])
    GEN.write_text("".join(pieces))
    print("STATS", stats)


if __name__ == "__main__":
    main()
