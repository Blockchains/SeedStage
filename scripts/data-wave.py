#!/usr/bin/env python3
"""Add data companies and data investors that return a real site icon and a real description."""

import importlib.util
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin

spec = importlib.util.spec_from_file_location("fd", "/workspace/scripts/fetch-directory.py")
fd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fd)

GEN = Path("/workspace/src/lib/seedstage/directory.generated.ts")

FUNDS = [
    ("amplify", "Amplify Partners", "https://www.amplifypartners.com/", ["United States"]),
    ("wingvc", "Wing Venture Partners", "https://www.wing.vc/", ["United States"]),
    ("crv", "CRV", "https://www.crv.com/", ["United States"]),
    ("theoryvc", "Theory Ventures", "https://theoryvc.com/", ["United States"]),
    ("decibel", "Decibel", "https://www.decibel.vc/", ["United States"]),
    ("unusual", "Unusual Ventures", "https://www.unusual.vc/", ["United States"]),
    ("heavybit", "Heavybit", "https://www.heavybit.com/", ["United States"]),
    ("workbench", "Work-Bench", "https://www.work-bench.com/", ["United States"]),
    ("rootvc", "Root Ventures", "https://root.vc/", ["United States"]),
    ("racecap", "Race Capital", "https://race.capital/", ["United States"]),
    ("cranevc", "Crane Venture Partners", "https://www.crane.vc/", ["United Kingdom"]),
    ("dawncap", "Dawn Capital", "https://www.dawncapital.com/", ["United Kingdom", "Europe"]),
    ("notioncap", "Notion Capital", "https://www.notion.vc/", ["United Kingdom", "Europe"]),
    ("pointnine", "Point Nine", "https://www.pointnine.com/", ["Europe"]),
    ("firstmark", "FirstMark", "https://firstmark.com/", ["United States"]),
    ("twosigma", "Two Sigma Ventures", "https://www.twosigmaventures.com/", ["United States"]),
    ("sapphire", "Sapphire Ventures", "https://sapphireventures.com/", ["United States"]),
    ("signalfire", "SignalFire", "https://signalfire.com/", ["United States"]),
    ("coatue", "Coatue", "https://www.coatue.com/", ["United States"]),
    ("thrivecap", "Thrive Capital", "https://thrivecap.com/", ["United States"]),
    ("gradient", "Gradient Ventures", "https://www.gradient.com/", ["United States"]),
    ("zetta", "Zetta Venture Partners", "https://www.zettavp.com/", ["United States"]),
    ("essencevc", "Essence VC", "https://www.essence.vc/", ["United States"]),
    ("delltechcap", "Dell Technologies Capital", "https://www.delltechnologiescapital.com/", ["United States"]),
    ("gv", "GV", "https://www.gv.com/", ["United States"]),
    ("sutterhill", "Sutter Hill Ventures", "https://www.shv.com/", ["United States"]),
    ("engineeringcap", "Engineering Capital", "https://www.engineeringcapital.com/", ["United States"]),
    ("caffeinated", "Caffeinated Capital", "https://caffeinatedcapital.com/", ["United States"]),
    ("haystack", "Haystack", "https://haystack.vc/", ["United States"]),
    ("acrew", "Acrew Capital", "https://www.acrewcapital.com/", ["United States"]),
    ("meritech", "Meritech", "https://www.meritechcapital.com/", ["United States"]),
    ("ivp", "IVP", "https://www.ivp.com/", ["United States"]),
    ("glasswing", "Glasswing Ventures", "https://glasswing.vc/", ["United States"]),
    ("bloombergbeta", "Bloomberg Beta", "https://www.bloombergbeta.com/", ["United States"]),
    ("truevc", "True Ventures", "https://trueventures.com/", ["United States"]),
    ("shasta", "Shasta Ventures", "https://www.shastaventures.com/", ["United States"]),
    ("openview", "OpenView", "https://openviewpartners.com/", ["United States"]),
    ("ai2inc", "AI2 Incubator", "https://www.ai2incubator.com/", ["United States"]),
    ("aixvc", "AIX Ventures", "https://www.aixventures.com/", ["United States"]),
    ("housefund", "The House Fund", "https://www.thehouse.fund/", ["United States"]),
    ("episode1", "Episode 1", "https://www.episode1.com/", ["United Kingdom"]),
    ("ridgevc", "Ridge Ventures", "https://ridge.vc/", ["United States"]),
    ("four06", "406 Ventures", "https://www.406ventures.com/", ["United States"]),
    ("pslventures", "PSL Ventures", "https://www.psl.com/", ["United States"]),
]

