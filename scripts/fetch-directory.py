#!/usr/bin/env python3
"""Fetch live homepages and site icons. Keep a firm only when a real icon downloads."""

import json, os, re, ssl
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from urllib.error import HTTPError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

OUT = "/workspace/public/logos"
CTX = ssl.create_default_context()
UA = {"User-Agent": "Mozilla/5.0"}

# id, name, url, geos
FUNDS = [
    ("balderton", "Balderton", "https://www.balderton.com/", ["United Kingdom", "Europe"]),
    ("cherry", "Cherry Ventures", "https://www.cherry.vc/", ["Europe", "United Kingdom"]),
    ("earlybird", "Earlybird", "https://earlybird.com/", ["Europe", "United Kingdom"]),
    ("northzone", "Northzone", "https://northzone.com/", ["Europe", "United Kingdom"]),
    ("lakestar", "Lakestar", "https://www.lakestar.com/", ["Europe", "United Kingdom"]),
    ("projecta", "Project A", "https://www.project-a.com/", ["Europe", "United Kingdom"]),
    ("hvcapital", "HV Capital", "https://www.hvcapital.com/", ["Europe", "United Kingdom"]),
    ("partech", "Partech", "https://partechpartners.com/", ["Europe", "United Kingdom"]),
    ("alven", "Alven", "https://www.alven.co/", ["Europe", "United Kingdom"]),
    ("heartcore", "Heartcore", "https://heartcore.com/", ["Europe", "United Kingdom"]),
    ("plural", "Plural", "https://www.pluralplatform.com/", ["Europe", "United Kingdom"]),
    ("concept", "Concept Ventures", "https://www.conceptventures.vc/", ["United Kingdom"]),
    ("fuel", "Fuel Ventures", "https://fuel.ventures/", ["United Kingdom"]),
    ("ascendvc", "Ascension", "https://www.ascension.vc/", ["United Kingdom"]),
    ("stride", "Stride.VC", "https://www.stride.vc/", ["United Kingdom"]),
    ("backed", "Backed VC", "https://www.backed.vc/", ["United Kingdom", "Europe"]),
    ("connect", "Connect Ventures", "https://www.connectventures.co/", ["Europe", "United Kingdom"]),
    ("foundersfactory", "Founders Factory", "https://foundersfactory.com/", ["United Kingdom"]),
    ("airstreet", "Air Street Capital", "https://www.airstreet.com/", ["United Kingdom", "Europe"]),
    ("firstround", "First Round", "https://www.firstround.com/", ["United States"]),
    ("homebrew", "Homebrew", "https://www.homebrew.co/", ["United States"]),
    ("usv", "Union Square Ventures", "https://www.usv.com/", ["United States"]),
    ("nfx", "NFX", "https://www.nfx.com/", ["United States"]),
    ("floodgate", "Floodgate", "https://floodgate.com/", ["United States"]),
    ("precursor", "Precursor Ventures", "https://precursorvc.com/", ["United States"]),
    ("hustlefund", "Hustle Fund", "https://www.hustlefund.vc/", ["United States"]),
    ("uncork", "Uncork Capital", "https://uncorkcapital.com/", ["United States"]),
    ("boldstart", "Boldstart", "https://boldstart.vc/", ["United States"]),
    ("boxgroup", "BoxGroup", "https://www.boxgroup.com/", ["United States"]),
    ("pear", "Pear VC", "https://www.pear.vc/", ["United States"]),
    ("ycombinator", "Y Combinator", "https://www.ycombinator.com/", ["United States", "United Kingdom", "Europe"]),
    ("techstars", "Techstars", "https://www.techstars.com/", ["United States", "United Kingdom", "Europe"]),
    ("fivehundred", "500 Global", "https://500.co/", ["United States", "United Kingdom", "Europe"]),
    ("sosv", "SOSV", "https://sosv.com/", ["United States", "United Kingdom", "Europe"]),
    ("lux", "Lux Capital", "https://www.luxcapital.com/", ["United States"]),
    ("dcvc", "DCVC", "https://www.dcvc.com/", ["United States"]),
    ("initialized", "Initialized", "https://initialized.com/", ["United States"]),
    ("felicis", "Felicis", "https://www.felicis.com/", ["United States"]),
    ("bessemer", "Bessemer", "https://www.bvp.com/", ["United States", "Europe", "United Kingdom"]),
    ("accel", "Accel", "https://www.accel.com/", ["United States", "Europe", "United Kingdom"]),
    ("sequoia", "Sequoia", "https://www.sequoiacap.com/", ["United States", "Europe", "United Kingdom"]),
    ("a16z", "Andreessen Horowitz", "https://a16z.com/", ["United States"]),
    ("foundersfund", "Founders Fund", "https://foundersfund.com/", ["United States"]),
    ("greylock", "Greylock", "https://greylock.com/", ["United States"]),
    ("benchmark", "Benchmark", "https://www.benchmark.com/", ["United States"]),
    ("spark", "Spark Capital", "https://www.sparkcapital.com/", ["United States"]),
    ("generalcatalyst", "General Catalyst", "https://www.generalcatalyst.com/", ["United States", "Europe", "United Kingdom"]),
    ("lightspeed", "Lightspeed", "https://lsvp.com/", ["United States", "Europe", "United Kingdom"]),
    ("insight", "Insight Partners", "https://www.insightpartners.com/", ["United States", "Europe", "United Kingdom"]),
    ("index", "Index Ventures", "https://www.indexventures.com/", ["Europe", "United Kingdom", "United States"]),
    ("atomico", "Atomico", "https://www.atomico.com/", ["Europe", "United Kingdom"]),
    ("eqtventures", "EQT Ventures", "https://eqtventures.com/", ["Europe", "United Kingdom"]),
    ("molten", "Molten Ventures", "https://www.moltenventures.com/", ["United Kingdom", "Europe"]),
    ("kima", "Kima Ventures", "https://www.kimaventures.com/", ["Europe", "United Kingdom"]),
    ("elaia", "Elaia", "https://www.elaia.com/", ["Europe"]),
    ("redalpine", "Redalpine", "https://www.redalpine.com/", ["Europe"]),
    ("btov", "btov Partners", "https://www.btov.vc/", ["Europe"]),
    ("htgf", "High-Tech Gründerfonds", "https://www.htgf.de/en/", ["Europe"]),
    ("speedinvest", "Speedinvest", "https://www.speedinvest.com/", ["Europe", "United Kingdom"]),
    ("inventure", "Inventure", "https://www.inventure.vc/", ["Europe"]),
    ("byfounders", "byFounders", "https://www.byfounders.vc/", ["Europe"]),
    ("openocean", "OpenOcean", "https://openocean.vc/", ["Europe"]),
    ("lifeline", "Lifeline Ventures", "https://www.lifelineventures.com/", ["Europe"]),
    ("paleblue", "Pale Blue Dot", "https://paleblue.vc/", ["Europe"]),
    ("worldfund", "World Fund", "https://www.worldfund.vc/", ["Europe", "United Kingdom"]),
    ("giant", "Giant Ventures", "https://www.giant.vc/", ["United Kingdom", "Europe"]),
    ("localglobe", "LocalGlobe", "https://www.phoenixcourt.vc/funds/localglobe", ["United Kingdom", "Europe"]),
    ("seedcamp", "Seedcamp", "https://seedcamp.com/", ["United Kingdom", "Europe"]),
    ("blume", "Blume Ventures", "https://blume.vc/", ["India"]),
    ("peakxv", "Peak XV", "https://www.peakxv.com/", ["India", "United States"]),
    ("surge", "Surge", "https://surgeahead.com/", ["India"]),
    ("eastventures", "East Ventures", "https://east.vc/", ["Asia"]),
    ("jungle", "Jungle Ventures", "https://www.jungle.vc/", ["Asia"]),
    ("vertex", "Vertex Ventures", "https://www.vertexventures.com/", ["Asia"]),
    ("antler", "Antler", "https://www.antler.co/", ["United Kingdom", "Europe", "United States", "Asia"]),
    ("ef", "Entrepreneur First", "https://www.joinef.com/", ["United Kingdom", "Europe"]),
    ("coral", "Coral Capital", "https://coralcap.co/", ["Japan"]),
    ("anri", "ANRI", "https://anri.vc/", ["Japan"]),
    ("futureafrica", "Future Africa", "https://future.africa/", ["Africa"]),
    ("tlcom", "TLcom", "https://www.tlcomcapital.com/", ["Africa"]),
    ("partechafrica", "Partech Africa", "https://partechpartners.com/africa/", ["Africa"]),
    ("norrsken22", "Norrsken22", "https://www.norrsken22.com/", ["Africa"]),
    ("flat6labs", "Flat6Labs", "https://www.flat6labs.com/", ["Africa"]),
    ("creandum", "Creandum", "https://www.creandum.com/", ["Europe", "United Kingdom"]),
    ("pointnine", "Point Nine", "https://www.pointnine.com/", ["Europe", "United Kingdom"]),
    ("frontline", "Frontline", "https://frontline.vc/", ["Europe", "United Kingdom", "United States"]),
    ("crane", "Crane", "https://crane.vc/", ["United Kingdom", "Europe"]),
    ("dawn", "Dawn Capital", "https://www.dawncapital.com/", ["Europe", "United Kingdom"]),
    ("mmc", "MMC", "https://mmc.vc/", ["Europe", "United Kingdom"]),
    ("notion", "Notion Capital", "https://www.notioncapital.com/", ["Europe", "United Kingdom"]),
    ("octopus", "Octopus Ventures", "https://octopusventures.com/", ["United Kingdom", "Europe"]),
    ("passion", "Passion Capital", "https://www.passioncapital.com/", ["United Kingdom"]),
    ("playfair", "Playfair", "https://playfair.vc/", ["United Kingdom"]),
    ("hoxton", "Hoxton Ventures", "https://hoxtonventures.com/", ["Europe", "United Kingdom"]),
    ("ada", "Ada Ventures", "https://www.adaventures.com/", ["United Kingdom", "Europe"]),
    ("episode1", "Episode 1", "https://www.episode1.com/", ["United Kingdom"]),
    ("haatch", "Haatch", "https://haatch.com/", ["United Kingdom"]),
    ("kindred", "Kindred Capital", "https://kindredcapital.vc/", ["United Kingdom", "Europe"]),
    ("firstminute", "firstminute capital", "https://www.firstminute.capital/", ["United Kingdom", "Europe"]),
    ("felix", "Felix Capital", "https://www.felixcap.com/", ["Europe", "United Kingdom"]),
    ("blossom", "Blossom Capital", "https://www.blossomcap.com/", ["Europe", "United Kingdom"]),
    ("mosaic", "Mosaic Ventures", "https://www.mosaicventures.com/", ["Europe", "United Kingdom"]),
    ("samaipata", "Samaipata", "https://www.samaipata.vc/", ["Europe"]),
    ("fly", "Fly Ventures", "https://www.fly.vc/", ["Europe"]),
    ("visionaries", "Visionaries Club", "https://visionaries.vc/", ["Europe"]),
    ("lafamiglia", "La Famiglia", "https://www.lafamiglia.vc/", ["Europe"]),
    ("cavalry", "Cavalry Ventures", "https://cavalry.vc/", ["Europe"]),
    ("picus", "Picus Capital", "https://www.picuscap.com/", ["Europe"]),
    ("gfc", "Global Founders Capital", "https://www.globalfounderscapital.com/", ["Europe", "United States"]),
    ("ribbit", "Ribbit Capital", "https://www.ribbitcap.com/", ["United States"]),
    ("qed", "QED Investors", "https://www.qedinvestors.com/", ["United States"]),
    ("nyca", "Nyca Partners", "https://www.nyca.com/", ["United States"]),
    ("khosla", "Khosla Ventures", "https://www.khoslaventures.com/", ["United States"]),
    ("trueventures", "True Ventures", "https://www.trueventures.com/", ["United States"]),
    ("amplify", "Amplify Partners", "https://www.amplifypartners.com/", ["United States"]),
    ("rootvc", "Root Ventures", "https://www.root.vc/", ["United States"]),
    ("signalfire", "SignalFire", "https://www.signalfire.com/", ["United States"]),
    ("village", "Village Global", "https://www.villageglobal.vc/", ["United States"]),
    ("afore", "Afore Capital", "https://www.afore.vc/", ["United States"]),
    ("haystack", "Haystack", "https://haystack.vc/", ["United States"]),
    ("primary", "Primary", "https://www.primary.vc/", ["United States"]),
    ("lerer", "Lerer Hippeau", "https://www.lererhippeau.com/", ["United States"]),
    ("workbench", "Work-Bench", "https://www.work-bench.com/", ["United States"]),
    ("menlo", "Menlo Ventures", "https://menlovc.com/", ["United States"]),
    ("battery", "Battery Ventures", "https://www.battery.com/", ["United States"]),
    ("redpoint", "Redpoint", "https://www.redpoint.com/", ["United States"]),
    ("nea", "NEA", "https://www.nea.com/", ["United States"]),
    ("gv", "GV", "https://www.gv.com/", ["United States"]),
    ("thrive", "Thrive Capital", "https://thrivecap.com/", ["United States"]),
    ("coatue", "Coatue", "https://www.coatue.com/", ["United States"]),
    ("tiger", "Tiger Global", "https://www.tigerglobal.com/", ["United States"]),
    ("softbank", "SoftBank", "https://www.softbank.com/en/", ["United States", "Asia", "Europe"]),
]

