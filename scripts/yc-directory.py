#!/usr/bin/env python3
"""Add launched Y Combinator companies from the public yc-oss index.

Keeps a company only when that index has a logo, a website and a one-line description.
"""

import json
import re
from pathlib import Path

GEN = Path("/workspace/src/lib/seedstage/directory.generated.ts")
SRC = Path("/tmp/yc.json")


def host(url: str) -> str:
    value = (url or "").lower().split("?")[0].rstrip("/")
    value = re.sub(r"^https?://", "", value)
    return re.sub(r"^www\.", "", value)


def slug_id(slug: str) -> str:
    return re.sub(r"[^a-z0-9-]", "", slug.lower())[:48]


def existing():
    ids, names, hosts = set(), set(), set()
    blobs = [GEN.read_text()]
    for path in ("/workspace/src/lib/seedstage/startups.ts", "/workspace/src/lib/seedstage/public-investors.ts"):
        blobs.append(Path(path).read_text())
    for blob in blobs:
        ids.update(re.findall(r'id: "([^"]+)"', blob))
        for raw in re.findall(r'(?:firm|name): ("(?:\\.|[^"\\])*")', blob):
            names.add(json.loads(raw).lower())
        for raw in re.findall(r'(?:website|sourceUrl): ("(?:\\.|[^"\\])*")', blob):
            hosts.add(host(json.loads(raw)))
    return ids, names, hosts


def main():
    have, names, hosts = existing()
    companies = json.loads(SRC.read_text())
    chunks = []
    seen = set()
    for company in companies:
        sid = slug_id(company.get("slug") or "")
        name = (company.get("name") or "").strip()
        website = (company.get("website") or "").strip()
        logo = (company.get("small_logo_thumb_url") or "").strip()
        line = re.sub(r"\s+", " ", company.get("one_liner") or "").strip()
        if not sid or not name or len(line) < 12 or not website.startswith("http") or not logo.startswith("https://"):
            continue
        site = host(website)
        if not site or site in hosts or site in seen or name.lower() in names or sid in have:
            continue
        seen.add(site)
        long = re.sub(r"\s+", " ", company.get("long_description") or "").strip()
        facts = []
        if company.get("batch"):
            facts.append(f"Batch: {company['batch']}")
        if company.get("status"):
            facts.append(f"Status: {company['status']}")
        if company.get("industry"):
            facts.append(f"Industry: {company['industry']}")
        if company.get("all_locations"):
            facts.append(f"Location: {company['all_locations']}")
        body = long if len(long) > 80 and long != line else ""
        text = "\n".join([part for part in (body[:700], ". ".join(facts)) if part])
        files = ""
        if text:
            files = f"    files: [{json.dumps({'title': 'Y Combinator', 'text': text}, ensure_ascii=False)}],\n"
        stage = company.get("stage") if company.get("stage") in ("Early", "Growth") else "Early"
        chunks.append(
            "  {\n"
            f"    id: {json.dumps(sid)},\n"
            f"    name: {json.dumps(name, ensure_ascii=False)},\n"
            f"    website: {json.dumps(website)},\n"
            f"    logo: {json.dumps(logo)},\n"
            f"    stage: {json.dumps(stage)},\n"
            "    round: null,\n"
            f"    summary: {json.dumps(line, ensure_ascii=False)},\n"
            "    person: null,\n"
            '    funder: "Y Combinator",\n'
            '    source: "Y Combinator",\n'
            f"    sourceUrl: {json.dumps(company.get('url') or website)},\n"
            f"{files}"
            "  }"
        )
    if not chunks:
        raise SystemExit("nothing to add")
    text = GEN.read_text().rstrip()
    if not text.endswith("];"):
        raise SystemExit("unexpected ending")
    text = text[:-2] + ",\n" + ",\n".join(chunks) + "\n];\n"
    text = text.replace("\u2028", " ").replace("\u2029", " ")
    GEN.write_text(text)
    print("ADDED", len(chunks))


if __name__ == "__main__":
    main()