STARTUPS = [
    ("motherduck", "MotherDuck", "https://motherduck.com/", "Early"),
    ("tinybird", "Tinybird", "https://www.tinybird.co/", "Early"),
    ("materialize", "Materialize", "https://materialize.com/", "Early"),
    ("estuary", "Estuary", "https://estuary.dev/", "Seed"),
    ("rilldata", "Rill", "https://www.rilldata.com/", "Seed"),
    ("evidencedev", "Evidence", "https://evidence.dev/", "Seed"),
    ("hextech", "Hex", "https://hex.tech/", "Early"),
    ("modeanalytics", "Mode", "https://mode.com/", "Early"),
    ("omnico", "Omni", "https://omni.co/", "Seed"),
    ("countco", "Count", "https://count.co/", "Seed"),
    ("metabase", "Metabase", "https://www.metabase.com/", "Early"),
    ("lightdash", "Lightdash", "https://www.lightdash.com/", "Seed"),
    ("presetio", "Preset", "https://preset.io/", "Early"),
    ("cubedev", "Cube", "https://cube.dev/", "Early"),
    ("atlan", "Atlan", "https://atlan.com/", "Early"),
    ("alation", "Alation", "https://www.alation.com/", "Early"),
    ("collibra", "Collibra", "https://www.collibra.com/", "Early"),
    ("montecarlo", "Monte Carlo", "https://www.montecarlodata.com/", "Early"),
    ("secoda", "Secoda", "https://www.secoda.co/", "Seed"),
    ("castordoc", "CastorDoc", "https://www.castordoc.com/", "Seed"),
    ("openmetadata", "OpenMetadata", "https://open-metadata.org/", "Early"),
    ("astronomer", "Astronomer", "https://www.astronomer.io/", "Early"),
    ("dagster", "Dagster", "https://dagster.io/", "Early"),
    ("prefect", "Prefect", "https://www.prefect.io/", "Early"),
    ("mageai", "Mage", "https://www.mage.ai/", "Seed"),
    ("keboola", "Keboola", "https://www.keboola.com/", "Early"),
    ("matillion", "Matillion", "https://www.matillion.com/", "Early"),
    ("hevodata", "Hevo", "https://hevodata.com/", "Early"),
    ("portableio", "Portable", "https://portable.io/", "Seed"),
    ("meltano", "Meltano", "https://meltano.com/", "Early"),
    ("dlthub", "dltHub", "https://dlthub.com/", "Seed"),
    ("bruin", "Bruin", "https://getbruin.com/", "Seed"),
    ("paradime", "Paradime", "https://www.paradime.io/", "Seed"),
    ("mozartdata", "Mozart Data", "https://www.mozartdata.com/", "Seed"),
    ("holistics", "Holistics", "https://www.holistics.io/", "Early"),
    ("steepapp", "Steep", "https://www.steep.app/", "Seed"),
    ("equalsapp", "Equals", "https://equals.com/", "Seed"),
    ("rowsapp", "Rows", "https://rows.com/", "Early"),
    ("posthog", "PostHog", "https://posthog.com/", "Early"),
    ("rudderstack", "RudderStack", "https://www.rudderstack.com/", "Early"),
    ("snowplow", "Snowplow", "https://snowplow.io/", "Early"),
    ("avoapp", "Avo", "https://www.avo.app/", "Seed"),
    ("jitsu", "Jitsu", "https://www.jitsu.com/", "Seed"),
    ("honeycomb", "Honeycomb", "https://www.honeycomb.io/", "Early"),
    ("cribl", "Cribl", "https://cribl.io/", "Early"),
    ("observeinc", "Observe", "https://www.observeinc.com/", "Early"),
    ("anomalo", "Anomalo", "https://www.anomalo.com/", "Seed"),
    ("datafold", "Datafold", "https://www.datafold.com/", "Seed"),
    ("sifflet", "Sifflet", "https://www.siffletdata.com/", "Seed"),
    ("tobiko", "Tobiko", "https://www.tobikodata.com/", "Seed"),
    ("coalesceio", "Coalesce", "https://coalesce.io/", "Early"),
    ("qdrant", "Qdrant", "https://qdrant.tech/", "Seed"),
    ("zilliz", "Zilliz", "https://zilliz.com/", "Early"),
    ("lancedb", "LanceDB", "https://lancedb.com/", "Seed"),
    ("turbopuffer", "turbopuffer", "https://turbopuffer.com/", "Seed"),
    ("timescale", "Timescale", "https://www.timescale.com/", "Early"),
    ("questdb", "QuestDB", "https://questdb.io/", "Seed"),
    ("influxdata", "InfluxData", "https://www.influxdata.com/", "Early"),
    ("risingwave", "RisingWave", "https://risingwave.com/", "Seed"),
    ("redpanda", "Redpanda", "https://redpanda.com/", "Early"),
    ("confluent", "Confluent", "https://www.confluent.io/", "Early"),
    ("bufbuild", "Buf", "https://buf.build/", "Early"),
    ("aiven", "Aiven", "https://aiven.io/", "Early"),
    ("niledb", "Nile", "https://www.thenile.dev/", "Seed"),
    ("xata", "Xata", "https://xata.io/", "Seed"),
    ("prisma", "Prisma", "https://www.prisma.io/", "Early"),
    ("hasura", "Hasura", "https://hasura.io/", "Early"),
    ("geldata", "Gel", "https://geldata.com/", "Early"),
    ("surrealdb", "SurrealDB", "https://surrealdb.com/", "Seed"),
    ("cockroach", "Cockroach Labs", "https://www.cockroachlabs.com/", "Early"),
    ("yugabyte", "Yugabyte", "https://www.yugabyte.com/", "Early"),
    ("scylladb", "ScyllaDB", "https://www.scylladb.com/", "Early"),
    ("starburst", "Starburst", "https://www.starburst.io/", "Early"),
    ("dremio", "Dremio", "https://www.dremio.com/", "Early"),
    ("firebolt", "Firebolt", "https://www.firebolt.io/", "Early"),
    ("databricks", "Databricks", "https://www.databricks.com/", "Early"),
    ("snowflake", "Snowflake", "https://www.snowflake.com/", "Early"),
    ("onehouse", "Onehouse", "https://www.onehouse.ai/", "Seed"),
    ("immuta", "Immuta", "https://www.immuta.com/", "Early"),
    ("bigid", "BigID", "https://bigid.com/", "Early"),
    ("tonicai", "Tonic.ai", "https://www.tonic.ai/", "Seed"),
    ("gretel", "Gretel", "https://gretel.ai/", "Seed"),
    ("snorkel", "Snorkel", "https://snorkel.ai/", "Early"),
    ("labelbox", "Labelbox", "https://labelbox.com/", "Early"),
    ("v7labs", "V7", "https://www.v7labs.com/", "Seed"),
    ("encord", "Encord", "https://encord.com/", "Seed"),
    ("cleanlab", "Cleanlab", "https://cleanlab.ai/", "Seed"),
    ("voxel51", "Voxel51", "https://voxel51.com/", "Seed"),
    ("activeloop", "Activeloop", "https://www.activeloop.ai/", "Seed"),
    ("huggingface", "Hugging Face", "https://huggingface.co/", "Early"),
    ("wandb", "Weights & Biases", "https://wandb.ai/", "Early"),
    ("arize", "Arize", "https://arize.com/", "Early"),
    ("whylabs", "WhyLabs", "https://whylabs.ai/", "Seed"),
    ("fiddler", "Fiddler", "https://www.fiddler.ai/", "Early"),
    ("rungalileo", "Galileo", "https://www.rungalileo.io/", "Seed"),
    ("unstructured", "Unstructured", "https://unstructured.io/", "Seed"),
    ("reducto", "Reducto", "https://reducto.ai/", "Seed"),
    ("vectara", "Vectara", "https://vectara.com/", "Seed"),
    ("crunchydata", "Crunchy Data", "https://www.crunchydata.com/", "Early"),
    ("planetscale", "PlanetScale", "https://planetscale.com/", "Early"),
    ("convexdev", "Convex", "https://www.convex.dev/", "Seed"),
    ("census", "Census", "https://www.getcensus.com/", "Early"),
    ("hightouch", "Hightouch", "https://hightouch.com/", "Early"),
    ("bigeye", "Bigeye", "https://www.bigeye.com/", "Seed"),
    ("metaplane", "Metaplane", "https://www.metaplane.dev/", "Seed"),
    ("gxdata", "GX", "https://greatexpectations.io/", "Early"),
    ("selectstar", "Select Star", "https://www.selectstar.com/", "Seed"),
    ("elementary", "Elementary", "https://www.elementary-data.com/", "Seed"),
    ("synqio", "SYNQ", "https://www.synq.io/", "Seed"),
    ("validio", "Validio", "https://www.validio.io/", "Seed"),
    ("acceldata", "Acceldata", "https://www.acceldata.io/", "Early"),
    ("lightup", "Lightup", "https://www.lightup.ai/", "Seed"),
    ("freshpaint", "Freshpaint", "https://www.freshpaint.io/", "Seed"),
    ("mparticle", "mParticle", "https://www.mparticle.com/", "Early"),
    ("segment", "Segment", "https://segment.com/", "Early"),
    ("amplitude", "Amplitude", "https://amplitude.com/", "Early"),
    ("mixpanel", "Mixpanel", "https://mixpanel.com/", "Early"),
    ("heap", "Heap", "https://www.heap.io/", "Early"),
    ("grafana", "Grafana Labs", "https://grafana.com/", "Early"),
    ("chronosphere", "Chronosphere", "https://chronosphere.io/", "Early"),
    ("edgedelta", "Edge Delta", "https://edgedelta.com/", "Seed"),
    ("mezmo", "Mezmo", "https://www.mezmo.com/", "Early"),
    ("warpstream", "WarpStream", "https://www.warpstream.com/", "Seed"),
    ("tembo", "Tembo", "https://www.tembo.io/", "Seed"),
    ("ferretdb", "FerretDB", "https://www.ferretdb.com/", "Seed"),
    ("memgraph", "Memgraph", "https://memgraph.com/", "Seed"),
    ("neo4j", "Neo4j", "https://neo4j.com/", "Early"),
    ("puppygraph", "PuppyGraph", "https://www.puppygraph.com/", "Seed"),
    ("singlestore", "SingleStore", "https://www.singlestore.com/", "Early"),
    ("marqo", "Marqo", "https://www.marqo.ai/", "Seed"),
    ("vespa", "Vespa", "https://vespa.ai/", "Early"),
    ("cometml", "Comet", "https://www.comet.com/", "Early"),
    ("neptuneai", "neptune.ai", "https://neptune.ai/", "Seed"),
    ("patronus", "Patronus", "https://www.patronus.ai/", "Seed"),
    ("superannotate", "SuperAnnotate", "https://www.superannotate.com/", "Seed"),
    ("scaleai", "Scale", "https://scale.com/", "Early"),
    ("mostlyai", "Mostly AI", "https://mostly.ai/", "Seed"),
    ("synthesized", "Synthesized", "https://www.synthesized.io/", "Seed"),
    ("dataworld", "data.world", "https://data.world/", "Early"),
    ("upsolver", "Upsolver", "https://www.upsolver.com/", "Early"),
    ("privacera", "Privacera", "https://privacera.com/", "Early"),
    ("k2view", "K2view", "https://www.k2view.com/", "Early"),
    ("recce", "Recce", "https://datarecce.io/", "Seed"),
    ("definite", "Definite", "https://www.definite.app/", "Seed"),
    ("polytomic", "Polytomic", "https://www.polytomic.com/", "Seed"),
    ("y42", "Y42", "https://www.y42.com/", "Seed"),
    ("narrator", "Narrator", "https://www.narrator.ai/", "Seed"),
    ("dbtcloud", "dbt", "https://www.getdbt.com/", "Early"),
]


