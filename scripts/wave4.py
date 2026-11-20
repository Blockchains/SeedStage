#!/usr/bin/env python3
"""Add more firms and companies. Keep a record only with a real icon and the site's own description."""

import importlib.util
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

spec = importlib.util.spec_from_file_location("fd", "/workspace/scripts/fetch-directory.py")
fd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fd)
GEN = Path("/workspace/src/lib/seedstage/directory.generated.ts")

FUNDS = [
    ("kleiner", "Kleiner Perkins", "https://www.kleinerperkins.com/", ["United States"]),
    ("ivp", "IVP", "https://www.ivp.com/", ["United States"]),
    ("tcv", "TCV", "https://www.tcv.com/", ["United States"]),
    ("iconiq", "ICONIQ", "https://www.iconiqcapital.com/", ["United States"]),
    ("baincv", "Bain Capital Ventures", "https://www.baincapitalventures.com/", ["United States"]),
    ("capitalg", "CapitalG", "https://www.capitalg.com/", ["United States"]),
    ("crv", "CRV", "https://www.crv.com/", ["United States"]),
    ("dfj", "DFJ", "https://www.dfj.com/", ["United States"]),
    ("matrix", "Matrix", "https://www.matrixpartners.com/", ["United States"]),
    ("vision", "Vision Fund", "https://www.visionfund.com/", ["United States", "Asia", "Europe"]),
    ("softbank", "SoftBank", "https://www.softbank.com/", ["Japan", "United States"]),
    ("prosus", "Prosus", "https://www.prosus.com/", ["Europe"]),
    ("kinnevik", "Kinnevik", "https://www.kinnevik.com/", ["Europe"]),
    ("rocket", "Rocket Internet", "https://www.rocketinternet.com/", ["Europe"]),
    ("eqt", "EQT", "https://www.eqtgroup.com/", ["Europe"]),
    ("hg", "Hg", "https://hgcapital.com/", ["Europe", "United Kingdom"]),
    ("permira", "Permira", "https://www.permira.com/", ["Europe", "United Kingdom"]),
    ("cinven", "Cinven", "https://www.cinven.com/", ["Europe", "United Kingdom"]),
    ("apax", "Apax", "https://www.apax.com/", ["Europe", "United Kingdom"]),
    ("kkr", "KKR", "https://www.kkr.com/", ["United States"]),
    ("blackstone", "Blackstone", "https://www.blackstone.com/", ["United States"]),
    ("carlyle", "Carlyle", "https://www.carlyle.com/", ["United States"]),
    ("warburg", "Warburg Pincus", "https://www.warburgpincus.com/", ["United States"]),
    ("atlantic", "General Atlantic", "https://www.generalatlantic.com/", ["United States"]),
    ("thoma", "Thoma Bravo", "https://www.thomabravo.com/", ["United States"]),
    ("vista", "Vista", "https://www.vistaequitypartners.com/", ["United States"]),
    ("advent", "Advent", "https://www.adventinternational.com/", ["United States", "Europe"]),
    ("summit", "Summit Partners", "https://www.summitpartners.com/", ["United States"]),
    ("jmi", "JMI", "https://www.jmi.com/", ["United States"]),
    ("dragoneer", "Dragoneer", "https://www.dragoneer.com/", ["United States"]),
    ("baillie", "Baillie Gifford", "https://www.bailliegifford.com/", ["United Kingdom"]),
    ("ardian", "Ardian", "https://www.ardian.com/", ["Europe"]),
    ("tikehau", "Tikehau", "https://www.tikehaucapital.com/", ["Europe"]),
    ("temasek", "Temasek", "https://www.temasek.com.sg/", ["Asia"]),
    ("gic", "GIC", "https://www.gic.com.sg/", ["Asia"]),
    ("mubadala", "Mubadala", "https://www.mubadala.com/", ["Middle East"]),
    ("vorwerk", "Vorwerk Ventures", "https://www.vorwerkventures.com/", ["Europe"]),
    ("fiveseasons", "Five Seasons", "https://www.fiveseasons.vc/", ["Europe"]),
    ("foodlabscom", "FoodLabs", "https://www.foodlabs.com/", ["Europe"]),
    ("felixc", "Felix Capital", "https://www.felixcapital.com/", ["United Kingdom", "Europe"]),
    ("lightspeed2", "Lightspeed", "https://lsvp.com/", ["United States"]),
    ("forerunner2", "Forerunner", "https://www.forerunnerventures.com/", ["United States"]),
    ("maveron2", "Maveron", "https://www.maveron.com/", ["United States"]),
    ("fifty2", "Fifty Years", "https://www.fiftyyears.com/", ["United States"]),
    ("versionone2", "Version One", "https://versionone.vc/", ["Canada"]),
    ("ribbit2", "Ribbit", "https://ribbitcap.com/", ["United States"]),
    ("qed2", "QED", "https://www.qedinvestors.com/", ["United States"]),
    ("thrive2", "Thrive", "https://thrivecap.com/", ["United States"]),
    ("khosla2", "Khosla Ventures", "https://www.khoslaventures.com/", ["United States"]),
    ("saama2", "Saama", "https://www.saama.vc/", ["India"]),
    ("piin2", "Pi Ventures", "https://pi.ventures/", ["India"]),
    ("blume2", "Blume", "https://blume.vc/", ["India"]),
    ("surge2", "Surge", "https://www.surgeahead.com/", ["Asia"]),
    ("east2", "East Ventures", "https://east.vc/", ["Asia"]),
    ("jungle2", "Jungle Ventures", "https://www.jungle.vc/", ["Asia"]),
    ("peakxv2", "Peak XV", "https://www.peakxv.com/", ["Asia", "India"]),
    ("omidyar2", "Omidyar Network", "https://www.omidyar.com/", ["United States"]),
    ("gv2", "GV", "https://www.gv.com/", ["United States"]),
    ("m122", "M12", "https://m12.vc/", ["United States"]),
    ("intel2", "Intel Capital", "https://www.intelcapital.com/", ["United States"]),
    ("salesforcev2", "Salesforce Ventures", "https://salesforceventures.com/", ["United States"]),
]

