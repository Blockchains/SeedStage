"""Read more Form D XML fields for operating issuers. No invented contacts.

Rate limit is 2 requests per second. Related-person street addresses are not stored.
Offering amount and amount sold are written as separate lines, including zero and Indefinite.
"""

from __future__ import annotations

import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock

ROOT = Path("/workspace")
OUT = ROOT / "src/lib/seedstage/sec-wave.json"
UA = {"User-Agent": "SeedStage research ismail@seedstage.si", "Accept": "application/xml"}
CAP = 1027
INTERVAL = 0.5

TECH = ("Computers", "Other Technology", "Biotechnology", "Pharmaceuticals", "Telecommunications", "Aerospace")


def get(url: str) -> str:
    request = urllib.request.Request(url, headers=UA)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read().decode("utf-8", "replace")
        except Exception:
            time.sleep(0.6 * (attempt + 1))
    return ""


def tag(xml: str, name: str) -> str:
    match = re.search(rf"<{name}>(.*?)</{name}>", xml, re.S)
    if not match:
        return ""
    return re.sub(r"\s+", " ", match.group(1)).strip()


def block(xml: str, name: str) -> str:
    match = re.search(rf"<{name}>(.*?)</{name}>", xml, re.S)
    return match.group(1) if match else ""


def money(value: str) -> str:
    if not value:
        return ""
    if value.lower() == "indefinite":
        return "Indefinite"
    try:
        amount = int(float(value))
    except ValueError:
        return ""
    return f"${amount:,.0f}"


def phone(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) == 10:
        return f"{digits[0:3]}-{digits[3:6]}-{digits[6:]}"
    return value.strip()


def people(xml: str) -> list[str]:
    found = []
    for person in re.findall(r"<relatedPersonInfo>(.*?)</relatedPersonInfo>", xml, re.S):
        first = tag(person, "firstName")
        middle = tag(person, "middleName")
        last = tag(person, "lastName")
        if first in {"", "N/A"} or last in {"", "N/A"}:
            continue
        if re.search(r"\b(L\.?P\.?|LLC|Fund|Partners)\b", last):
            continue
        roles = re.findall(r"<relationship>(.*?)</relationship>", person, re.S)
        role = ", ".join(re.sub(r"\s+", " ", item).strip() for item in roles if item.strip())
        name = " ".join(part for part in [first, middle, last] if part and part != "N/A")
        found.append(name + (f", {role}" if role else ""))
    return found[:6]


def securities(xml: str) -> str:
    box = block(xml, "typesOfSecuritiesOffered")
    flags = []
    for name, label in [
        ("isEquityType", "equity"),
        ("isDebtType", "debt"),
        ("isOptionToAcquireType", "option"),
        ("isSecurityToBeAcquiredType", "security to be acquired"),
        ("isPooledInvestmentFundType", "pooled investment fund"),
        ("isTenantInCommonType", "tenant in common"),
        ("isMineralPropertyType", "mineral property"),
        ("isOtherType", "other"),
    ]:
        if re.search(rf"<{name}>\s*true\s*</{name}>", box, re.I):
            flags.append(label)
    other = tag(box, "descriptionOfOtherType")
    if other:
        flags.append(f"other description: {other}")
    return "; ".join(flags)


def accession(url: str) -> tuple[str, str]:
    match = re.search(r"/data/(\d+)/(\d+)/(\d{10}-\d{2}-\d{6})-index", url)
    if not match:
        return "", ""
    return match.group(1), match.group(3)


def xml_url(cik: str, adsh: str) -> str:
    return f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{adsh.replace('-', '')}/primary_doc.xml"


def priority(row: dict) -> int:
    text = "\n".join(file.get("text", "") for file in row.get("files") or [])
    if "Revenue range as reported:" in text:
        return 9
    summary = row.get("summary") or ""
    if any(name in summary for name in TECH):
        return 0
    return 3


