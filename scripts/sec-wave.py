"""Pull public SEC Form D issuers into sec-wave.json. No invented contacts."""

from __future__ import annotations

import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path("/workspace")
OUT = ROOT / "src/lib/seedstage/sec-wave.json"
UA = {"User-Agent": "SeedStage research ismail@seedstage.si", "Accept": "application/json"}
STARTUP_CAP = 55000
INVESTOR_CAP = 3200
XML_CAP = 4500

STATES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado",
    "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts",
    "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana",
    "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico",
    "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota",
    "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
}


def get(url: str, accept: str | None = None) -> bytes:
    headers = dict(UA)
    if accept:
        headers["Accept"] = accept
    request = urllib.request.Request(url, headers=headers)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read()
        except Exception:
            time.sleep(0.6 * (attempt + 1))
    return b""


def search(start: str, end: str, frm: int) -> dict:
    url = f"https://efts.sec.gov/LATEST/search-index?forms=D&dateRange=custom&startdt={start}&enddt={end}&from={frm}"
    raw = get(url)
    if not raw:
        return {}
    return json.loads(raw)


def months() -> list[tuple[str, str]]:
    out = []
    year, month = 2026, 11
    while (year, month) >= (2023, 1):
        start = f"{year:04d}-{month:02d}-01"
        if month == 12:
            end = f"{year:04d}-12-31"
        else:
            end = f"{year:04d}-{month+1:02d}-01"
        if year == 2026 and month == 11:
            end = "2026-11-24"
        out.append((start, end))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return out


def clean_name(value: str) -> str:
    name = re.sub(r"\s+\(CIK\s+\d+\)\s*$", "", value).strip()
    return re.sub(r"\s+", " ", name)


def skip_name(name: str) -> bool:
    low = name.lower()
    return low.startswith("series ") or "a series of" in low or "test issuer" in low


def looks_like_fund(name: str) -> bool:
    low = f" {name.lower()} "
    if re.search(r"\b(inc|corp|corporation|ltd|plc|gmbh)\b", low):
        return False
    return bool(re.search(r"\b(venture|ventures|capital|fund|partners)\b", low))


def filing_url(cik: str, adsh: str) -> str:
    return f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{adsh.replace('-', '')}/{adsh}-index.html"


def xml_url(cik: str, adsh: str) -> str:
    return f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{adsh.replace('-', '')}/primary_doc.xml"


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


def place(hit: dict, xml: str) -> str:
    city = tag(xml, "city")
    state = tag(xml, "stateOrCountryDescription") or STATES.get(tag(xml, "stateOrCountry"), "")
    if city and state:
        return f"{city}, {state}"
    locations = hit.get("biz_locations") or []
    return locations[0] if locations else ""


def collect() -> dict[str, dict]:
    found: dict[str, dict] = {}
    for start, end in months():
        frm = 0
        total = None
        while total is None or frm < total:
            page = search(start, end, frm)
            hits = page.get("hits", {}).get("hits", [])
            if total is None:
                total = page.get("hits", {}).get("total", {}).get("value", 0)
                print(f"{start} {total}", flush=True)
            if not hits:
                break
            for item in hits:
                source = item.get("_source") or {}
                cik = (source.get("ciks") or [""])[0]
                name = clean_name((source.get("display_names") or [""])[0])
                adsh = source.get("adsh") or ""
                if not cik or not name or not adsh or skip_name(name):
                    continue
                previous = found.get(cik)
                if previous and previous["date"] >= source.get("file_date", ""):
                    continue
                found[cik] = {
                    "cik": cik,
                    "name": name,
                    "adsh": adsh,
                    "date": source.get("file_date") or "",
                    "locations": source.get("biz_locations") or [],
                    "fund": looks_like_fund(name),
                }
            frm += len(hits)
            if frm >= 10000:
                break
            time.sleep(0.12)
    return found


def read_xml(row: dict) -> tuple[str, str]:
    raw = get(xml_url(row["cik"], row["adsh"]), "application/xml")
    return row["cik"], raw.decode("utf-8", "replace") if raw else ""