# id, name, url, stage, funder
STARTUPS = [
    ("ravical", "Ravical", "https://ravical.com/", "Seed", "MMC"),
    ("hacktron", "Hacktron", "https://www.hacktron.ai/", "Pre-seed", "Crane"),
    ("flexa", "Flexa", "https://flexa.careers/", "Seed", "Ada Ventures"),
    ("toothfairy", "Toothfairy", "https://toothfairyapp.co.uk/", "Pre-seed", "Ada Ventures"),
    ("blakbear", "BlakBear", "https://blakbear.com/", "Pre-seed", "Ada Ventures"),
    ("matnex", "MatNex", "https://matnex.ai/", "Pre-seed", "Ada Ventures"),
    ("bodyswaps", "Bodyswaps", "https://bodyswaps.co/", "Early", "Haatch"),
    ("granola", "Granola", "https://www.granola.ai/", "Seed", ""),
    ("linear", "Linear", "https://linear.app/", "Seed", ""),
    ("attio", "Attio", "https://attio.com/", "Seed", ""),
    ("resend", "Resend", "https://resend.com/", "Seed", ""),
    ("cal", "Cal.com", "https://cal.com/", "Seed", ""),
    ("clerk", "Clerk", "https://clerk.com/", "Seed", ""),
    ("supabase", "Supabase", "https://supabase.com/", "Seed", ""),
    ("neon", "Neon", "https://neon.tech/", "Seed", ""),
    ("railway", "Railway", "https://railway.com/", "Seed", ""),
    ("render", "Render", "https://render.com/", "Seed", ""),
    ("flyio", "Fly.io", "https://fly.io/", "Seed", ""),
    ("inngest", "Inngest", "https://www.inngest.com/", "Seed", ""),
    ("trigger", "Trigger.dev", "https://trigger.dev/", "Seed", ""),
    ("ashby", "Ashby", "https://www.ashbyhq.com/", "Seed", ""),
    ("gamma", "Gamma", "https://gamma.app/", "Seed", ""),
    ("tome", "Tome", "https://tome.app/", "Seed", ""),
    ("copyai", "Copy.ai", "https://www.copy.ai/", "Seed", ""),
    ("bardeen", "Bardeen", "https://www.bardeen.ai/", "Seed", ""),
    ("clay", "Clay", "https://www.clay.com/", "Seed", ""),
    ("instantly", "Instantly", "https://instantly.ai/", "Seed", ""),
    ("lemlist", "lemlist", "https://www.lemlist.com/", "Seed", ""),
    ("tavus", "Tavus", "https://www.tavus.io/", "Seed", ""),
    ("krea", "Krea", "https://www.krea.ai/", "Seed", ""),
    ("ideogram", "Ideogram", "https://ideogram.ai/", "Seed", ""),
    ("pika", "Pika", "https://pika.art/", "Seed", ""),
    ("luma", "Luma AI", "https://lumalabs.ai/", "Seed", ""),
    ("elevenlabs", "ElevenLabs", "https://elevenlabs.io/", "Seed", ""),
    ("synthesia", "Synthesia", "https://www.synthesia.io/", "Seed", "Seedcamp"),
    ("photoroom", "Photoroom", "https://www.photoroom.com/", "Seed", ""),
    ("dust", "Dust", "https://dust.tt/", "Seed", ""),
    ("mistral", "Mistral", "https://mistral.ai/", "Seed", ""),
    ("poolside", "Poolside", "https://poolside.ai/", "Seed", ""),
    ("harvey", "Harvey", "https://www.harvey.ai/", "Seed", ""),
    ("hebbia", "Hebbia", "https://www.hebbia.ai/", "Seed", ""),
    ("glean", "Glean", "https://www.glean.com/", "Seed", ""),
    ("writer", "Writer", "https://writer.com/", "Seed", ""),
    ("ramp", "Ramp", "https://ramp.com/", "Seed", ""),
    ("brex", "Brex", "https://www.brex.com/", "Seed", ""),
    ("mercury", "Mercury", "https://mercury.com/", "Seed", ""),
    ("rippling", "Rippling", "https://www.rippling.com/", "Seed", ""),
    ("deel", "Deel", "https://www.deel.com/", "Seed", ""),
    ("remote", "Remote", "https://remote.com/", "Seed", ""),
    ("pennylane", "Pennylane", "https://www.pennylane.com/", "Seed", ""),
    ("qonto", "Qonto", "https://qonto.com/", "Seed", ""),
    ("spendesk", "Spendesk", "https://www.spendesk.com/", "Seed", ""),
    ("payfit", "Payfit", "https://payfit.com/", "Seed", ""),
    ("alan", "Alan", "https://alan.com/", "Seed", ""),
    ("pigment", "Pigment", "https://www.pigment.com/", "Seed", ""),
    ("causal", "Causal", "https://causal.app/", "Seed", ""),
    ("pleo", "Pleo", "https://www.pleo.io/", "Seed", "Seedcamp"),
    ("tide", "Tide", "https://www.tide.co/", "Seed", ""),
    ("monzo", "Monzo", "https://monzo.com/", "Seed", ""),
    ("starling", "Starling", "https://www.starlingbank.com/", "Seed", ""),
    ("revolut", "Revolut", "https://www.revolut.com/", "Seed", "Seedcamp"),
    ("wise", "Wise", "https://wise.com/", "Seed", ""),
    ("gocardless", "GoCardless", "https://gocardless.com/", "Seed", ""),
    ("checkout", "Checkout.com", "https://www.checkout.com/", "Seed", ""),
    ("plaid", "Plaid", "https://plaid.com/", "Seed", ""),
    ("stripe", "Stripe", "https://stripe.com/", "Seed", ""),
    ("notionapp", "Notion", "https://www.notion.so/", "Seed", ""),
    ("figma", "Figma", "https://www.figma.com/", "Seed", ""),
    ("canva", "Canva", "https://www.canva.com/", "Seed", ""),
    ("airtable", "Airtable", "https://www.airtable.com/", "Seed", ""),
    ("webflow", "Webflow", "https://webflow.com/", "Seed", ""),
    ("framer", "Framer", "https://www.framer.com/", "Seed", ""),
    ("vercel", "Vercel", "https://vercel.com/", "Seed", ""),
    ("openai", "OpenAI", "https://openai.com/", "Seed", ""),
    ("anthropic", "Anthropic", "https://www.anthropic.com/", "Seed", ""),
    ("perplexity", "Perplexity", "https://www.perplexity.ai/", "Seed", ""),
    ("cursor", "Cursor", "https://cursor.com/", "Seed", ""),
    ("replit", "Replit", "https://replit.com/", "Seed", ""),
    ("langchain", "LangChain", "https://www.langchain.com/", "Seed", ""),
    ("huggingface", "Hugging Face", "https://huggingface.co/", "Seed", ""),
    ("weights", "Weights & Biases", "https://wandb.ai/", "Seed", ""),
    ("scale", "Scale AI", "https://scale.com/", "Seed", ""),
    ("anduril", "Anduril", "https://www.anduril.com/", "Seed", ""),
    ("saronic", "Saronic", "https://www.saronic.com/", "Seed", ""),
    ("hadrian", "Hadrian", "https://www.hadrian.co/", "Seed", ""),
    ("relativ", "Relativity Space", "https://www.relativityspace.com/", "Seed", ""),
    ("helion", "Helion", "https://www.helionenergy.com/", "Seed", ""),
    ("commonwealth", "Commonwealth Fusion", "https://cfs.energy/", "Seed", ""),
    ("wayve", "Wayve", "https://wayve.ai/", "Seed", ""),
    ("physicsx", "PhysicsX", "https://www.physicsx.ai/", "Seed", ""),
    ("isomorphic", "Isomorphic Labs", "https://www.isomorphiclabs.com/", "Seed", ""),
    ("recursion", "Recursion", "https://www.recursion.com/", "Seed", ""),
    ("tempus", "Tempus", "https://www.tempus.com/", "Seed", ""),
    ("carta", "Carta", "https://carta.com/", "Seed", ""),
    ("angellist", "AngelList", "https://www.angellist.com/", "Seed", ""),
    ("pulley", "Pulley", "https://pulley.com/", "Seed", ""),
    ("captable", "Capdesk", "https://www.capdesk.com/", "Seed", ""),
    ("seedlegals", "SeedLegals", "https://seedlegals.com/", "Seed", ""),
    ("clerky", "Clerky", "https://www.clerky.com/", "Seed", ""),
    ("mercurybank", "Mercury", "https://mercury.com/", "Seed", ""),
]