def describe(xml: str, row: dict) -> dict:
    issuer = block(xml, "primaryIssuer") or xml
    offering = block(xml, "offeringData") or xml
    industry = tag(offering, "industryGroupType") or tag(xml, "industryGroupType")
    revenue = tag(offering, "revenueRange")
    entity = tag(issuer, "entityType")
    jurisdiction = tag(issuer, "jurisdictionOfInc")
    year_block = block(issuer, "yearOfInc") or block(xml, "yearOfInc")
    year = tag(year_block, "value")
    timing = []
    if re.search(r"<withinFiveYears>\s*true", year_block, re.I):
        timing.append("within five years")
    if re.search(r"<overFiveYears>\s*true", year_block, re.I):
        timing.append("over five years")
    if re.search(r"<yetToBeFormed>\s*true", year_block, re.I):
        timing.append("yet to be formed")
    amendment = "yes" if re.search(r"<isAmendment>\s*true", xml, re.I) else "no"
    if re.search(r"<yetToOccur>\s*true", xml, re.I):
        first = "not yet occurred"
    else:
        first = tag(block(xml, "dateOfFirstSale"), "value") or "not reported"
    target = money(tag(offering, "totalOfferingAmount"))
    sold = money(tag(offering, "totalAmountSold"))
    remaining = money(tag(offering, "totalRemaining"))
    combination = "yes" if re.search(r"<isBusinessCombinationTransaction>\s*true", xml, re.I) else "no"
    securities_text = securities(offering)
    invested = tag(offering, "totalNumberAlreadyInvested")
    minimum = money(tag(offering, "minimumInvestmentAccepted"))
    exemptions = ", ".join(re.findall(r"<item>(.*?)</item>", block(offering, "federalExemptionsExclusions"), re.S))
    names = people(xml)
    street = ", ".join(part for part in [tag(issuer, "street1"), tag(issuer, "street2")] if part)
    city = tag(issuer, "city")
    state = tag(issuer, "stateOrCountryDescription")
    where = ", ".join(part for part in [city, state] if part)
    number = phone(tag(issuer, "issuerPhoneNumber"))
    adsh = accession(row.get("sourceUrl") or "")[1]
    lines = []
    if industry:
        lines.append(f"Industry as reported: {industry}")
    if entity:
        lines.append(f"Entity type: {entity}")
    if jurisdiction:
        lines.append(f"Jurisdiction: {jurisdiction}")
    if year:
        lines.append(f"Incorporation year as reported: {year}")
    if timing:
        lines.append("Incorporation timing: " + "; ".join(timing))
    if revenue:
        lines.append(f"Revenue range as reported: {revenue}")
    lines.append(f"Amendment: {amendment}")
    lines.append(f"First sale: {first}")
    if target:
        lines.append(f"Offering amount: {target}")
    if sold:
        lines.append(f"Amount sold: {sold}")
    if remaining:
        lines.append(f"Amount remaining: {remaining}")
    if securities_text:
        lines.append(f"Securities as reported: {securities_text}")
    if invested:
        lines.append(f"Investors already invested (count only): {invested}")
    if minimum:
        lines.append(f"Minimum accepted on the filing: {minimum}")
    if exemptions:
        lines.append(f"Federal exemptions: {exemptions}")
    lines.append(f"Business combination: {combination}")
    if names:
        lines.append("People named on the filing: " + "; ".join(names))
    if street or where:
        lines.append("Issuer address: " + ", ".join(part for part in [street, where] if part))
    if number:
        lines.append(f"Phone: {number}")
    lines.append("This notice does not name the outside investors.")
    if adsh:
        lines.append(f"Source: SEC Form D {adsh}")
    summary_bits = [part for part in [industry, f"Offering {target}" if target else "", where, f"Filed {row.get('summary', '')[-10:]}"] if part]
    filed = re.search(r"Filed (\d{4}-\d{2}-\d{2})", row.get("summary") or "")
    if filed:
        summary_bits = [part for part in [industry, f"Offering {target}" if target else "", where, f"Filed {filed.group(1)}"] if part]
    return {
        "summary": " ".join(summary_bits) or row.get("summary"),
        "round": target or None,
        "person": names[0] if names else row.get("person"),
        "files": [{"title": "Corporate contact", "text": "\n".join(lines)}],
    }


def main() -> None:
    payload = json.loads(OUT.read_text())
    for row in payload["startups"]:
        for file in row.get("files") or []:
            file["text"] = file.get("text", "").replace("Related-person street addresses are not stored.\n", "")
    ranked = sorted(enumerate(payload["startups"]), key=lambda item: (priority(item[1]), item[0]))
    chosen = [item for item in ranked if priority(item[1]) < 9][:CAP]
    print("deepen", len(chosen), flush=True)
    gate = Lock()
    write = Lock()
    state = {"next": time.monotonic(), "filled": 0, "done": 0}

    def once(item: tuple[int, dict]) -> None:
        position, row = item
        with gate:
            now = time.monotonic()
            start = max(now, state["next"])
            state["next"] = start + INTERVAL
        delay = start - time.monotonic()
        if delay > 0:
            time.sleep(delay)
        cik, adsh = accession(row.get("sourceUrl") or "")
        if not cik or not adsh:
            return
        xml = get(xml_url(cik, adsh))
        if not xml or "<edgarSubmission" not in xml:
            return
        update = describe(xml, row)
        with write:
            payload["startups"][position] = {**row, **update}
            state["filled"] += 1

    with ThreadPoolExecutor(4) as pool:
        futures = [pool.submit(once, item) for item in chosen]
        for future in as_completed(futures):
            future.result()
            with write:
                state["done"] += 1
                done = state["done"]
                if done % 100 == 0:
                    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
                    print("checkpoint", done, "filled", state["filled"], flush=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    print("done", len(chosen), "filled", state["filled"], OUT.stat().st_size, flush=True)


if __name__ == "__main__":
    main()