STARTUPS = [
    ("rippling", "Rippling", "https://www.rippling.com/"),
    ("remotehr", "Remote", "https://remote.com/"),
    ("oyster", "Oyster", "https://www.oysterhr.com/"),
    ("hibob", "HiBob", "https://www.hibob.com/"),
    ("lattice", "Lattice", "https://www.lattice.com/"),
    ("bamboohr", "BambooHR", "https://www.bamboohr.com/"),
    ("gusto2", "Gusto", "https://gusto.com/"),
    ("justworks2", "Justworks", "https://www.justworks.com/"),
    ("workday", "Workday", "https://www.workday.com/"),
    ("xero", "Xero", "https://www.xero.com/"),
    ("sage", "Sage", "https://www.sage.com/"),
    ("freshbooks", "FreshBooks", "https://www.freshbooks.com/"),
    ("freeagent", "FreeAgent", "https://www.freeagent.com/"),
    ("expensify", "Expensify", "https://www.expensify.com/"),
    ("ramp", "Ramp", "https://ramp.com/"),
    ("mercury", "Mercury", "https://mercury.com/"),
    ("marqeta", "Marqeta", "https://www.marqeta.com/"),
    ("toast", "Toast", "https://www.toasttab.com/"),
    ("faire", "Faire", "https://www.faire.com/"),
    ("whatnot", "Whatnot", "https://www.whatnot.com/"),
    ("depop", "Depop", "https://www.depop.com/"),
    ("stockx", "StockX", "https://www.stockx.com/"),
    ("warby", "Warby Parker", "https://www.warbyparker.com/"),
    ("allbirds", "Allbirds", "https://www.allbirds.com/"),
    ("glossier", "Glossier", "https://www.glossier.com/"),
    ("away", "Away", "https://www.awaytravel.com/"),
    ("robinhood", "Robinhood", "https://robinhood.com/"),
    ("block", "Block", "https://squareup.com/"),
    ("paypal", "PayPal", "https://www.paypal.com/"),
    ("chime2", "Chime", "https://www.chime.com/"),
    ("sofi2", "SoFi", "https://www.sofi.com/"),
    ("plaid2", "Plaid", "https://plaid.com/"),
    ("column", "Column", "https://column.com/"),
    ("unit", "Unit", "https://www.unit.co/"),
    ("lithic", "Lithic", "https://www.lithic.com/"),
    ("thoughtmachine", "Thought Machine", "https://www.thoughtmachine.net/"),
    ("tenxbank", "10x Banking", "https://www.10xbanking.com/"),
    ("form3", "Form3", "https://www.form3.tech/"),
    ("modulr", "Modulr", "https://www.modulrfinance.com/"),
    ("yapily", "Yapily", "https://www.yapily.com/"),
    ("tink2", "Tink", "https://www.tink.com/"),
    ("cleo", "Cleo", "https://web.meetcleo.com/"),
    ("octopusenergy", "Octopus Energy", "https://octopus.energy/"),
    ("ovo", "OVO", "https://www.ovoenergy.com/"),
    ("northvolt", "Northvolt", "https://northvolt.com/"),
    ("rivian", "Rivian", "https://rivian.com/"),
    ("redwood", "Redwood Materials", "https://www.redwoodmaterials.com/"),
    ("formenergy", "Form Energy", "https://formenergy.com/"),
    ("helion", "Helion", "https://www.helionenergy.com/"),
    ("climeworks", "Climeworks", "https://www.climeworks.com/"),
    ("watershed", "Watershed", "https://watershed.com/"),
    ("persefoni", "Persefoni", "https://www.persefoni.com/"),
    ("normative", "Normative", "https://normative.io/"),
    ("whoop", "WHOOP", "https://www.whoop.com/"),
    ("oura", "Oura", "https://ouraring.com/"),
    ("headspace", "Headspace", "https://www.headspace.com/"),
    ("calm", "Calm", "https://www.calm.com/"),
    ("noom", "Noom", "https://www.noom.com/"),
    ("hims", "Hims", "https://www.hims.com/"),
    ("zocdoc", "Zocdoc", "https://www.zocdoc.com/"),
    ("tempus", "Tempus", "https://www.tempus.com/"),
    ("benchling", "Benchling", "https://www.benchling.com/"),
    ("recursion", "Recursion", "https://www.recursion.com/"),
    ("modernatx", "Moderna", "https://www.modernatx.com/"),
    ("biontech", "BioNTech", "https://www.biontech.com/"),
    ("biorender", "BioRender", "https://www.biorender.com/"),
    ("docker", "Docker", "https://www.docker.com/"),
    ("pagerduty", "PagerDuty", "https://www.pagerduty.com/"),
    ("newrelic", "New Relic", "https://newrelic.com/"),
    ("grafana", "Grafana", "https://grafana.com/"),
    ("confluent", "Confluent", "https://www.confluent.io/"),
    ("fivetran", "Fivetran", "https://www.fivetran.com/"),
    ("dbt", "dbt", "https://www.getdbt.com/"),
    ("prefect", "Prefect", "https://www.prefect.io/"),
    ("dagster", "Dagster", "https://dagster.io/"),
    ("temporal", "Temporal", "https://temporal.io/"),
    ("pulumi", "Pulumi", "https://www.pulumi.com/"),
    ("digitalocean", "DigitalOcean", "https://www.digitalocean.com/"),
    ("twilio", "Twilio", "https://www.twilio.com/"),
    ("fastly", "Fastly", "https://www.fastly.com/"),
    ("snyk", "Snyk", "https://snyk.io/"),
    ("wiz", "Wiz", "https://www.wiz.io/"),
    ("sentinelone", "SentinelOne", "https://www.sentinelone.com/"),
    ("darktrace", "Darktrace", "https://www.darktrace.com/"),
    ("zscaler", "Zscaler", "https://www.zscaler.com/"),
    ("paloalto", "Palo Alto Networks", "https://www.paloaltonetworks.com/"),
    ("retool", "Retool", "https://retool.com/"),
    ("bubble", "Bubble", "https://bubble.io/"),
    ("webflow2", "Webflow", "https://webflow.com/"),
    ("framer2", "Framer", "https://www.framer.com/"),
    ("notion2", "Notion", "https://www.notion.com/"),
    ("airtable2", "Airtable", "https://www.airtable.com/"),
    ("coda2", "Coda", "https://coda.io/"),
    ("jasper", "Jasper", "https://www.jasper.ai/"),
    ("copyai", "Copy.ai", "https://www.copy.ai/"),
    ("grammarly", "Grammarly", "https://www.grammarly.com/"),
    ("intercom", "Intercom", "https://www.intercom.com/"),
    ("zendesk", "Zendesk", "https://www.zendesk.com/"),
    ("hubspot", "HubSpot", "https://www.hubspot.com/"),
    ("salesforce2", "Salesforce", "https://www.salesforce.com/"),
    ("gong", "Gong", "https://www.gong.io/"),
    ("outreach", "Outreach", "https://www.outreach.io/"),
    ("salesloft", "Salesloft", "https://www.salesloft.com/"),
    ("clari", "Clari", "https://www.clari.com/"),
    ("amplitude", "Amplitude", "https://amplitude.com/"),
    ("mixpanel", "Mixpanel", "https://mixpanel.com/"),
    ("segment", "Segment", "https://segment.com/"),
    ("mparticle", "mParticle", "https://www.mparticle.com/"),
    ("iterable2", "Iterable", "https://iterable.com/"),
    ("braze2", "Braze", "https://www.braze.com/"),
    ("klaviyo2", "Klaviyo", "https://www.klaviyo.com/"),
    ("customerio2", "Customer.io", "https://customer.io/"),
    ("mailchimp2", "Mailchimp", "https://mailchimp.com/"),
    ("beehiiv2", "beehiiv", "https://www.beehiiv.com/"),
    ("substack2", "Substack", "https://substack.com/"),
    ("loom", "Loom", "https://www.loom.com/"),
    ("zoom2", "Zoom", "https://zoom.us/"),
    ("slack2", "Slack", "https://slack.com/"),
    ("discord2", "Discord", "https://discord.com/"),
    ("atlassian2", "Atlassian", "https://www.atlassian.com/"),
    ("github2", "GitHub", "https://github.com/"),
    ("gitlab2", "GitLab", "https://about.gitlab.com/"),
    ("vercel2", "Vercel", "https://vercel.com/"),
    ("netlify2", "Netlify", "https://www.netlify.com/"),
    ("cloudflare2", "Cloudflare", "https://www.cloudflare.com/"),
    ("mongodb2", "MongoDB", "https://www.mongodb.com/"),
    ("snowflake2", "Snowflake", "https://www.snowflake.com/"),
    ("databricks2", "Databricks", "https://www.databricks.com/"),
    ("openai2", "OpenAI", "https://openai.com/"),
    ("anthropic2", "Anthropic", "https://www.anthropic.com/"),
    ("mistral2", "Mistral", "https://mistral.ai/"),
    ("cohere3", "Cohere", "https://cohere.com/"),
    ("huggingface2", "Hugging Face", "https://huggingface.co/"),
    ("perplexity2", "Perplexity", "https://www.perplexity.ai/"),
    ("cursor2", "Cursor", "https://cursor.com/"),
    ("replit2", "Replit", "https://replit.com/"),
    ("linear2", "Linear", "https://linear.app/"),
    ("figma2", "Figma", "https://www.figma.com/"),
    ("canva2", "Canva", "https://www.canva.com/"),
    ("miro2", "Miro", "https://miro.com/"),
    ("asana2", "Asana", "https://asana.com/"),
    ("monday2", "monday.com", "https://monday.com/"),
    ("clickup2", "ClickUp", "https://clickup.com/"),
    ("dropbox2", "Dropbox", "https://www.dropbox.com/"),
    ("box2", "Box", "https://www.box.com/"),
    ("1password2", "1Password", "https://1password.com/"),
    ("okta2", "Okta", "https://www.okta.com/"),
    ("crowdstrike2", "CrowdStrike", "https://www.crowdstrike.com/"),
    ("datadog2", "Datadog", "https://www.datadoghq.com/"),
    ("sentry2", "Sentry", "https://sentry.io/"),
    ("posthog2", "PostHog", "https://posthog.com/"),
    ("supabase2", "Supabase", "https://supabase.com/"),
    ("neon2", "Neon", "https://neon.tech/"),
    ("planetscale", "PlanetScale", "https://planetscale.com/"),
    ("cockroach", "CockroachDB", "https://www.cockroachlabs.com/"),
    ("elastic2", "Elastic", "https://www.elastic.co/"),
    ("algolia", "Algolia", "https://www.algolia.com/"),
    ("typesense", "Typesense", "https://typesense.org/"),
    ("meilisearch", "Meilisearch", "https://www.meilisearch.com/"),
    ("stripe2", "Stripe", "https://stripe.com/"),
    ("adyen3", "Adyen", "https://www.adyen.com/"),
    ("checkout4", "Checkout.com", "https://www.checkout.com/"),
    ("klarna2", "Klarna", "https://www.klarna.com/"),
    ("affirm", "Affirm", "https://www.affirm.com/"),
    ("afterpay", "Afterpay", "https://www.afterpay.com/"),
    ("klarna3", "Klarna", "https://www.klarna.com/"),
    ("nubank", "Nubank", "https://nubank.com.br/"),
    ("revolut6", "Revolut", "https://www.revolut.com/"),
    ("monzo6", "Monzo", "https://monzo.com/"),
    ("starling6", "Starling", "https://www.starlingbank.com/"),
    ("wise6", "Wise", "https://wise.com/"),
    ("n266", "N26", "https://n26.com/"),
    ("qonto5", "Qonto", "https://qonto.com/"),
    ("pleo5", "Pleo", "https://www.pleo.io/"),
    ("spendesk5", "Spendesk", "https://www.spendesk.com/"),
    ("pennylane5", "Pennylane", "https://www.pennylane.com/"),
    ("alan3", "Alan", "https://alan.com/"),
    ("doctolib2", "Doctolib", "https://www.doctolib.fr/"),
    ("kry", "Kry", "https://www.kry.se/"),
    ("babylon", "Babylon", "https://www.babylonhealth.com/"),
    ("zava", "Zava", "https://www.zavamed.com/"),
    ("patient", "Patient", "https://patient.info/"),
    ("accuRx", "Accurx", "https://www.accurx.com/"),
    ("patchwork", "Patchwork", "https://www.patchwork.health/"),
    ("lottie", "Lottie", "https://www.lottie.org/"),
    ("cuvva2", "Cuvva", "https://www.cuvva.com/"),
    ("marshmallow2", "Marshmallow", "https://www.marshmallow.com/"),
    ("zego", "Zego", "https://www.zego.com/"),
    ("wefox", "wefox", "https://www.wefox.com/"),
    ("lemon", "Lemonade", "https://www.lemonade.com/"),
    ("rootins", "Root", "https://www.joinroot.com/"),
    ("hippo", "Hippo", "https://www.hippo.com/"),
    ("nextins", "Next Insurance", "https://www.nextinsurance.com/"),
    ("pie", "Pie Insurance", "https://www.pieinsurance.com/"),
    ("coalition", "Coalition", "https://www.coalitioninc.com/"),
    ("atbay", "At-Bay", "https://www.at-bay.com/"),
    ("vanta2", "Vanta", "https://www.vanta.com/"),
    ("drata", "Drata", "https://drata.com/"),
    ("secureframe", "Secureframe", "https://secureframe.com/"),
    ("tines", "Tines", "https://www.tines.com/"),
    ("onesignal", "OneSignal", "https://onesignal.com/"),
    ("customerio3", "Customer.io", "https://customer.io/"),
    ("resend2", "Resend", "https://resend.com/"),
    ("postmark", "Postmark", "https://postmarkapp.com/"),
    ("sendgrid", "SendGrid", "https://sendgrid.com/"),
    ("mailgun", "Mailgun", "https://www.mailgun.com/"),
    ("beehiiv3", "beehiiv", "https://www.beehiiv.com/"),
    ("convertkit2", "Kit", "https://kit.com/"),
    ("buttondown", "Buttondown", "https://buttondown.com/"),
    ("ghost", "Ghost", "https://ghost.org/"),
    ("wordpress2", "WordPress", "https://wordpress.com/"),
    ("webflow3", "Webflow", "https://webflow.com/"),
    ("squarespace2", "Squarespace", "https://www.squarespace.com/"),
    ("wix2", "Wix", "https://www.wix.com/"),
    ("shopify2", "Shopify", "https://www.shopify.com/"),
    ("bigcommerce", "BigCommerce", "https://www.bigcommerce.com/"),
    ("magento", "Magento", "https://business.adobe.com/products/magento/magento-commerce.html"),
    ("commercetools", "commercetools", "https://commercetools.com/"),
    ("contentful", "Contentful", "https://www.contentful.com/"),
    ("sanity", "Sanity", "https://www.sanity.io/"),
    ("strapi", "Strapi", "https://strapi.io/"),
    ("storyblok", "Storyblok", "https://www.storyblok.com/"),
    ("prismic", "Prismic", "https://prismic.io/"),
    ("builder", "Builder", "https://www.builder.io/"),
    ("plasmic", "Plasmic", "https://www.plasmic.app/"),
    ("vercel3", "Vercel", "https://vercel.com/"),
    ("netlify3", "Netlify", "https://www.netlify.com/"),
    ("render2", "Render", "https://render.com/"),
    ("railway2", "Railway", "https://railway.com/"),
    ("fly2", "Fly.io", "https://fly.io/"),
    ("heroku", "Heroku", "https://www.heroku.com/"),
    ("render3", "Render", "https://render.com/"),
]