def existing():
    ids, names = set(), set()
    blobs = [GEN.read_text()]
    for path in ("/workspace/src/lib/seedstage/public-investors.ts", "/workspace/src/lib/seedstage/startups.ts"):
        blobs.append(Path(path).read_text())
    for blob in blobs:
        ids.update(re.findall(r'id: "([^"]+)"', blob))
        for raw in re.findall(r'(?:firm|name): ("(?:\\.|[^"\\])*")', blob):
            names.add(json.loads(raw).lower())
    return ids, names


def extra_text(url, summary):
    try:
        raw, final, _ = fd.get(url, timeout=10, limit=180_000)
    except Exception:
        return None
    html = raw.decode("utf-8", "ignore")
    links = []
    for href in re.findall(r'href=["\']([^"\']+)["\']', html, re.I):
        link = urljoin(final, href).split("#")[0]
        if re.search(r"/(about|company|product)(/|$)", link, re.I) and link.rstrip("/") != final.rstrip("/"):
            links.append(link)
            break
    target = links[0] if links else urljoin(final, "/about")
    try:
        raw, _, _ = fd.get(target, timeout=8, limit=180_000)
        page = raw.decode("utf-8", "ignore")
    except Exception:
        page = html
    parts = []
    for para in re.findall(r"<p[^>]*>([\s\S]*?)</p>", page, re.I):
        text = fd.clean(re.sub(r"<[^>]+>", " ", para))
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) < 140 or "cookie" in text.lower() or text in summary:
            continue
        parts.append(text)
        if sum(len(p) for p in parts) > 900:
            break
    body = " ".join(parts)[:1000].strip()
    if len(body) < 140:
        return None
    return body


