"""Build room-extra.json from Docling page conversions and the yc-oss company index."""

from __future__ import annotations

import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/workspace")
OUT = ROOT / "src/lib/seedstage/room-extra.json"
DOCLING = "http://127.0.0.1:5001/v1/convert/source"
YC = json.load(urllib.request.urlopen("https://yc-oss.github.io/api/companies/all.json", timeout=60))
BY_SLUG = {item["slug"]: item for item in YC if item.get("slug")}

LINK = re.compile(r"\[([^\]]+)\]\([^)]+\)")


def convert(url: str) -> str:
    if not url or not url.startswith("http"):
        return ""
    body = json.dumps({"sources": [{"kind": "http", "url": url}]}).encode()
    request = urllib.request.Request(DOCLING, data=body, headers={"content-type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode())
    except Exception:
        return ""
    if data.get("status") != "success":
        return ""
    return clean((data.get("document") or {}).get("md_content") or "")


def clean(markdown: str) -> str:
    text = LINK.sub(r"\1", markdown)
    kept: list[str] = []
    for line in text.splitlines():
        row = line.strip().strip("|").strip()
        if not row or row == "<!-- image -->":
            continue
        lower = row.lower()
        if "account.ycombinator.com" in lower or "apply now" in lower:
            continue
        if lower in {"companies", "founders", "jobs", "resources", "latest news"}:
            continue
        kept.append(row)
    collapsed = re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).strip()
    return collapsed[:2800]


def facts(record: dict) -> str:
    lines: list[str] = []
    former = [name for name in record.get("former_names") or [] if name]
    if former:
        lines.append("Former names: " + ", ".join(former))
    if record.get("subindustry"):
        lines.append("Sub-industry: " + record["subindustry"])
    if record.get("industry"):
        lines.append("Industry: " + record["industry"])
    if record.get("team_size"):
        lines.append(f"Team size: {record['team_size']}")
    if record.get("stage"):
        lines.append("Stage: " + record["stage"])
    if record.get("status"):
        lines.append("Status: " + record["status"])
    if record.get("batch"):
        lines.append("Batch: " + record["batch"])
    if record.get("all_locations"):
        lines.append("Location: " + record["all_locations"])
    regions = record.get("regions") or []
    if regions:
        lines.append("Regions: " + ", ".join(regions))
    if record.get("partners"):
        lines.append("Partners: " + str(record["partners"]))
    if record.get("isHiring") is True:
        lines.append("Hiring: yes")
    if record.get("nonprofit") is True:
        lines.append("Nonprofit: yes")
    if record.get("top_company") is True:
        lines.append("Marked top company on the YC index.")
    launched = record.get("launched_at")
    if isinstance(launched, int) and launched > 0:
        lines.append("Launched: " + datetime.fromtimestamp(launched, timezone.utc).date().isoformat())
    tags = record.get("tags") or []
    if tags:
        lines.append("Tags: " + ", ".join(tags[:12]))
    if record.get("website"):
        lines.append("Website: " + record["website"])
    return "\n".join(lines)


def startup_files(row: dict) -> list[dict]:
    files: list[dict] = []
    yc = BY_SLUG.get(row["id"])
    page = row["sourceUrl"] if "ycombinator.com/companies/" in (row.get("sourceUrl") or "") else row.get("website") or ""
    text = convert(page)
    if len(text) < 400 and row.get("website") and row["website"] != page:
        text = convert(row["website"])
        page = row["website"]
    if len(text) >= 400:
        files.append(
            {
                "title": "Public page",
                "text": text + f"\n\nSource: {page}. Parsed with Docling.",
                "source": page,
            }
        )
    if yc:
        detail = facts(yc)
        if len(detail) >= 40:
            files.append(
                {
                    "title": "Index facts",
                    "text": detail + "\n\nSource: https://github.com/yc-oss/api",
                    "source": "https://github.com/yc-oss/api",
                }
            )
    return files


def investor_files(row: dict) -> list[dict]:
    page = row.get("sourceUrl") or ""
    text = convert(page)
    if len(text) < 400:
        return []
    return [
        {
            "title": "Public page",
            "text": text + f"\n\nSource: {page}. Parsed with Docling.",
            "source": page,
        }
    ]


def main() -> None:
    records = json.load(open("/tmp/seed-records.json"))
    startups: dict[str, list] = {}
    investors: dict[str, list] = {}
    started = time.time()
    done = 0
    total = len(records["startups"]) + len(records["investors"])

    def work(kind: str, row: dict):
        files = startup_files(row) if kind == "startup" else investor_files(row)
        return kind, row["id"], files

    with ThreadPoolExecutor(16) as pool:
        futures = [pool.submit(work, "startup", row) for row in records["startups"]]
        futures += [pool.submit(work, "investor", row) for row in records["investors"]]
        for future in as_completed(futures):
            kind, item_id, files = future.result()
            if files:
                (startups if kind == "startup" else investors)[item_id] = files
            done += 1
            if done % 200 == 0:
                print(f"{done}/{total} startups {len(startups)} investors {len(investors)} {int(time.time()-started)}s", flush=True)

    payload = {"startups": startups, "investors": investors}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    chars = sum(len(file["text"]) for bag in payload.values() for files in bag.values() for file in files)
    print("wrote", OUT, "startup keys", len(startups), "investor keys", len(investors), "chars", chars)


if __name__ == "__main__":
    main()
