#!/usr/bin/env python3
"""Add firms that return a real site icon, and lengthen descriptions already on file."""

import importlib.util
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

spec = importlib.util.spec_from_file_location("fd", "/workspace/scripts/fetch-directory.py")
fd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fd)

GEN = Path("/workspace/src/lib/seedstage/directory.generated.ts")
THEMES = [
    ("AI", r"\bAI\b|artificial intelligence"),
    ("Fintech", r"fintech|financial"),
    ("Climate", r"climate|decarbon"),
    ("Health", r"health|biotech|life science"),
    ("Security", r"cyber|security"),
    ("B2B software", r"B2B|saas|software"),
    ("Deep tech", r"deep tech|deep-tech"),
    ("Consumer", r"consumer"),
    ("Crypto", r"crypto|web3"),
    ("Defence", r"defence|defense"),
]

NEW_FUNDS = [
    ("zinc", "Zinc", "https://www.zinc.vc/", ["United Kingdom"]),
    ("dsv", "Deep Science Ventures", "https://www.deepscienceventures.com/", ["United Kingdom"]),
    ("jamjar", "JamJar", "https://www.jamjarinvestments.com/", ["United Kingdom"]),
    ("forceovermass", "Force Over Mass", "https://www.forceovermass.com/", ["United Kingdom"]),
    ("iqcapital", "IQ Capital", "https://www.iqcapital.vc/", ["United Kingdom"]),
    ("amadeuscap", "Amadeus Capital", "https://www.amadeuscapital.com/", ["United Kingdom", "Europe"]),
    ("parkwalk", "Parkwalk", "https://parkwalkadvisors.com/", ["United Kingdom"]),
    ("ose", "Oxford Science Enterprises", "https://www.oxfordscienceenterprises.com/", ["United Kingdom"]),
    ("cic", "Cambridge Innovation Capital", "https://www.cic.vc/", ["United Kingdom"]),
    ("mercia", "Mercia", "https://www.mercia.co.uk/", ["United Kingdom"]),
    ("beringea", "Beringea", "https://www.beringea.com/", ["United Kingdom", "United States"]),
    ("highland", "Highland Europe", "https://www.highlandeurope.com/", ["Europe", "United Kingdom"]),
    ("daphni", "Daphni", "https://daphni.com/", ["Europe"]),
    ("eurazeo", "Eurazeo", "https://www.eurazeo.com/", ["Europe"]),
    ("xange", "XAnge", "https://www.xange.fr/", ["Europe"]),
    ("frst", "Frst", "https://www.frst.vc/", ["Europe"]),
    ("atlanticlabs", "Atlantic Labs", "https://www.atlanticlabs.de/", ["Europe"]),
    ("possible", "Possible Ventures", "https://possible.vc/", ["Europe"]),
    ("tenxfounders", "10x Founders", "https://www.10xfounders.com/", ["Europe"]),
    ("uvc", "UVC Partners", "https://www.uvcpartners.com/", ["Europe"]),
    ("capnamic", "Capnamic", "https://www.capnamic.com/", ["Europe"]),
    ("b2venture", "b2venture", "https://www.b2venture.vc/", ["Europe"]),
    ("next47", "Next47", "https://next47.com/", ["Europe", "United States"]),
    ("twoonefivezero", "2150", "https://www.2150.vc/", ["Europe", "United Kingdom"]),
    ("planeta", "Planet A", "https://www.planet-a.com/", ["Europe"]),
    ("costanoa", "Costanoa", "https://www.costanoaventures.com/", ["United States"]),
    ("mayfield", "Mayfield", "https://www.mayfield.com/", ["United States"]),
    ("norwest", "Norwest", "https://www.nvp.com/", ["United States"]),
    ("foundationcap", "Foundation Capital", "https://foundationcapital.com/", ["United States"]),
    ("eightvc", "8VC", "https://8vc.com/", ["United States"]),
    ("addition", "Addition", "https://www.addition.com/", ["United States"]),
    ("greenoaks", "Greenoaks", "https://www.greenoaks.com/", ["United States"]),
    ("altimeter", "Altimeter", "https://www.altimeter.com/", ["United States"]),
    ("bondcap", "Bond", "https://www.bondcap.com/", ["United States"]),
    ("scalevp", "Scale Venture Partners", "https://www.scalevp.com/", ["United States"]),
    ("canvasvc", "Canvas Ventures", "https://www.canvas.vc/", ["United States"]),
    ("upfront", "Upfront", "https://upfront.com/", ["United States"]),
    ("playground", "Playground", "https://playground.global/", ["United States"]),
    ("eclipsevc", "Eclipse", "https://www.eclipse.vc/", ["United States"]),
    ("eightvc2", "Innovation Endeavors", "https://www.innovationendeavors.com/", ["United States"]),
    ("contrary", "Contrary", "https://contrary.com/", ["United States"]),
    ("spc", "South Park Commons", "https://www.southparkcommons.com/", ["United States"]),
    ("weekend", "Weekend Fund", "https://www.weekendfund.com/", ["United States"]),
    ("soma", "Soma Capital", "https://www.somacap.com/", ["United States"]),
    ("notation", "Notation", "https://notation.vc/", ["United States"]),
    ("compoundvc", "Compound", "https://www.compound.vc/", ["United States"]),
    ("boostvc", "Boost VC", "https://www.boost.vc/", ["United States"]),
    ("elevation", "Elevation Capital", "https://www.elevationcapital.com/", ["India"]),
    ("nexusvp", "Nexus Venture Partners", "https://nexusvp.com/", ["India", "United States"]),
    ("stellaris", "Stellaris", "https://www.stellarisvp.com/", ["India"]),
    ("threeonefour", "3one4", "https://www.3one4capital.com/", ["India"]),
    ("chiratae", "Chiratae", "https://chiratae.com/", ["India"]),
    ("kalaari", "Kalaari", "https://kalaari.com/", ["India"]),
    ("beenext", "Beenext", "https://www.beenext.com/", ["India", "Asia"]),
    ("loftyinc", "LoftyInc", "https://www.loftyinc.vc/", ["Africa"]),
    ("microtraction", "Microtraction", "https://www.microtraction.com/", ["Africa"]),
    ("launchafrica", "Launch Africa", "https://www.launchafrica.vc/", ["Africa"]),
    ("venturesplatform", "Ventures Platform", "https://venturesplatform.com/", ["Africa"]),
    ("kaszek", "Kaszek", "https://www.kaszek.com/", ["Latin America"]),
    ("monashees", "monashees", "https://www.monashees.com/", ["Latin America"]),
    ("valorcap", "Valor Capital", "https://www.valorcapitalgroup.com/", ["Latin America", "United States"]),
    ("canary", "Canary", "https://www.canary.com.br/", ["Latin America"]),
    ("allvp", "ALLVP", "https://www.allvp.vc/", ["Latin America"]),
    ("ignia", "IGNIA", "https://www.ignia.mx/", ["Latin America"]),
    ("dcm", "DCM", "https://www.dcm.com/", ["Asia", "United States"]),
    ("globis", "Globis Capital", "https://www.globiscapital.co.jp/en/", ["Japan"]),
    ("jafco", "JAFCO", "https://www.jafco.co.jp/english/", ["Japan"]),
    ("openspace", "Openspace", "https://www.openspacevc.com/", ["Asia"]),
    ("wavemaker", "Wavemaker", "https://wavemaker.vc/", ["Asia"]),
    ("goldengate", "Golden Gate Ventures", "https://www.goldengate.vc/", ["Asia"]),
    ("cocoon", "Cocoon Capital", "https://www.cocooncap.com/", ["Asia"]),
    ("hongshan", "HongShan", "https://www.hongshan.com/", ["Asia"]),
    ("zhenfund", "ZhenFund", "https://www.zhenfund.com/", ["Asia"]),
    ("sinovation", "Sinovation", "https://www.sinovationventures.com/", ["Asia", "United States"]),
    ("paradigm", "Paradigm", "https://www.paradigm.xyz/", ["United States"]),
    ("electric", "Electric Capital", "https://www.electriccapital.com/", ["United States"]),
    ("placeholder", "Placeholder", "https://www.placeholder.vc/", ["United States"]),
    ("variant", "Variant", "https://variant.fund/", ["United States"]),
    ("dragonfly", "Dragonfly", "https://www.dragonfly.xyz/", ["United States", "Asia"]),
    ("hackvc", "Hack VC", "https://www.hack.vc/", ["United States"]),
    ("multicoin", "Multicoin", "https://multicoin.capital/", ["United States"]),
    ("pantera", "Pantera", "https://pantera.capital/", ["United States"]),
    ("onekx", "1kx", "https://1kx.network/", ["Europe", "United States"]),
    ("balderton", "Balderton", "https://www.balderton.com/", ["United Kingdom", "Europe"]),
    ("atomico", "Atomico", "https://www.atomico.com/", ["Europe", "United Kingdom"]),
    ("seedcamp", "Seedcamp", "https://seedcamp.com/", ["United Kingdom", "Europe"]),
    ("octopus", "Octopus Ventures", "https://octopusventures.com/", ["United Kingdom", "Europe"]),
    ("hoxton", "Hoxton Ventures", "https://hoxtonventures.com/", ["Europe", "United Kingdom"]),
    ("lakestar", "Lakestar", "https://www.lakestar.com/", ["Europe", "United Kingdom"]),
    ("pear", "Pear VC", "https://www.pear.vc/", ["United States"]),
    ("sosv", "SOSV", "https://sosv.com/", ["United States", "Europe"]),
    ("lightspeed", "Lightspeed", "https://lsvp.com/", ["United States", "Europe", "United Kingdom"]),
    ("menlo", "Menlo Ventures", "https://menlovc.com/", ["United States"]),
    ("battery", "Battery Ventures", "https://www.battery.com/", ["United States"]),
    ("redpoint", "Redpoint", "https://www.redpoint.com/", ["United States"]),
    ("benchmark", "Benchmark", "https://www.benchmark.com/", ["United States"]),
    ("stride", "Stride.VC", "https://www.stride.vc/", ["United Kingdom"]),
    ("plural", "Plural", "https://www.pluralplatform.com/", ["Europe", "United Kingdom"]),
    ("paleblue", "Pale Blue Dot", "https://paleblue.vc/", ["Europe"]),
    ("blume", "Blume", "https://blume.vc/", ["India"]),
    ("latitude", "Latitude", "https://www.latitude.vc/", ["United Kingdom", "Europe"]),
    ("creatorfund", "Creator Fund", "https://www.creatorfund.com/", ["United Kingdom", "Europe"]),
    ("carbon13", "Carbon13", "https://carbonthirteen.com/", ["United Kingdom"]),
    ("systemiq", "Systemiq Capital", "https://www.systemiq.earth/", ["Europe", "United Kingdom"]),
    ("worldfund2", "World Fund", "https://www.worldfund.vc/", ["Europe"]),
    ("localglobe2", "Phoenix Court", "https://www.phoenixcourt.vc/", ["United Kingdom"]),
    ("m12", "M12", "https://m12.vc/", ["United States"]),
    ("salesforcev", "Salesforce Ventures", "https://salesforceventures.com/", ["United States"]),
    ("intelcap", "Intel Capital", "https://www.intelcapital.com/", ["United States"]),
    ("samsungnext", "Samsung Next", "https://www.samsungnext.com/", ["United States"]),
    ("pioneer", "Pioneer", "https://www.pioneerfund.vc/", ["United States"]),
    ("airtree", "AirTree", "https://www.airtree.vc/", ["Australia"]),
    ("squarepeg", "Square Peg", "https://www.squarepeg.vc/", ["Australia", "Asia"]),
    ("blackbird", "Blackbird", "https://www.blackbird.vc/", ["Australia"]),
    ("galileo", "Galileo", "https://www.galileo.vc/", ["United States"]),
    ("footwork", "Footwork", "https://www.footwork.vc/", ["United States"]),
    ("sparklegacy", "Headline", "https://headline.com/", ["Europe", "United States"]),
    ("cherryventures", "Cherry", "https://cherry.vc/", ["Europe"]),
]

