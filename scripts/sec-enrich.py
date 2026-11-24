"""Fill phone, address and people from Form D XML. No invented contacts."""

from __future__ import annotations

import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path("/workspace")
OUT = ROOT / "src/lib/seedstage/sec-wave.json"
UA = {"User-Agent": "SeedStage research ismail@seedstage.si", "Accept": "application/xml"}
CAP = 6000
WORKERS = 8


def get(url: str) -> str:
    request = urllib.request.Request(url, headers=UA)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read().decode("utf-8", "replace")
        except Exception:
            time.sleep(0.5 * (attempt + 1))
    return ""


def tag(xml: str, name: str) -> str:
    match = re.search(rf"<{name}>(.*?)</{name}>", xml, re.S)
    if not match:
        return ""
    return re.sub(r"\s+", " ", match.group(1)).strip()


def money(value: str) -> str:
    if not value or value in {"0", "Indefinite"}:
        return ""
    try:
        amount = int(float(value))
    except ValueError:
        return ""
    if amount <= 0:
        return ""
    return f"${amount:,.0f}"


def phone(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) == 10:
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
    return value.strip()


def people(xml: str) -> list[str]:
    found = []
    for block in re.findall(r"<relatedPersonInfo>(.*?)</relatedPersonInfo>", xml, re.S):
        first = tag(block, "firstName")
        last = tag(block, "lastName")
        if first in {"", "N/A"} or last in {"", "N/A"}:
            continue
        if re.search(r"\b(L\.?P\.?|LLC|Fund|Partners)\b", last):
            continue
        roles = re.findall(r"<relationship>(.*?)</relationship>", block, re.S)
        role = ", ".join(re.sub(r"\s+", " ", item).strip() for item in roles if item.strip())
        found.append(f"{first} {last}" + (f", {role}" if role else ""))
    return found[:6]


def needs(row: dict) -> bool:
    return "Phone:" not in json.dumps(row.get("files") or "")


def target(row: dict) -> tuple[str, str] | None:
    match = re.search(r"/(\d+-\d+-\d+)-index\.html", row.get("sourceUrl") or row.get("website") or "")
    cik = re.search(r"sec-(\d+)$", row.get("id") or "")
    if not match or not cik:
        return None
    return cik.group(1), match.group(1)


def xml_url(cik: str, adsh: str) -> str:
    return f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{adsh.replace('-', '')}/primary_doc.xml"


def apply_startup(row: dict, xml: str) -> None:
    names = people(xml)
    number = phone(tag(xml, "issuerPhoneNumber"))
    street = tag(xml, "street1")
    city = tag(xml, "city")
    state = tag(xml, "stateOrCountryDescription")
    where = ", ".join(part for part in [city, state] if part)
    offering = money(tag(xml, "totalOfferingAmount"))
    sold = money(tag(xml, "totalAmountSold"))
    industry = tag(xml, "industryGroupType")
    filed = re.search(r"Filed (\d{4}-\d{2}-\d{2})", row.get("summary") or "")
    date = filed.group(1) if filed else ""
    summary = " ".join(part for part in [industry, f"Offering {offering}" if offering else "", where, f"Filed {date}" if date else ""] if part)
    if summary:
        row["summary"] = summary
    if offering:
        row["round"] = offering
    if names:
        row["person"] = names[0]
    lines = []
    if street or where:
        lines.append(f"Address: {', '.join(part for part in [street, where] if part)}")
    if number:
        lines.append(f"Phone: {number}")
    if names:
        lines.append("People named on the filing: " + "; ".join(names))
    if sold:
        lines.append(f"Amount sold on the filing: {sold}")
    adsh = target(row)
    lines.append(f"Source: SEC Form D {adsh[1] if adsh else ''}".rstrip())
    row["files"] = [{"title": "Corporate contact", "text": "\n".join(lines)}]
    row["stage"] = "Form D"


def apply_investor(row: dict, xml: str) -> None:
    names = people(xml)
    number = phone(tag(xml, "issuerPhoneNumber"))
    street = tag(xml, "street1")
    city = tag(xml, "city")
    state = tag(xml, "stateOrCountryDescription")
    where = ", ".join(part for part in [city, state] if part)
    fund_type = tag(xml, "investmentFundType")
    date = row.get("activityDate") or row.get("sourceDate") or ""
    lines = [f"{row['firm']} filed Form D on {date}."]
    if fund_type:
        lines.append(f"Fund type on the form: {fund_type}.")
    if street or where:
        lines.append(f"Address: {', '.join(part for part in [street, where] if part)}")
    if number:
        lines.append(f"Phone: {number}")
    if names:
        lines.append("People named on the filing: " + "; ".join(names))
    lines.append("This is the fund's own filing, not a cheque range into startups.")
    adsh = target(row)
    lines.append(f"Source: SEC Form D {adsh[1] if adsh else ''}".rstrip())
    row["partner"] = names[0].split(",")[0] if names else row.get("partner")
    row["stages"] = []
    if where:
        geo = where.split(", ")[-1]
        row["geos"] = [part for part in [geo, "United States"] if part][:3]
    if fund_type:
        row["themes"] = [fund_type]
    row["excerpt"] = " ".join(lines[:3])
    row["files"] = [{"title": "Contact", "text": "\n".join(lines)}]
    row["note"] = "Public Form D. No email is on the form, so none is shown."


def main() -> None:
    payload = json.loads(OUT.read_text())
    jobs: list[tuple[str, dict, str, str]] = []
    for kind in ("investors", "startups"):
        for row in payload[kind]:
            if not needs(row):
                continue
            found = target(row)
            if not found:
                continue
            jobs.append((kind, row, found[0], found[1]))
            if len(jobs) >= CAP:
                break
        if len(jobs) >= CAP:
            break
    print("enrich", len(jobs), flush=True)

    def fetch(job: tuple[str, dict, str, str]) -> tuple[dict, str, str]:
        kind, row, cik, adsh = job
        return row, kind, get(xml_url(cik, adsh))

    done = 0
    filled = 0
    with ThreadPoolExecutor(WORKERS) as pool:
        futures = [pool.submit(fetch, job) for job in jobs]
        for future in as_completed(futures):
            row, kind, xml = future.result()
            done += 1
            if xml and tag(xml, "issuerPhoneNumber"):
                if kind == "startups":
                    apply_startup(row, xml)
                else:
                    apply_investor(row, xml)
                filled += 1
            if done % 400 == 0:
                OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
                print("checkpoint", done, "filled", filled, flush=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    phones = sum(1 for kind in ("startups", "investors") for row in payload[kind] if "Phone:" in json.dumps(row.get("files") or ""))
    print("done", done, "filled", filled, "phones", phones, OUT.stat().st_size, flush=True)


if __name__ == "__main__":
    main()