def main() -> None:
    rows = collect()
    investors = [row for row in rows.values() if row["fund"]]
    startups = [row for row in rows.values() if not row["fund"]]
    investors.sort(key=lambda row: row["date"], reverse=True)
    startups.sort(key=lambda row: row["date"], reverse=True)
    investors = investors[:INVESTOR_CAP]
    startups = startups[:STARTUP_CAP]
    print("unique", len(rows), "funds", len(investors), "companies", len(startups), flush=True)
    chosen = investors[:2000] + startups[:2500]
    xmls: dict[str, str] = {}
    with ThreadPoolExecutor(6) as pool:
        futures = [pool.submit(read_xml, row) for row in chosen[:XML_CAP]]
        done = 0
        for future in as_completed(futures):
            cik, xml = future.result()
            if xml:
                xmls[cik] = xml
            done += 1
            if done % 250 == 0:
                print("xml", done, flush=True)

    def startup_record(row: dict) -> dict:
        xml = xmls.get(row["cik"], "")
        where = place(row, xml)
        offering = money(tag(xml, "totalOfferingAmount"))
        sold = money(tag(xml, "totalAmountSold"))
        phone = tag(xml, "issuerPhoneNumber")
        street = tag(xml, "street1")
        industry = tag(xml, "industryGroupType")
        names = people(xml)
        summary = " ".join(part for part in [industry, f"Offering {offering}" if offering else "", where, f"Filed {row['date']}"] if part)
        contact = []
        if street or where:
            contact.append(f"Address: {', '.join(part for part in [street, where] if part)}")
        if phone:
            contact.append(f"Phone: {phone}")
        if names:
            contact.append("People named on the filing: " + "; ".join(names))
        if sold:
            contact.append(f"Amount sold on the filing: {sold}")
        contact.append(f"Source: SEC Form D {row['adsh']}")
        text = "\n".join(contact)
        return {
            "id": f"sec-{int(row['cik'])}",
            "name": row["name"],
            "website": filing_url(row["cik"], row["adsh"]),
            "logo": "",
            "stage": "Early",
            "round": offering or None,
            "summary": summary or f"SEC Form D filing {row['date']}.",
            "person": names[0] if names else None,
            "funder": "",
            "source": "SEC Form D",
            "sourceUrl": filing_url(row["cik"], row["adsh"]),
            "files": [{"title": "Corporate contact", "text": text}],
        }

    def investor_record(row: dict) -> dict:
        xml = xmls.get(row["cik"], "")
        where = place(row, xml)
        phone = tag(xml, "issuerPhoneNumber")
        street = tag(xml, "street1")
        fund_type = tag(xml, "investmentFundType")
        names = people(xml)
        state = STATES.get((row["locations"][0].split(", ")[-1] if row["locations"] else ""), "")
        geos = [part for part in [where.split(", ")[-1] if where else state, "United States"] if part]
        lines = [f"{row['name']} filed Form D on {row['date']}."]
        if fund_type:
            lines.append(f"Fund type on the form: {fund_type}.")
        if street or where:
            lines.append(f"Address: {', '.join(part for part in [street, where] if part)}")
        if phone:
            lines.append(f"Phone: {phone}")
        if names:
            lines.append("People named on the filing: " + "; ".join(names))
        lines.append("This is the fund's own filing, not a cheque range into startups.")
        lines.append(f"Source: SEC Form D {row['adsh']}")
        return {
            "id": f"sec-{int(row['cik'])}",
            "firm": row["name"],
            "fund": row["name"],
            "partner": names[0].split(",")[0] if names else None,
            "stages": ["venture"] if fund_type == "Venture Capital Fund" else [],
            "geos": geos[:3],
            "geoExclusions": [],
            "sectors": [],
            "sectorExclusions": [],
            "sectorExclusive": False,
            "chequeMinMinor": 0,
            "chequeMaxMinor": 0,
            "participation": "unstated",
            "themes": [fund_type] if fund_type else [],
            "portfolio": [],
            "activityDate": row["date"] or None,
            "source": "SEC Form D",
            "sourceUrl": filing_url(row["cik"], row["adsh"]),
            "sourceDate": row["date"] or "2026-11-24",
            "excerpt": " ".join(lines[:3]),
            "files": [{"title": "Contact", "text": "\n".join(lines)}],
            "note": "Public Form D. No email is on the form, so none is shown.",
            "logo": "",
            "synthetic": False,
            "confirmed": False,
            "currency": "USD",
        }

    payload = {
        "startups": [startup_record(row) for row in startups],
        "investors": [investor_record(row) for row in investors],
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    phones = sum(1 for row in payload["startups"] + payload["investors"] if "Phone:" in json.dumps(row))
    print("wrote", len(payload["startups"]), len(payload["investors"]), "with phone text", phones, OUT.stat().st_size, flush=True)


if __name__ == "__main__":
    main()