NEW_STARTUPS = [
    ("elevenlabs2", "ElevenLabs", "https://elevenlabs.io/", "Early"),
    ("synthesia2", "Synthesia", "https://www.synthesia.io/", "Early"),
    ("photoroom2", "Photoroom", "https://www.photoroom.com/", "Early"),
    ("dust2", "Dust", "https://dust.tt/", "Seed"),
    ("granola2", "Granola", "https://www.granola.ai/", "Seed"),
    ("resend2", "Resend", "https://resend.com/", "Seed"),
    ("linearapp", "Linear", "https://linear.app/", "Early"),
    ("raycast", "Raycast", "https://www.raycast.com/", "Early"),
    ("arc", "The Browser Company", "https://thebrowser.company/", "Early"),
    ("perplexity2", "Perplexity", "https://www.perplexity.ai/", "Early"),
    ("cursor2", "Cursor", "https://cursor.com/", "Early"),
    ("replit2", "Replit", "https://replit.com/", "Early"),
    ("v0", "v0", "https://v0.app/", "Early"),
    ("lovable2", "Lovable", "https://lovable.dev/", "Seed"),
    ("bolt2", "Bolt", "https://bolt.new/", "Seed"),
    ("windsurf", "Windsurf", "https://windsurf.com/", "Early"),
    ("devin", "Devin", "https://devin.ai/", "Early"),
    ("magic2", "Magic", "https://magic.dev/", "Seed"),
    ("poolside2", "Poolside", "https://poolside.ai/", "Early"),
    ("sakana2", "Sakana", "https://sakana.ai/", "Early"),
    ("cohere", "Cohere", "https://cohere.com/", "Early"),
    ("mistral2", "Mistral", "https://mistral.ai/", "Early"),
    ("adept2", "Adept", "https://www.adept.ai/", "Early"),
    ("glean2", "Glean", "https://www.glean.com/", "Early"),
    ("writer2", "Writer", "https://writer.com/", "Early"),
    ("jasper", "Jasper", "https://www.jasper.ai/", "Early"),
    ("copyai2", "Copy.ai", "https://www.copy.ai/", "Seed"),
    ("regie2", "Regie.ai", "https://www.regie.ai/", "Seed"),
    ("clay2", "Clay", "https://www.clay.com/", "Early"),
    ("apollo", "Apollo", "https://www.apollo.io/", "Early"),
    ("outreach", "Outreach", "https://www.outreach.io/", "Early"),
    ("gong", "Gong", "https://www.gong.io/", "Early"),
    ("clari", "Clari", "https://www.clari.com/", "Early"),
    ("peopleai", "People.ai", "https://www.people.ai/", "Early"),
    ("6sense", "6sense", "https://6sense.com/", "Early"),
    ("commonroom", "Common Room", "https://www.commonroom.io/", "Seed"),
    ("warmly", "Warmly", "https://www.warmly.ai/", "Seed"),
    ("unify", "Unify", "https://www.unifygtm.com/", "Seed"),
    ("defaultcom", "Default", "https://www.default.com/", "Seed"),
    ("endgame", "Endgame", "https://www.endgame.io/", "Seed"),
    ("pocus2", "Pocus", "https://www.pocus.com/", "Seed"),
    ("tavus2", "Tavus", "https://www.tavus.io/", "Seed"),
    ("heygen2", "HeyGen", "https://www.heygen.com/", "Early"),
    ("captions2", "Captions", "https://captions.ai/", "Seed"),
    ("descript2", "Descript", "https://www.descript.com/", "Early"),
    ("opus2", "OpusClip", "https://www.opus.pro/", "Seed"),
    ("runwayml", "Runway", "https://runwayml.com/", "Early"),
    ("pika2", "Pika", "https://pika.art/", "Seed"),
    ("luma2", "Luma", "https://lumalabs.ai/", "Early"),
    ("krea2", "Krea", "https://www.krea.ai/", "Seed"),
    ("ideogram2", "Ideogram", "https://ideogram.ai/", "Seed"),
    ("suno2", "Suno", "https://suno.com/", "Early"),
    ("udio", "Udio", "https://www.udio.com/", "Seed"),
    ("eleven2", "ElevenLabs", "https://elevenlabs.io/", "Early"),
    ("speechify", "Speechify", "https://speechify.com/", "Early"),
    ("gamma3", "Gamma", "https://gamma.app/", "Seed"),
    ("tome2", "Tome", "https://tome.app/", "Seed"),
    ("beautiful", "Beautiful.ai", "https://www.beautiful.ai/", "Early"),
    ("pitch2", "Pitch", "https://pitch.com/", "Early"),
    ("coda2", "Coda", "https://coda.io/", "Early"),
    ("notion2", "Notion", "https://www.notion.so/", "Early"),
    ("mem2", "Mem", "https://mem.ai/", "Seed"),
    ("limitless2", "Limitless", "https://www.limitless.ai/", "Seed"),
    ("rewind", "Rewind", "https://www.rewind.ai/", "Seed"),
    ("fathom2", "Fathom", "https://fathom.video/", "Seed"),
    ("grain2", "Grain", "https://grain.com/", "Seed"),
    ("circleback", "Circleback", "https://circleback.ai/", "Seed"),
    ("fireflies2", "Fireflies", "https://fireflies.ai/", "Seed"),
    ("superhuman2", "Superhuman", "https://superhuman.com/", "Early"),
    ("shortwave", "Shortwave", "https://www.shortwave.com/", "Seed"),
    ("missive", "Missive", "https://missiveapp.com/", "Seed"),
    ("front", "Front", "https://front.com/", "Early"),
    ("plain", "Plain", "https://www.plain.com/", "Seed"),
    ("pylon", "Pylon", "https://www.usepylon.com/", "Seed"),
    ("ashby2", "Ashby", "https://www.ashbyhq.com/", "Early"),
    ("dover", "Dover", "https://www.dover.com/", "Seed"),
    ("gem", "Gem", "https://www.gem.com/", "Early"),
    ("lever", "Lever", "https://www.lever.co/", "Early"),
    ("greenhouse", "Greenhouse", "https://www.greenhouse.com/", "Early"),
    ("rippling2", "Rippling", "https://www.rippling.com/", "Early"),
    ("deel2", "Deel", "https://www.deel.com/", "Early"),
    ("remote2", "Remote", "https://remote.com/", "Early"),
    ("oyster", "Oyster", "https://www.oysterhr.com/", "Early"),
    ("papaya", "Papaya Global", "https://www.papayaglobal.com/", "Early"),
    ("mercury2", "Mercury", "https://mercury.com/", "Early"),
    ("brex2", "Brex", "https://www.brex.com/", "Early"),
    ("ramp2", "Ramp", "https://ramp.com/", "Early"),
    ("brex3", "Arc", "https://arc.tech/", "Seed"),
    ("pulley2", "Pulley", "https://pulley.com/", "Seed"),
    ("carta2", "Carta", "https://carta.com/", "Early"),
    ("angellist2", "AngelList", "https://www.angellist.com/", "Early"),
    ("clerky2", "Clerky", "https://www.clerky.com/", "Seed"),
    ("seedlegals2", "SeedLegals", "https://seedlegals.com/", "Seed"),
    ("cake", "Cake Equity", "https://www.cakeequity.com/", "Seed"),
    ("capdesk2", "Capdesk", "https://www.capdesk.com/", "Seed"),
    ("ledgy", "Ledgy", "https://ledgy.com/", "Seed"),
    ("vestd", "Vestd", "https://www.vestd.com/", "Seed"),
    ("vanta2", "Vanta", "https://www.vanta.com/", "Early"),
    ("drata2", "Drata", "https://drata.com/", "Early"),
    ("secureframe", "Secureframe", "https://secureframe.com/", "Seed"),
    ("sprinto2", "Sprinto", "https://sprinto.com/", "Seed"),
    ("hadrianio", "Hadrian", "https://hadrian.io/", "Seed"),
    ("wiz", "Wiz", "https://www.wiz.io/", "Early"),
    ("snyk", "Snyk", "https://snyk.io/", "Early"),
    ("chainguard", "Chainguard", "https://www.chainguard.dev/", "Early"),
    ("socket", "Socket", "https://socket.dev/", "Seed"),
    ("semgrep", "Semgrep", "https://semgrep.dev/", "Early"),
    ("invariant", "Invariant Labs", "https://invariantlabs.ai/", "Seed"),
    ("lakera", "Lakera", "https://www.lakera.ai/", "Seed"),
    ("hiddenlayer", "HiddenLayer", "https://hiddenlayer.com/", "Seed"),
    ("protectai", "Protect AI", "https://protectai.com/", "Seed"),
    ("robust", "Robust Intelligence", "https://www.robustintelligence.com/", "Seed"),
    ("braintrust2", "Braintrust", "https://www.braintrust.dev/", "Seed"),
    ("langfuse2", "Langfuse", "https://langfuse.com/", "Seed"),
    ("helicone2", "Helicone", "https://www.helicone.ai/", "Seed"),
    ("langchain2", "LangChain", "https://www.langchain.com/", "Early"),
    ("llamaindex", "LlamaIndex", "https://www.llamaindex.ai/", "Seed"),
    ("chroma", "Chroma", "https://www.trychroma.com/", "Seed"),
    ("weaviate", "Weaviate", "https://weaviate.io/", "Early"),
    ("pinecone", "Pinecone", "https://www.pinecone.io/", "Early"),
    ("qdrant", "Qdrant", "https://qdrant.tech/", "Seed"),
    ("modal", "Modal", "https://modal.com/", "Seed"),
    ("baseten", "Baseten", "https://www.baseten.co/", "Seed"),
    ("replicate", "Replicate", "https://replicate.com/", "Early"),
    ("together", "Together AI", "https://www.together.ai/", "Early"),
    ("fireworks", "Fireworks", "https://fireworks.ai/", "Seed"),
    ("groq", "Groq", "https://groq.com/", "Early"),
    ("cerebras", "Cerebras", "https://www.cerebras.ai/", "Early"),
    ("anyscale", "Anyscale", "https://www.anyscale.com/", "Early"),
    ("weights2", "Weights & Biases", "https://wandb.ai/", "Early"),
    ("labelbox", "Labelbox", "https://labelbox.com/", "Early"),
    ("scale2", "Scale", "https://scale.com/", "Early"),
    ("snorkel", "Snorkel", "https://snorkel.ai/", "Early"),
    ("arize", "Arize", "https://arize.com/", "Seed"),
    ("whyLabs", "WhyLabs", "https://whylabs.ai/", "Seed"),
    ("fiddler", "Fiddler", "https://www.fiddler.ai/", "Seed"),
    ("humanloop", "Humanloop", "https://humanloop.com/", "Seed"),
    ("vellum", "Vellum", "https://www.vellum.ai/", "Seed"),
    ("promptlayer", "PromptLayer", "https://promptlayer.com/", "Seed"),
    ("langchainhub", "LangSmith", "https://smith.langchain.com/", "Early"),
    ("browserbase2", "Browserbase", "https://www.browserbase.com/", "Seed"),
    ("exa2", "Exa", "https://exa.ai/", "Seed"),
    ("tavily2", "Tavily", "https://tavily.com/", "Seed"),
    ("parallelweb", "Parallel", "https://parallel.ai/", "Seed"),
    ("youcom", "You.com", "https://you.com/", "Early"),
    ("phind", "Phind", "https://www.phind.com/", "Seed"),
    ("sourcegraph", "Sourcegraph", "https://sourcegraph.com/", "Early"),
    ("tabnine", "Tabnine", "https://www.tabnine.com/", "Early"),
    ("codeium", "Codeium", "https://codeium.com/", "Early"),
    ("continue", "Continue", "https://www.continue.dev/", "Seed"),
    ("aider", "Aider", "https://aider.chat/", "Seed"),
    ("mentat", "Mentat", "https://mentat.ai/", "Seed"),
    ("cursorcom", "Anysphere", "https://anysphere.inc/", "Early"),
    ("harvey2", "Harvey", "https://www.harvey.ai/", "Early"),
    ("casetext", "Casetext", "https://casetext.com/", "Early"),
    ("evenup2", "EvenUp", "https://www.evenuplaw.com/", "Early"),
    ("spellbook2", "Spellbook", "https://www.spellbook.legal/", "Seed"),
    ("robin2", "Robin AI", "https://www.robinai.com/", "Seed"),
    ("luminance", "Luminance", "https://www.luminance.com/", "Early"),
    ("kira", "Kira", "https://kirasystems.com/", "Early"),
    ("ironclad", "Ironclad", "https://ironcladapp.com/", "Early"),
    ("juro", "Juro", "https://juro.com/", "Seed"),
    ("pactum", "Pactum", "https://pactum.com/", "Seed"),
    ("linksquares", "LinkSquares", "https://linksquares.com/", "Early"),
    ("eve", "Eve", "https://www.eve.legal/", "Seed"),
    ("gcai", "GC AI", "https://gc.ai/", "Seed"),
    ("norm", "Norm AI", "https://www.norm.ai/", "Seed"),
    ("hebbia2", "Hebbia", "https://www.hebbia.ai/", "Early"),
    ("alpha", "AlphaSense", "https://www.alpha-sense.com/", "Early"),
    ("celonis", "Celonis", "https://www.celonis.com/", "Early"),
    ("uipath", "UiPath", "https://www.uipath.com/", "Early"),
    ("automationanywhere", "Automation Anywhere", "https://www.automationanywhere.com/", "Early"),
    ("adeptai", "MultiOn", "https://www.multion.ai/", "Seed"),
    ("lindy2", "Lindy", "https://www.lindy.ai/", "Seed"),
    ("bardeen2", "Bardeen", "https://www.bardeen.ai/", "Seed"),
    ("relay", "Relay", "https://www.relay.app/", "Seed"),
    ("make", "Make", "https://www.make.com/", "Early"),
    ("n8n", "n8n", "https://n8n.io/", "Early"),
    ("zapier", "Zapier", "https://zapier.com/", "Early"),
    ("retool", "Retool", "https://retool.com/", "Early"),
    ("supabase2", "Supabase", "https://supabase.com/", "Early"),
    ("firebase", "Firebase", "https://firebase.google.com/", "Early"),
    ("neon2", "Neon", "https://neon.tech/", "Early"),
    ("planetscale", "PlanetScale", "https://planetscale.com/", "Early"),
    ("xata", "Xata", "https://xata.io/", "Seed"),
    ("convex", "Convex", "https://www.convex.dev/", "Seed"),
    ("tinybird", "Tinybird", "https://www.tinybird.co/", "Early"),
    ("clickhouse", "ClickHouse", "https://clickhouse.com/", "Early"),
    ("motherduck", "MotherDuck", "https://motherduck.com/", "Seed"),
    ("materialize", "Materialize", "https://materialize.com/", "Early"),
    ("dbt", "dbt Labs", "https://www.getdbt.com/", "Early"),
    ("fivetran", "Fivetran", "https://www.fivetran.com/", "Early"),
    ("airbyte", "Airbyte", "https://airbyte.com/", "Early"),
    ("census", "Census", "https://www.getcensus.com/", "Seed"),
    ("hightouch", "Hightouch", "https://hightouch.com/", "Early"),
    ("segment", "Segment", "https://segment.com/", "Early"),
    ("posthog", "PostHog", "https://posthog.com/", "Early"),
    ("amplitude", "Amplitude", "https://amplitude.com/", "Early"),
    ("mixpanel", "Mixpanel", "https://mixpanel.com/", "Early"),
    ("june", "June", "https://www.june.so/", "Seed"),
    ("aptabase", "Aptabase", "https://aptabase.com/", "Seed"),
    ("plausible", "Plausible", "https://plausible.io/", "Seed"),
    ("umami", "Umami", "https://umami.is/", "Seed"),
    ("sentry", "Sentry", "https://sentry.io/", "Early"),
    ("highlight", "Highlight", "https://www.highlight.io/", "Seed"),
    ("logrocket", "LogRocket", "https://logrocket.com/", "Early"),
    ("fullstory", "FullStory", "https://www.fullstory.com/", "Early"),
    ("hotjar", "Hotjar", "https://www.hotjar.com/", "Early"),
    ("maze", "Maze", "https://maze.co/", "Early"),
    ("sprig", "Sprig", "https://sprig.com/", "Seed"),
    ("dovetail", "Dovetail", "https://dovetail.com/", "Early"),
    ("notioncal", "Cron", "https://cron.com/", "Seed"),
    ("reclaim", "Reclaim", "https://reclaim.ai/", "Seed"),
    ("clockwise", "Clockwise", "https://www.getclockwise.com/", "Seed"),
    ("motion", "Motion", "https://www.usemotion.com/", "Seed"),
    ("sunsama", "Sunsama", "https://www.sunsama.com/", "Seed"),
    ("akiflow", "Akiflow", "https://akiflow.com/", "Seed"),
    ("todoist", "Todoist", "https://todoist.com/", "Early"),
    ("height", "Height", "https://height.app/", "Seed"),
    ("linear2", "Linear", "https://linear.app/", "Early"),
    ("asana", "Asana", "https://asana.com/", "Early"),
    ("monday", "monday.com", "https://monday.com/", "Early"),
    ("clickup", "ClickUp", "https://clickup.com/", "Early"),
    ("coda3", "Coda", "https://coda.io/", "Early"),
    ("airtable2", "Airtable", "https://www.airtable.com/", "Early"),
    ("rows2", "Rows", "https://rows.com/", "Seed"),
    ("equals", "Equals", "https://equals.com/", "Seed"),
    ("causal2", "Causal", "https://causal.app/", "Seed"),
    ("runwayfin", "Runway", "https://runway.com/", "Seed"),
    ("pigment2", "Pigment", "https://www.pigment.com/", "Early"),
    ("anaplan", "Anaplan", "https://www.anaplan.com/", "Early"),
    ("mosaicfi", "Mosaic", "https://www.mosaic.tech/", "Seed"),
    ("puzzle", "Puzzle", "https://puzzle.io/", "Seed"),
    ("pilot", "Pilot", "https://pilot.com/", "Early"),
    ("bench", "Bench", "https://bench.co/", "Early"),
    ("finta", "Finta", "https://www.finta.com/", "Seed"),
    ("digits", "Digits", "https://digits.com/", "Seed"),
    ("brexbooks", "Digits", "https://digits.com/", "Seed"),
    ("rampfinance", "Ramp", "https://ramp.com/", "Early"),
    ("pleo2", "Pleo", "https://www.pleo.io/", "Early"),
    ("spendesk2", "Spendesk", "https://www.spendesk.com/", "Early"),
    ("payhawk", "Payhawk", "https://payhawk.com/", "Early"),
    ("soldo", "Soldo", "https://www.soldo.com/", "Early"),
    ("moss", "Moss", "https://www.getmoss.com/", "Seed"),
    ("pennylane2", "Pennylane", "https://www.pennylane.com/", "Early"),
    ("qonto2", "Qonto", "https://qonto.com/", "Early"),
    ("tide2", "Tide", "https://www.tide.co/", "Early"),
    ("starling2", "Starling", "https://www.starlingbank.com/", "Early"),
    ("monzo2", "Monzo", "https://monzo.com/", "Early"),
    ("revolut2", "Revolut", "https://www.revolut.com/", "Early"),
    ("wise2", "Wise", "https://wise.com/", "Early"),
    ("gocardless2", "GoCardless", "https://gocardless.com/", "Early"),
    ("checkout2", "Checkout.com", "https://www.checkout.com/", "Early"),
    ("adyen", "Adyen", "https://www.adyen.com/", "Early"),
    ("stripe2", "Stripe", "https://stripe.com/", "Early"),
    ("plaid2", "Plaid", "https://plaid.com/", "Early"),
    ("truelayer", "TrueLayer", "https://truelayer.com/", "Early"),
    ("yapily", "Yapily", "https://www.yapily.com/", "Seed"),
    ("tink", "Tink", "https://tink.com/", "Early"),
    ("modulr", "Modulr", "https://www.modulrfinance.com/", "Early"),
    ("railsr", "Railsr", "https://www.railsr.com/", "Early"),
    ("thoughtmachine", "Thought Machine", "https://www.thoughtmachine.net/", "Early"),
    ("10xbanking", "10x Banking", "https://www.10xbanking.com/", "Early"),
    ("form3", "Form3", "https://www.form3.tech/", "Early"),
    ("currencycloud", "Currencycloud", "https://www.currencycloud.com/", "Early"),
    ("nium", "Nium", "https://www.nium.com/", "Early"),
    ("airwallex", "Airwallex", "https://www.airwallex.com/", "Early"),
    ("payoneer", "Payoneer", "https://www.payoneer.com/", "Early"),
    ("rapyd", "Rapyd", "https://www.rapyd.net/", "Early"),
    ("dlocal", "dLocal", "https://www.dlocal.com/", "Early"),
    ("ebanx", "EBANX", "https://www.ebanx.com/", "Early"),
    ("klarna", "Klarna", "https://www.klarna.com/", "Early"),
    ("affirm", "Affirm", "https://www.affirm.com/", "Early"),
    ("afterpay", "Afterpay", "https://www.afterpay.com/", "Early"),
    ("scalapay", "Scalapay", "https://www.scalapay.com/", "Early"),
    ("alma", "Alma", "https://almapay.com/", "Early"),
    ("billie", "Billie", "https://www.billie.io/", "Seed"),
    ("hokodo", "Hokodo", "https://www.hokodo.co/", "Seed"),
    ("previse", "Previse", "https://www.previse.co.uk/", "Seed"),
    ("liberis", "Liberis", "https://www.liberis.com/", "Early"),
    ("iwoca", "iwoca", "https://www.iwoca.co.uk/", "Early"),
    ("fundingcircle", "Funding Circle", "https://www.fundingcircle.com/", "Early"),
    ("oaknorth", "OakNorth", "https://www.oaknorth.com/", "Early"),
    ("starlingb", "Starling", "https://www.starlingbank.com/", "Early"),
    ("zopa", "Zopa", "https://www.zopa.com/", "Early"),
    ("monzo3", "Monzo", "https://monzo.com/", "Early"),
    ("chip", "Chip", "https://www.getchip.uk/", "Seed"),
    ("plum", "Plum", "https://withplum.com/", "Seed"),
    ("cleo", "Cleo", "https://web.meetcleo.com/", "Early"),
    ("emma", "Emma", "https://emma-app.com/", "Seed"),
    ("snoop", "Snoop", "https://www.snoop.app/", "Seed"),
    ("cushon", "Cushon", "https://www.cushon.co.uk/", "Early"),
    ("pensionbee", "PensionBee", "https://www.pensionbee.com/", "Early"),
    ("smartpension", "Smart Pension", "https://www.smartpension.co.uk/", "Early"),
    ("freetrade", "Freetrade", "https://freetrade.io/", "Early"),
    ("trading212", "Trading 212", "https://www.trading212.com/", "Early"),
    ("etoro", "eToro", "https://www.etoro.com/", "Early"),
    ("robinhood", "Robinhood", "https://robinhood.com/", "Early"),
    ("publiccom", "Public", "https://public.com/", "Early"),
    ("wealthsimple", "Wealthsimple", "https://www.wealthsimple.com/", "Early"),
    ("betterment", "Betterment", "https://www.betterment.com/", "Early"),
    ("nutmeg", "Nutmeg", "https://www.nutmeg.com/", "Early"),
    ("moneybox", "Moneybox", "https://www.moneyboxapp.com/", "Early"),
    ("chip2", "Chip", "https://www.getchip.uk/", "Seed"),
]