def host(url: str) -> str:
    part = url.split("/")[2].lower()
    return part[4:] if part.startswith("www.") else part


def existing():
    text = ""
    for path in [
        "/workspace/src/lib/seedstage/directory.generated.ts",
        "/workspace/src/lib/seedstage/public-investors.ts",
        "/workspace/src/lib/seedstage/startups.ts",
    ]:
        text += Path(path).read_text()
    ids = set(re.findall(r'id: "([^"]+)"', text))
    names = {n.lower() for n in re.findall(r'(?:firm|name): "([^"]+)"', text)}
    hosts = {host(u) if "://" in u else u for u in re.findall(r'https?://[^"\s]+', text)}
    return ids, names, hosts


def clip(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    for marker in ("Cookie", "Privacy", "Subscribe", "Don't invest", "©"):
        i = text.find(marker)
        if i > 40:
            text = text[:i].strip()
    parts = re.split(r"(?<=[.!?])\s+", text)
    kept = [p for p in parts if len(p) > 20][:2]
    return (" ".join(kept) if kept else text)[:420]


def stages_from(text: str) -> list[str]:
    low = text.lower()
    found = []
    if "pre-seed" in low or "preseed" in low:
        found.append("pre-seed")
    if re.search(r"\bseed\b", low):
        found.append("seed")
    if not found and re.search(r"early[- ]stage|day one|from inception", low):
        found.append("early-stage")
    return found


def main():
    ids, names, hosts = existing()
    funds = [row for row in FUNDS if row[0] not in ids and row[1].lower() not in names and host(row[2]) not in hosts]
    startups = []
    for sid, name, url in STARTUPS:
        if sid in ids or name.lower() in names or host(url) in hosts:
            continue
        startups.append((sid, name, url, "", ""))
    print("try", len(funds), len(startups))
    got_f, got_s = [], []
    with ThreadPoolExecutor(14) as pool:
        futs = [pool.submit(fd.one_fund, row) for row in funds] + [pool.submit(fd.one_startup, row) for row in startups]
        for fut in as_completed(futs):
            kind, fid, rec, _status = fut.result()
            if rec:
                print("ok", kind, fid)
                (got_f if kind == "fund" else got_s).append(rec)
    fund_chunks, startup_chunks = [], []
    for f in got_f:
        if f["id"] in ids or f["firm"].lower() in names or host(f["url"]) in hosts:
            continue
        body = clip(f["excerpt"])
        if len(body) < 24:
            continue
        geos = ", ".join(json.dumps(g) for g in f["geos"])
        fund_chunks.append(
            "  {\n"
            f"    id: {json.dumps(f['id'])},\n"
            f"    firm: {json.dumps(f['firm'])},\n"
            f"    fund: {json.dumps(f['firm'])},\n"
            "    partner: null,\n"
            f"    stages: {json.dumps(stages_from(body))},\n"
            f"    geos: [{geos}],\n"
            "    geoExclusions: [],\n    sectors: [],\n    sectorExclusions: [],\n    sectorExclusive: false,\n"
            "    chequeMinMinor: 0,\n    chequeMaxMinor: 0,\n"
            '    participation: "unstated",\n    themes: [],\n    portfolio: [],\n    activityDate: null,\n'
            '    source: "Company site",\n'
            f"    sourceUrl: {json.dumps(f['url'])},\n"
            '    sourceDate: "2026-11-20",\n'
            f"    excerpt: {json.dumps(body, ensure_ascii=False)},\n"
            '    note: "",\n'
            f"    logo: {json.dumps(f['logo'])},\n"
            '    synthetic: false,\n    confirmed: false,\n    currency: "GBP",\n  }'
        )
        ids.add(f["id"])
        names.add(f["firm"].lower())
        hosts.add(host(f["url"]))
    for s in got_s:
        if s["id"] in ids or s["name"].lower() in names or host(s["website"]) in hosts:
            continue
        body = clip(s["summary"])
        if len(body) < 24:
            continue
        low = body.lower()
        stage = "Pre-seed" if "pre-seed" in low else "Seed" if re.search(r"\bseed\b", low) else ""
        startup_chunks.append(
            "  {\n"
            f"    id: {json.dumps(s['id'])},\n"
            f"    name: {json.dumps(s['name'])},\n"
            f"    website: {json.dumps(s['website'])},\n"
            f"    logo: {json.dumps(s['logo'])},\n"
            f"    stage: {json.dumps(stage)},\n"
            "    round: null,\n"
            f"    summary: {json.dumps(body, ensure_ascii=False)},\n"
            '    person: null,\n    funder: "",\n    source: "Company site",\n'
            f"    sourceUrl: {json.dumps(s['website'])},\n  }}"
        )
        ids.add(s["id"])
        names.add(s["name"].lower())
    text = GEN.read_text()
    if fund_chunks:
        text = text.replace("\n];\n\nexport const extraStartups", ",\n" + ",\n".join(fund_chunks) + "\n];\n\nexport const extraStartups", 1)
    if startup_chunks:
        text = text.rstrip()
        if text.endswith("];"):
            text = text[:-2] + ",\n" + ",\n".join(startup_chunks) + "\n];\n"
    GEN.write_text(text)
    print("ADDED", len(fund_chunks), len(startup_chunks))


if __name__ == "__main__":
    main()