def get(url, timeout=12, limit=None, hops=0):
    req = Request(url, headers=UA)
    try:
        with urlopen(req, timeout=timeout, context=CTX) as res:
            data = res.read(limit) if limit else res.read()
            return data, res.geturl(), res.headers.get("content-type", "")
    except HTTPError as e:
        loc = e.headers.get("Location") if e.headers else None
        if e.code in (301, 302, 303, 307, 308) and loc and hops < 4:
            return get(urljoin(url, loc), timeout, limit, hops + 1)
        raise

def clean(text):
    text = unescape(re.sub(r"\s+", " ", text or "")).strip()
    text = re.sub(r"<[^>]+>", "", text)
    return text[:240]

def meta(html, attr, key):
    patterns = [
        rf'<meta[^>]+{attr}=["\']{key}["\'][^>]+content=["\']([^"\']+)',
        rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+{attr}=["\']{key}["\']',
    ]
    for pat in patterns:
        m = re.search(pat, html, re.I)
        if m:
            return clean(m.group(1))
    return ""

def title_of(html):
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    return clean(m.group(1)) if m else ""

def icons(html, base):
    found = []
    for tag in re.findall(r"<link\b[^>]*>", html, re.I):
        rel = re.search(r'rel=["\']([^"\']+)', tag, re.I)
        href = re.search(r'href=["\']([^"\']+)', tag, re.I)
        if not rel or not href or "icon" not in rel.group(1).lower():
            continue
        score = 80 if "apple" in rel.group(1).lower() else 10
        sizes = re.search(r'sizes=["\']([^"\']+)', tag, re.I)
        if sizes:
            nums = [int(n) for n in re.findall(r"\d+", sizes.group(1))]
            score += max(nums) if nums else 0
        found.append((score, urljoin(base, href.group(1))))
    found.sort(reverse=True)
    return [href for _, href in found]

def to_png(data):
    import io
    from PIL import Image
    try:
        im = Image.open(io.BytesIO(data))
    except Exception:
        return None
    im = im.convert("RGBA")
    if min(im.size) < 16:
        return None
    im.thumbnail((256, 256))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    out = buf.getvalue()
    return out if len(out) >= 400 else None

def sniff(data, ctype):
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:3] == b"\xff\xd8\xff":
        return "jpg"
    if data[:4] == b"RIFF" and len(data) > 12 and data[8:12] == b"WEBP":
        return "webp"
    if b"<svg" in data[:400].lower() or b"<?xml" in data[:200].lower():
        return "svg"
    if "svg" in ctype:
        return "svg"
    if "png" in ctype:
        return "png"
    if "jpeg" in ctype or "jpg" in ctype:
        return "jpg"
    if "icon" in ctype or "webp" in ctype:
        return "png"
    return ""