def themes_from(text):
    found = []
    for label, pat in THEMES:
        if re.search(pat, text, re.I):
            found.append(label)
    return found[:4]

def longer(url):
    try:
        html_b, final, _ = fd.get(url, limit=400_000)
    except Exception:
        return None
    html = html_b.decode("utf-8", "ignore")
    desc = fd.meta(html, "name", "description") or fd.meta(html, "property", "og:description") or ""
    # first paragraph
    paras = re.findall(r"<p[^>]*>(.*?)</p>", html, re.I | re.S)
    extra = ""
    for para in paras:
        text = fd.clean(para)
        if len(text) > 80 and "cookie" not in text.lower() and "subscribe" not in text.lower():
            extra = text
            break
    body = desc
    if extra and extra not in desc:
        body = (desc + " " + extra).strip()
    body = re.sub(r"\S+@\S+", "", body)
    body = re.sub(r"\s+", " ", body).strip()[:700]
    if len(body) < 40:
        return None
    return body, themes_from(html[:80_000]), final

def existing_ids():
    text = GEN.read_text()
    ids = set(re.findall(r'id: "([^"]+)"', text))
    # hand-written
    for path in ["/workspace/src/lib/seedstage/public-investors.ts", "/workspace/src/lib/seedstage/startups.ts"]:
        ids.update(re.findall(r'id: "([^"]+)"', Path(path).read_text()))
    return ids