def main():
    have, names = existing()
    funds, startups = [], []
    rows_f = [row for row in FUNDS if row[0] not in have and row[1].lower() not in names]
    rows_s = [row for row in STARTUPS if row[0] not in have and row[1].lower() not in names]
    print("try", len(rows_f), "funds", len(rows_s), "startups")
    with ThreadPoolExecutor(12) as pool:
        futs = [pool.submit(fd.one_fund, row) for row in rows_f]
        futs += [pool.submit(fd.one_startup, (*row, "")) for row in rows_s]
        for fut in as_completed(futs):
            kind, fid, rec, status = fut.result()
            if not rec:
                print("skip", kind, fid, status)
                continue
            print("ok", kind, fid)
            (funds if kind == "fund" else startups).append(rec)

    pages = {}
    targets = [(item["url"], item["excerpt"], item["id"]) for item in funds] + [(item["website"], item["summary"], item["id"]) for item in startups]
    with ThreadPoolExecutor(12) as pool:
        futs = {pool.submit(extra_text, url, summary): fid for url, summary, fid in targets}
        for fut in as_completed(futs):
            text = fut.result()
            if text:
                pages[futs[fut]] = text
    print("extra pages", len(pages))

    text = GEN.read_text()
    fund_chunks = []
    for firm in funds:
        if firm["id"] in have or firm["firm"].lower() in names:
            continue
        files = ""
        if firm["id"] in pages:
            files = f"    files: [{json.dumps({'title': 'About', 'text': pages[firm['id']]}, ensure_ascii=False)}],\n"
        fund_chunks.append(
            "  {\n"
            f"    id: {json.dumps(firm['id'])},\n"
            f"    firm: {json.dumps(firm['firm'])},\n"
            f"    fund: {json.dumps(firm['firm'])},\n"
            "    partner: null,\n"
            '    stages: ["seed"],\n'
            f"    geos: {json.dumps(firm['geos'])},\n"
            "    geoExclusions: [],\n"
            "    sectors: [],\n"
            "    sectorExclusions: [],\n"
            "    sectorExclusive: false,\n"
            "    chequeMinMinor: 0,\n"
            "    chequeMaxMinor: 0,\n"
            '    participation: "unstated",\n'
            '    themes: ["Data"],\n'
            "    portfolio: [],\n"
            "    activityDate: null,\n"
            '    source: "Company site",\n'
            f"    sourceUrl: {json.dumps(firm['url'])},\n"
            '    sourceDate: "2026-11-21",\n'
            f"    excerpt: {json.dumps(firm['excerpt'], ensure_ascii=False)},\n"
            f"{files}"
            '    note: "",\n'
            f"    logo: {json.dumps(firm['logo'])},\n"
            "    synthetic: false,\n"
            "    confirmed: false,\n"
            '    currency: "USD",\n'
            "  }"
        )
    startup_chunks = []
    for company in startups:
        if company["id"] in have or company["name"].lower() in names:
            continue
        files = ""
        if company["id"] in pages:
            files = f"    files: [{json.dumps({'title': 'About', 'text': pages[company['id']]}, ensure_ascii=False)}],\n"
        startup_chunks.append(
            "  {\n"
            f"    id: {json.dumps(company['id'])},\n"
            f"    name: {json.dumps(company['name'])},\n"
            f"    website: {json.dumps(company['website'])},\n"
            f"    logo: {json.dumps(company['logo'])},\n"
            f"    stage: {json.dumps(company['stage'])},\n"
            "    round: null,\n"
            f"    summary: {json.dumps(company['summary'], ensure_ascii=False)},\n"
            "    person: null,\n"
            '    funder: "",\n'
            '    source: "Company site",\n'
            f"    sourceUrl: {json.dumps(company['website'])},\n"
            f"{files}"
            "  }"
        )
    if fund_chunks:
        text = text.replace(
            "\n];\n\nexport const extraStartups",
            ",\n" + ",\n".join(fund_chunks) + "\n];\n\nexport const extraStartups",
            1,
        )
    if startup_chunks:
        text = text.rstrip()
        if not text.endswith("];"):
            raise SystemExit("unexpected ending")
        text = text[:-2] + ",\n" + ",\n".join(startup_chunks) + "\n];\n"
    GEN.write_text(text)
    print("ADDED", len(fund_chunks), "funds", len(startup_chunks), "startups")


if __name__ == "__main__":
    main()