def save_icon(domain, path_stem):
    try:
        html_b, final, _ = get(f"https://{domain}" if "://" not in domain else domain, limit=250_000)
    except Exception:
        # domain may already be a full url
        return None
    html = html_b.decode("utf-8", "ignore")
    desc = meta(html, "name", "description") or meta(html, "property", "og:description") or title_of(html)
    candidates = icons(html, final) + [urljoin(final, "/apple-touch-icon.png"), urljoin(final, "/favicon.ico")]
    best = None
    for href in candidates:
        try:
            data, _, ctype = get(href, timeout=10)
        except Exception:
            continue
        ext = sniff(data, ctype)
        if not ext or len(data) < 400:
            continue
        best = (data, ext)
        if len(data) > 1500 or ext == "svg":
            break
    if not best:
        return None
    data, ext = best
    path = f"{path_stem}.{ext}"
    open(path, "wb").write(data)
    return {"logo": "/" + os.path.relpath(path, "/workspace/public"), "excerpt": desc, "bytes": len(data)}

def one_fund(row):
    fid, name, url, geos = row
    try:
        html_b, final, _ = get(url, limit=300_000)
    except Exception as e:
        return ("fund", fid, None, str(e)[:80])
    html = html_b.decode("utf-8", "ignore")
    desc = meta(html, "name", "description") or meta(html, "property", "og:description") or title_of(html)
    if len(desc) < 12:
        return ("fund", fid, None, "no description")
    candidates = icons(html, final) + [urljoin(final, "/apple-touch-icon.png"), urljoin(final, "/favicon.ico")]
    saved = None
    for href in candidates:
        try:
            data, _, ctype = get(href, timeout=10)
        except Exception:
            continue
        ext = sniff(data, ctype)
        if not ext:
            continue
        png = to_png(data) if ext != "svg" else None
        if png:
            path = f"{OUT}/{fid}.png"
            open(path, "wb").write(png)
            saved = f"/logos/{fid}.png"
        elif ext == "svg" and len(data) >= 200:
            path = f"{OUT}/{fid}.svg"
            open(path, "wb").write(data)
            saved = f"/logos/{fid}.svg"
        else:
            continue
        if len(data) >= 800 or ext == "svg":
            break
    if not saved:
        return ("fund", fid, None, "no icon")
    return ("fund", fid, {
        "id": fid, "firm": name, "url": final, "geos": geos, "excerpt": desc, "logo": saved
    }, "ok")