def main():
    have = existing_ids()
    names = set(json.loads(n) for n in re.findall(r'(?:firm|name): ("[^"]*")', GEN.read_text()))
    # lengthen current generated excerpts
    text = GEN.read_text()
    blocks = re.findall(r"sourceUrl: \"([^\"]+)\",\n    sourceDate: \"2026-11-20\",\n    excerpt: \"((?:\\.|[^\"])*)\"", text)
    # excerpts are json-escaped. parse pairs more safely
    pairs = re.findall(r'sourceUrl: (".*?"),\n    sourceDate: "2026-11-20",\n    excerpt: (".*?"),', text)
    updates = {}
    urls = []
    for url_js, excerpt_js in pairs:
        url = json.loads(url_js)
        urls.append(url)
    print("refresh", len(urls))
    with ThreadPoolExecutor(12) as pool:
        futs = {pool.submit(longer, url): url for url in urls}
        for fut in as_completed(futs):
            url = futs[fut]
            got = fut.result()
            if not got:
                continue
            body, themes, _ = got
            if len(body) > 80:
                updates[url] = (body, themes)
    print("lengthened", len(updates))

    def replacer(m):
        url = json.loads(m.group(1))
        if url not in updates:
            return m.group(0)
        body, themes = updates[url]
        theme_line = ""
        if themes and "themes: []" in m.string[max(0, m.start()-800):m.start()]:
            theme_line = ""  # applied below
        return f'sourceUrl: {json.dumps(url)},\n    sourceDate: "2026-11-20",\n    excerpt: {json.dumps(body, ensure_ascii=False)},'

    new_text = re.sub(
        r'sourceUrl: (".*?"),\n    sourceDate: "2026-11-20",\n    excerpt: (".*?"),',
        replacer,
        text,
    )
    # fill empty themes when we learned some, only the next themes: [] after that url is hard.
    # do a second pass per url
    for url, (body, themes) in updates.items():
        if not themes:
            continue
        url_js = json.dumps(url)
        # replace the first themes: [] that appears before this sourceUrl within the object — skip if risky
        pattern = r'(themes: )\[\](,[\s\S]{0,400}?sourceUrl: ' + re.escape(url_js) + r')'
        new_text2, n = re.subn(pattern, lambda m, t=themes: m.group(1) + json.dumps(t) + m.group(2), new_text, count=1)
        if n:
            new_text = new_text2

    funds = []
    startups = []
    rows_f = [r for r in NEW_FUNDS if r[0] not in have]
    rows_s = [r for r in NEW_STARTUPS if r[0] not in have]
    print("try funds", len(rows_f), "startups", len(rows_s))
    with ThreadPoolExecutor(14) as pool:
        futs = []
        for row in rows_f:
            futs.append(pool.submit(fd.one_fund, row))
        for sid, name, url, stage in rows_s:
            futs.append(pool.submit(fd.one_startup, (sid, name, url, stage, "")))
        for fut in as_completed(futs):
            kind, fid, rec, status = fut.result()
            if not rec:
                print("skip", kind, fid, status)
                continue
            print("ok", kind, fid)
            (funds if kind == "fund" else startups).append(rec)

    # append TS before the closing of each array is messy. Rebuild additions.
    fund_chunks = []
    for f in funds:
        if f["id"] in have or f["firm"] in names:
            continue
        geos = ", ".join(json.dumps(g) for g in f["geos"])
        body = f["excerpt"]
        th = themes_from(body)
        fund_chunks.append(
            "  {\n"
            f"    id: {json.dumps(f['id'])},\n"
            f"    firm: {json.dumps(f['firm'])},\n"
            f"    fund: {json.dumps(f['firm'])},\n"
            "    partner: null,\n"
            '    stages: ["seed"],\n'
            f"    geos: [{geos}],\n"
            "    geoExclusions: [],\n"
            "    sectors: [],\n"
            "    sectorExclusions: [],\n"
            "    sectorExclusive: false,\n"
            "    chequeMinMinor: 0,\n"
            "    chequeMaxMinor: 0,\n"
            '    participation: "unstated",\n'
            f"    themes: {json.dumps(th)},\n"
            "    portfolio: [],\n"
            "    activityDate: null,\n"
            '    source: "Company site",\n'
            f"    sourceUrl: {json.dumps(f['url'])},\n"
            '    sourceDate: "2026-11-20",\n'
            f"    excerpt: {json.dumps(body, ensure_ascii=False)},\n"
            '    note: "",\n'
            f"    logo: {json.dumps(f['logo'])},\n"
            "    synthetic: false,\n"
            "    confirmed: false,\n"
            '    currency: "GBP",\n'
            "  }"
        )
    startup_chunks = []
    for s in startups:
        if s["id"] in have or s["name"] in names:
            continue
        startup_chunks.append(
            "  {\n"
            f"    id: {json.dumps(s['id'])},\n"
            f"    name: {json.dumps(s['name'])},\n"
            f"    website: {json.dumps(s['website'])},\n"
            f"    logo: {json.dumps(s['logo'])},\n"
            f"    stage: {json.dumps(s['stage'])},\n"
            "    round: null,\n"
            f"    summary: {json.dumps(s['summary'], ensure_ascii=False)},\n"
            "    person: null,\n"
            '    funder: "",\n'
            '    source: "Company site",\n'
            f"    sourceUrl: {json.dumps(s['website'])},\n"
            "  }"
        )
    if fund_chunks:
        new_text = new_text.replace(
            "\n];\n\nexport const extraStartups",
            ",\n" + ",\n".join(fund_chunks) + "\n];\n\nexport const extraStartups",
            1,
        )
    if startup_chunks:
        if not new_text.rstrip().endswith("];"):
            raise SystemExit("unexpected ending")
        new_text = new_text.rstrip()
        if new_text.endswith("];"):
            new_text = new_text[:-2] + ",\n" + ",\n".join(startup_chunks) + "\n];\n"
    GEN.write_text(new_text)
    print("ADDED funds", len(fund_chunks), "startups", len(startup_chunks))

if __name__ == "__main__":
    main()