def one_startup(row):
    sid, name, url, stage, funder = row
    try:
        html_b, final, _ = get(url, limit=300_000)
    except Exception as e:
        return ("startup", sid, None, str(e)[:80])
    html = html_b.decode("utf-8", "ignore")
    desc = meta(html, "name", "description") or meta(html, "property", "og:description") or title_of(html)
    if len(desc) < 12:
        return ("startup", sid, None, "no description")
    candidates = icons(html, final) + [urljoin(final, "/apple-touch-icon.png"), urljoin(final, "/favicon.ico")]
    saved = None
    for href in candidates:
        try:
            data, _, ctype = get(href, timeout=10)
        except Exception:
            continue
        ext = sniff(data, ctype)
        if not ext:
            continue
        png = to_png(data) if ext != "svg" else None
        if png:
            path = f"{OUT}/{sid}.png"
            open(path, "wb").write(png)
            saved = f"/logos/{sid}.png"
        elif ext == "svg" and len(data) >= 200:
            path = f"{OUT}/{sid}.svg"
            open(path, "wb").write(data)
            saved = f"/logos/{sid}.svg"
        else:
            continue
        if len(data) >= 800 or ext == "svg":
            break
    if not saved:
        return ("startup", sid, None, "no icon")
    return ("startup", sid, {
        "id": sid, "name": name, "website": final, "stage": stage, "funder": funder,
        "summary": desc, "logo": saved
    }, "ok")

def main():
    os.makedirs(OUT, exist_ok=True)
    funds, startups, fails = [], [], []
    rows = [("f", r) for r in FUNDS] + [("s", r) for r in STARTUPS]
    with ThreadPoolExecutor(max_workers=16) as pool:
        futs = []
        for kind, row in rows:
            futs.append(pool.submit(one_fund if kind == "f" else one_startup, row))
        for fut in as_completed(futs):
            kind, fid, rec, status = fut.result()
            if rec:
                (funds if kind == "fund" else startups).append(rec)
                print("ok", kind, fid, rec["logo"])
            else:
                fails.append((kind, fid, status))
                print("skip", kind, fid, status)
    open("/tmp/directory.json", "w").write(json.dumps({"funds": funds, "startups": startups}, indent=2))
    print("FUNDS", len(funds), "STARTUPS", len(startups), "FAILS", len(fails))

if __name__ == "__main__":
    main()
