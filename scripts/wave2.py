#!/usr/bin/env python3
"""Append firms and companies whose own sites return an icon and a description."""

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
    ("pilabs", "Pi Labs", "https://pilabs.co.uk/", ["United Kingdom"]),
    ("pentech", "Pentech", "https://www.pentech.vc/", ["United Kingdom", "Europe"]),
    ("concentric", "Concentric", "https://www.concentric.vc/", ["United Kingdom", "Europe"]),
    ("angularvc", "Angular Ventures", "https://www.angularventures.com/", ["United Kingdom", "Europe"]),
    ("moonfire", "Moonfire", "https://www.moonfire.com/", ["United Kingdom", "Europe"]),
    ("outsized", "Outsized", "https://www.outsized.vc/", ["United Kingdom"]),
    ("formvc", "Form Ventures", "https://www.formventures.vc/", ["United Kingdom"]),
    ("twinpath", "Twin Path", "https://www.twinpath.vc/", ["United Kingdom"]),
    ("sfccap", "SFC Capital", "https://sfccapital.com/", ["United Kingdom"]),
    ("foresightg", "Foresight", "https://www.foresight.group/", ["United Kingdom"]),
    ("calculus", "Calculus", "https://www.calculuscapital.com/", ["United Kingdom"]),
    ("oxcp", "Oxford Capital", "https://www.oxcp.com/", ["United Kingdom"]),
    ("albion", "Albion", "https://www.albion.capital/", ["United Kingdom"]),
    ("sepuk", "Scottish Equity Partners", "https://www.sep.co.uk/", ["United Kingdom"]),
    ("abven", "Atlantic Bridge", "https://www.abven.com/", ["United Kingdom", "Europe"]),
    ("surevalley", "Sure Valley", "https://www.surevalleyventures.com/", ["United Kingdom", "Europe"]),
    ("techstart", "Techstart", "https://www.techstart.vc/", ["United Kingdom"]),
    ("kernelcap", "Kernel Capital", "https://www.kernelcapital.ie/", ["Europe"]),
    ("actvc", "ACT Venture Capital", "https://www.actventure.partners/", ["Europe"]),
    ("wayra", "Wayra", "https://wayra.com/", ["Europe", "United Kingdom"]),
    ("plugplay", "Plug and Play", "https://www.plugandplaytechcenter.com/", ["United States", "Europe"]),
    ("alchemist", "Alchemist", "https://www.alchemistaccelerator.com/", ["United States"]),
    ("masschallenge", "MassChallenge", "https://masschallenge.org/", ["United States"]),
    ("gener8tor", "gener8tor", "https://www.gener8tor.com/", ["United States"]),
    ("angelpad", "AngelPad", "https://angelpad.com/", ["United States"]),
    ("neo", "Neo", "https://neo.com/", ["United States"]),
    ("susa", "Susa Ventures", "https://www.susaventures.com/", ["United States"]),
    ("cowboy", "Cowboy Ventures", "https://www.cowboy.vc/", ["United States"]),
    ("haystack", "Haystack", "https://www.haystack.vc/", ["United States"]),
    ("afore", "Afore", "https://www.afore.vc/", ["United States"]),
    ("villageg", "Village Global", "https://www.villageglobal.vc/", ["United States"]),
    ("primaryvc", "Primary", "https://www.primary.vc/", ["United States"]),
    ("lerer", "Lerer Hippeau", "https://www.lererhippeau.com/", ["United States"]),
    ("eniac", "Eniac", "https://www.eniac.vc/", ["United States"]),
    ("fff", "Female Founders Fund", "https://www.femalefoundersfund.com/", ["United States"]),
    ("dayone", "Day One Ventures", "https://www.dayoneventures.com/", ["United States"]),
    ("sevenseven", "Seven Seven Six", "https://www.sevensevensix.com/", ["United States"]),
    ("svangel", "SV Angel", "https://www.svangel.com/", ["United States"]),
    ("truevc", "True Ventures", "https://trueventures.com/", ["United States"]),
    ("forerunner", "Forerunner", "https://www.forerunnerventures.com/", ["United States"]),
    ("maveron", "Maveron", "https://www.maveron.com/", ["United States"]),
    ("crosslink", "Crosslink", "https://www.crosslinkcapital.com/", ["United States"]),
    ("venrock", "Venrock", "https://www.venrock.com/", ["United States"]),
    ("nea", "NEA", "https://www.nea.com/", ["United States"]),
    ("khosla", "Khosla Ventures", "https://www.khoslaventures.com/", ["United States"]),
    ("ribbit", "Ribbit", "https://ribbitcap.com/", ["United States"]),
    ("qed", "QED", "https://www.qedinvestors.com/", ["United States"]),
    ("nyca", "Nyca", "https://www.nyca.com/", ["United States"]),
    ("thrive", "Thrive Capital", "https://thrivecap.com/", ["United States"]),
    ("signalfire", "SignalFire", "https://www.signalfire.com/", ["United States"]),
    ("amplify", "Amplify", "https://www.amplifypartners.com/", ["United States"]),
    ("rootvc", "Root Ventures", "https://www.root.vc/", ["United States"]),
    ("fiftyyears", "Fifty Years", "https://www.fiftyyears.com/", ["United States"]),
    ("primemovers", "Prime Movers Lab", "https://www.primemoverslab.com/", ["United States"]),
    ("lowercarbon", "Lowercarbon", "https://lowercarboncapital.com/", ["United States"]),
    ("obvious", "Obvious", "https://obvious.com/", ["United States"]),
    ("s2g", "S2G", "https://www.s2gventures.com/", ["United States"]),
    ("versionone", "Version One", "https://versionone.vc/", ["Canada"]),
    ("inovia", "Inovia", "https://www.inovia.vc/", ["Canada"]),
    ("georgian", "Georgian", "https://georgian.io/", ["Canada"]),
    ("omers", "OMERS Ventures", "https://www.omersventures.com/", ["Canada"]),
    ("creandum", "Creandum", "https://www.creandum.com/", ["Europe"]),
    ("pointnine", "Point Nine", "https://www.pointnine.com/", ["Europe"]),
    ("flyvc", "Fly Ventures", "https://www.fly.vc/", ["Europe"]),
    ("systemone", "System.One", "https://www.system.one/", ["Europe"]),
    ("vnv", "VNV Global", "https://www.vnv.global/", ["Europe"]),
    ("norrsken", "Norrsken", "https://www.norrsken.org/", ["Europe"]),
    ("seedcapdk", "Seed Capital", "https://www.seedcapital.dk/", ["Europe"]),
    ("maki", "Maki.vc", "https://maki.vc/", ["Europe"]),
    ("icebreaker", "Icebreaker", "https://www.icebreaker.vc/", ["Europe"]),
    ("vendep", "Vendep", "https://www.vendep.com/", ["Europe"]),
    ("firstpick", "Firstpick", "https://www.firstpick.vc/", ["Europe"]),
    ("practica", "Practica Capital", "https://www.practica.capital/", ["Europe"]),
    ("breega", "Breega", "https://www.breega.com/", ["Europe"]),
    ("serena", "Serena", "https://www.serena.vc/", ["Europe"]),
    ("isai", "ISAI", "https://www.isai.fr/", ["Europe"]),
    ("newfund", "Newfund", "https://www.newfundcap.com/", ["Europe"]),
    ("blackfin", "BlackFin", "https://www.blackfin.com/", ["Europe"]),
    ("threesixty", "360 Capital", "https://www.360cap.vc/", ["Europe"]),
    ("targetg", "Target Global", "https://www.targetglobal.vc/", ["Europe"]),
    ("gfc", "Global Founders Capital", "https://www.globalfounderscapital.com/", ["Europe", "United States"]),
    ("bpifrance", "Bpifrance", "https://www.bpifrance.fr/", ["Europe"]),
    ("rockstart", "Rockstart", "https://www.rockstart.com/", ["Europe"]),
    ("hightechxl", "HighTechXL", "https://www.hightechxl.com/", ["Europe"]),
    ("startupbootcamp", "Startupbootcamp", "https://www.startupbootcamp.org/", ["Europe", "United Kingdom"]),
    ("industrifonden", "Industrifonden", "https://www.industrifonden.com/", ["Europe"]),
    ("eequity", "Eequity", "https://www.eequity.se/", ["Europe"]),
    ("piventures", "pi Ventures", "https://pi.ventures/", ["India"]),
    ("indiaq", "India Quotient", "https://www.indiaquotient.in/", ["India"]),
    ("kae", "Kae Capital", "https://kae-capital.com/", ["India"]),
    ("hundredx", "100X.VC", "https://www.100x.vc/", ["India"]),
    ("speciale", "Speciale Invest", "https://www.specialeinvest.com/", ["India"]),
    ("matrixin", "Matrix Partners India", "https://www.matrixpartners.in/", ["India"]),
    ("saama", "Saama Capital", "https://www.saama.vc/", ["India"]),
    ("fireside", "Fireside", "https://www.firesideventures.com/", ["India"]),
    ("waterbridge", "WaterBridge", "https://www.waterbridge.vc/", ["India"]),
    ("monkshill", "Monk's Hill", "https://www.monkshill.com/", ["Asia"]),
    ("insignia", "Insignia", "https://www.insignia.vc/", ["Asia"]),
    ("cyberagent", "CyberAgent Capital", "https://www.cyberagentcapital.com/", ["Japan"]),
    ("qiming", "Qiming", "https://www.qimingvc.com/", ["Asia"]),
    ("idgcap", "IDG Capital", "https://www.idgcapital.com/", ["Asia"]),
    ("gsr", "GSR Ventures", "https://www.gsrventures.com/", ["Asia", "United States"]),
    ("startmate", "Startmate", "https://www.startmate.com/", ["Australia"]),
    ("mainseq", "Main Sequence", "https://www.mseq.vc/", ["Australia"]),
    ("rampersand", "Rampersand", "https://www.rampersand.vc/", ["Australia"]),
    ("giantleap", "Giant Leap", "https://www.giantleap.com.au/", ["Australia"]),
    ("rightclick", "Right Click Capital", "https://www.rightclickcapital.com/", ["Australia"]),
    ("skipcap", "Skip Capital", "https://www.skipcapital.com/", ["Australia"]),
    ("astella", "Astella", "https://www.astella.com.br/", ["Latin America"]),
    ("maya", "Maya Capital", "https://www.maya.capital/", ["Latin America"]),
    ("domo", "Domo", "https://www.domo.vc/", ["Latin America"]),
    ("nazca", "Nazca", "https://www.nazca.vc/", ["Latin America"]),
    ("dila", "DILA Capital", "https://www.dilacapital.com/", ["Latin America"]),
    ("dalus", "Dalus", "https://www.daluscapital.com/", ["Latin America"]),
    ("novastar", "Novastar", "https://www.novastarventures.com/", ["Africa"]),
    ("fourdx", "4DX Ventures", "https://www.4dx.ventures/", ["Africa"]),
    ("sawari", "Sawari", "https://www.sawariventures.com/", ["Africa"]),
    ("janngo", "Janngo", "https://www.janngo.capital/", ["Africa"]),
    ("flat6", "Flat6Labs", "https://www.flat6labs.com/", ["Africa"]),
    ("algebra", "Algebra Ventures", "https://www.algebraventures.com/", ["Africa"]),
    ("rallycap", "Rally Cap", "https://www.rallycapventures.com/", ["Africa"]),
    ("futureafrica", "Future Africa", "https://www.future.africa/", ["Africa"]),
    ("tlcom", "TLcom", "https://www.tlcom.capital/", ["Africa"]),
    ("norrsken22", "Norrsken22", "https://www.norrsken22.com/", ["Africa"]),
    ("hax", "HAX", "https://hax.co/", ["United States", "Asia"]),
    ("indiebio", "IndieBio", "https://indiebio.co/", ["United States"]),
    ("sosv2", "SOSV", "https://sosv.com/", ["United States"]),
    ("breakthrough", "Breakthrough Energy", "https://www.breakthroughenergy.org/", ["United States", "Europe"]),
    ("eip", "Energy Impact Partners", "https://www.energyimpactpartners.com/", ["United States", "Europe"]),
    ("congruent", "Congruent", "https://www.congruentvc.com/", ["United States"]),
    ("preludev", "Prelude", "https://www.preludeventures.com/", ["United States"]),
    ("osage", "Osage", "https://www.osagepartners.com/", ["United States"]),
    ("engineering", "Engineering Capital", "https://www.engineeringcapital.com/", ["United States"]),
    ("slowvc", "Slow Ventures", "https://slow.co/", ["United States"]),
    ("workbench", "Workbench", "https://www.workbench.co/", ["United States"]),
    ("brooklyn", "Brooklyn Bridge Ventures", "https://brooklynbridgeventures.com/", ["United States"]),
    ("citylight", "City Light", "https://www.citylight.vc/", ["United States"]),
    ("backdrop", "Backdrop", "https://backdrop.build/", ["United States"]),
    ("chapterone", "Chapter One", "https://chapterone.com/", ["United States"]),
    ("banana", "Banana Capital", "https://www.bananacapital.com/", ["United States"]),
    ("airangels", "AirAngels", "https://www.airangels.com/", ["United States"]),
    ("cathay", "Cathay Innovation", "https://www.cathayinnovation.com/", ["Europe", "United States"]),
    ("whitestar", "White Star", "https://www.whitestarcapital.com/", ["Europe"]),
    ("omnes", "Omnes", "https://www.omnescapital.com/", ["Europe"]),
    ("demeter", "Demeter", "https://www.demeter-im.com/", ["Europe"]),
    ("astorya", "Astorya", "https://www.astorya.vc/", ["Europe"]),
    ("oneragtime", "OneRagtime", "https://www.oneragtime.com/", ["Europe"]),
    ("unitedv", "United Ventures", "https://www.unitedventures.com/", ["Europe"]),
    ("p101", "P101", "https://www.p101.it/", ["Europe"]),
    ("cdpvc", "CDP Venture Capital", "https://www.cdpventurecapital.it/", ["Europe"]),
    ("changev", "Change Ventures", "https://www.changeventures.com/", ["Europe"]),
    ("wavev", "Wave Ventures", "https://wave.ventures/", ["Europe"]),
    ("superhero", "Superhero Capital", "https://www.superherocapital.com/", ["Europe"]),
    ("preseeddk", "PreSeed Ventures", "https://preseedventures.dk/", ["Europe"]),
    ("voima", "Voima Ventures", "https://www.voimaventures.com/", ["Europe"]),
    ("alliancev", "Alliance Venture", "https://www.allianceventure.com/", ["Europe"]),
    ("snow", "Snö Ventures", "https://www.sno.vc/", ["Europe"]),
    ("ipgroup", "IP Group", "https://www.ipgroupplc.com/", ["United Kingdom"]),
    ("bpc", "British Patient Capital", "https://www.britishpatientcapital.co.uk/", ["United Kingdom"]),
    ("eifund", "British Business Bank", "https://www.british-business-bank.co.uk/", ["United Kingdom"]),
    ("enterpriseie", "Enterprise Ireland", "https://www.enterprise-ireland.com/", ["Europe"]),
    ("conceptionx", "Conception X", "https://www.conceptionx.org/", ["United Kingdom"]),
    ("panacea", "Panacea Stars", "https://www.panaceastars.com/", ["United Kingdom"]),
    ("kqlabs", "KQ Labs", "https://www.kqlabs.com/", ["United Kingdom"]),
    ("lmarks", "L Marks", "https://www.lmarks.com/", ["United Kingdom"]),
    ("deeptechlabs", "Deeptech Labs", "https://www.deeptechlabs.com/", ["United Kingdom"]),
    ("setv", "SET Ventures", "https://www.set.ventures/", ["Europe"]),
    ("worldfund", "World Fund", "https://www.worldfund.vc/", ["Europe"]),
    ("paleblue2", "Pale Blue Dot", "https://www.paleblue.vc/", ["Europe"]),
    ("localglobe3", "LocalGlobe", "https://www.localglobe.vc/", ["United Kingdom", "Europe"]),
    ("hoxton2", "Hoxton", "https://www.hoxtonventures.com/", ["Europe", "United Kingdom"]),
    ("octopus2", "Octopus Ventures", "https://octopusventures.com/", ["United Kingdom", "Europe"]),
    ("balderton2", "Balderton", "https://www.balderton.com/", ["United Kingdom", "Europe"]),
    ("atomico2", "Atomico", "https://atomico.com/", ["Europe", "United Kingdom"]),
    ("index2", "Index", "https://www.indexventures.com/", ["Europe", "United Kingdom", "United States"]),
    ("gv", "GV", "https://www.gv.com/", ["United States"]),
    ("m12b", "M12", "https://m12.vc/", ["United States"]),
    ("intel2", "Intel Capital", "https://www.intel.com/content/www/us/en/capital/overview.html", ["United States"]),
    ("salesforce2", "Salesforce Ventures", "https://salesforceventures.com/", ["United States"]),
    ("samsung2", "Samsung Next", "https://www.samsungnext.com/", ["United States"]),
    ("nvidia", "NVentures", "https://www.nventures.ai/", ["United States"]),
    ("coinbasev", "Coinbase Ventures", "https://www.coinbase.com/ventures", ["United States"]),
    ("polychain", "Polychain", "https://polychain.capital/", ["United States"]),
    ("frameworkv", "Framework", "https://framework.ventures/", ["United States"]),
    ("variant2", "Variant", "https://variant.fund/", ["United States"]),
    ("placeholder2", "Placeholder", "https://www.placeholder.vc/", ["United States"]),
    ("electric2", "Electric", "https://www.electriccapital.com/", ["United States"]),
    ("paradigm2", "Paradigm", "https://www.paradigm.xyz/", ["United States"]),
    ("dragonfly2", "Dragonfly", "https://www.dragonfly.xyz/", ["United States", "Asia"]),
    ("hackvc2", "Hack VC", "https://www.hack.vc/", ["United States"]),
    ("multicoin2", "Multicoin", "https://multicoin.capital/", ["United States"]),
    ("pantera2", "Pantera", "https://pantera.com/", ["United States"]),
    ("onekx2", "1kx", "https://1kx.network/", ["Europe", "United States"]),
    ("boost2", "Boost VC", "https://www.boost.vc/", ["United States"]),
    ("notation2", "Notation", "https://notation.vc/", ["United States"]),
    ("compound2", "Compound", "https://www.compound.vc/", ["United States"]),
    ("weekend2", "Weekend Fund", "https://www.weekendfund.com/", ["United States"]),
    ("soma2", "Soma", "https://www.somacap.com/", ["United States"]),
    ("pioneer2", "Pioneer Fund", "https://www.pioneerfund.vc/", ["United States"]),
    ("spc2", "South Park Commons", "https://www.southparkcommons.com/", ["United States"]),
    ("contrary2", "Contrary", "https://contrary.com/", ["United States"]),
]

STARTUPS = [
    ("alan", "Alan", "https://alan.com/"),
    ("payfit", "PayFit", "https://payfit.com/"),
    ("swile", "Swile", "https://www.swile.co/"),
    ("personio", "Personio", "https://www.personio.com/"),
    ("factorial", "Factorial", "https://factorialhr.com/"),
    ("kenjo", "Kenjo", "https://www.kenjo.io/"),
    ("lucca", "Lucca", "https://www.lucca.fr/"),
    ("leapsome", "Leapsome", "https://www.leapsome.com/"),
    ("lattice", "Lattice", "https://lattice.com/"),
    ("cultureamp", "Culture Amp", "https://www.cultureamp.com/"),
    ("fifteenfive", "15Five", "https://www.15five.com/"),
    ("teamtailor", "Teamtailor", "https://www.teamtailor.com/"),
    ("workable", "Workable", "https://www.workable.com/"),
    ("recruitee", "Recruitee", "https://recruitee.com/"),
    ("charliehr", "CharlieHR", "https://www.charliehr.com/"),
    ("breathehr", "Breathe", "https://www.breathehr.com/"),
    ("hibob", "HiBob", "https://www.hibob.com/"),
    ("gusto", "Gusto", "https://gusto.com/"),
    ("justworks", "Justworks", "https://www.justworks.com/"),
    ("multiplier", "Multiplier", "https://www.usemultiplier.com/"),
    ("skuad", "Skuad", "https://www.skuad.io/"),
    ("agicap", "Agicap", "https://agicap.com/"),
    ("uncapped", "Uncapped", "https://www.weareuncapped.com/"),
    ("wayflyer", "Wayflyer", "https://www.wayflyer.com/"),
    ("silvr", "Silvr", "https://www.silvr.co/"),
    ("outfund", "Outfund", "https://www.out.fund/"),
    ("capchase", "Capchase", "https://www.capchase.com/"),
    ("pipecom", "Pipe", "https://pipe.com/"),
    ("clearco", "Clearco", "https://www.clear.co/"),
    ("karmen", "Karmen", "https://www.karmen.io/"),
    ("viceversa", "Viceversa", "https://www.goviceversa.com/"),
    ("memo", "Memo Bank", "https://www.memo.bank/"),
    ("swanio", "Swan", "https://www.swan.io/"),
    ("treezor", "Treezor", "https://www.treezor.com/"),
    ("solaris", "Solaris", "https://www.solarisgroup.com/"),
    ("n26", "N26", "https://n26.com/"),
    ("shine", "Shine", "https://www.shine.fr/"),
    ("indyfr", "Indy", "https://www.indy.fr/"),
    ("pennylane3", "Pennylane", "https://www.pennylane.com/"),
    ("qonto3", "Qonto", "https://qonto.com/"),
    ("spendesk3", "Spendesk", "https://www.spendesk.com/"),
    ("pleo3", "Pleo", "https://www.pleo.io/"),
    ("moss3", "Moss", "https://www.getmoss.com/"),
    ("payhawk3", "Payhawk", "https://payhawk.com/"),
    ("soldo3", "Soldo", "https://www.soldo.com/"),
    ("traderepublic", "Trade Republic", "https://traderepublic.com/"),
    ("scalable", "Scalable Capital", "https://www.scalable.capital/"),
    ("bitpanda", "Bitpanda", "https://www.bitpanda.com/"),
    ("lightyear", "Lightyear", "https://lightyear.com/"),
    ("sharesio", "Shares", "https://shares.io/"),
    ("freetrade3", "Freetrade", "https://freetrade.io/"),
    ("nutmeg3", "Nutmeg", "https://www.nutmeg.com/"),
    ("moneybox3", "Moneybox", "https://www.moneyboxapp.com/"),
    ("pensionbee3", "PensionBee", "https://www.pensionbee.com/"),
    ("penfold", "Penfold", "https://www.getpenfold.com/"),
    ("cushon3", "Cushon", "https://www.cushon.co.uk/"),
    ("chip3", "Chip", "https://www.getchip.uk/"),
    ("plum3", "Plum", "https://withplum.com/"),
    ("cleo3", "Cleo", "https://web.meetcleo.com/"),
    ("emma3", "Emma", "https://emma-app.com/"),
    ("snoop3", "Snoop", "https://www.snoop.app/"),
    ("monzo4", "Monzo", "https://monzo.com/"),
    ("starling4", "Starling", "https://www.starlingbank.com/"),
    ("revolut4", "Revolut", "https://www.revolut.com/"),
    ("wise4", "Wise", "https://wise.com/"),
    ("tide4", "Tide", "https://www.tide.co/"),
    ("gocardless4", "GoCardless", "https://gocardless.com/"),
    ("truelayer4", "TrueLayer", "https://truelayer.com/"),
    ("yapily4", "Yapily", "https://www.yapily.com/"),
    ("modulr4", "Modulr", "https://www.modulrfinance.com/"),
    ("thoughtm", "Thought Machine", "https://www.thoughtmachine.net/"),
    ("form3b", "Form3", "https://www.form3.tech/"),
    ("nium4", "Nium", "https://www.nium.com/"),
    ("airwallex4", "Airwallex", "https://www.airwallex.com/"),
    ("rapyd4", "Rapyd", "https://www.rapyd.net/"),
    ("dlocal4", "dLocal", "https://www.dlocal.com/"),
    ("klarna4", "Klarna", "https://www.klarna.com/"),
    ("affirm4", "Affirm", "https://www.affirm.com/"),
    ("hokodo4", "Hokodo", "https://www.hokodo.co/"),
    ("previse4", "Previse", "https://www.previse.co.uk/"),
    ("iwoca4", "iwoca", "https://www.iwoca.co.uk/"),
    ("oaknorth4", "OakNorth", "https://www.oaknorth.com/"),
    ("zopa4", "Zopa", "https://www.zopa.com/"),
    ("fundingc", "Funding Circle", "https://www.fundingcircle.com/"),
    ("liberis4", "Liberis", "https://www.liberis.com/"),
    ("billie4", "Billie", "https://www.billie.io/"),
    ("alma4", "Alma", "https://almapay.com/"),
    ("scalapay4", "Scalapay", "https://www.scalapay.com/"),
    ("gitguardian", "GitGuardian", "https://www.gitguardian.com/"),
    ("aiven", "Aiven", "https://aiven.io/"),
    ("algolia", "Algolia", "https://www.algolia.com/"),
    ("contentful", "Contentful", "https://www.contentful.com/"),
    ("strapi", "Strapi", "https://strapi.io/"),
    ("directus", "Directus", "https://directus.io/"),
    ("sanity", "Sanity", "https://www.sanity.io/"),
    ("storyblok", "Storyblok", "https://www.storyblok.com/"),
    ("hygraph", "Hygraph", "https://hygraph.com/"),
    ("imgix", "imgix", "https://www.imgix.com/"),
    ("cloudinary", "Cloudinary", "https://cloudinary.com/"),
    ("mux", "Mux", "https://www.mux.com/"),
    ("livekit", "LiveKit", "https://livekit.io/"),
    ("daily", "Daily", "https://www.daily.co/"),
    ("whereby", "Whereby", "https://whereby.com/"),
    ("around", "Around", "https://www.around.co/"),
    ("mmhmm", "mmhmm", "https://www.mmhmm.app/"),
    ("loom", "Loom", "https://www.loom.com/"),
    ("tldv", "tl;dv", "https://tldv.io/"),
    ("grain3", "Grain", "https://grain.com/"),
    ("fireflies3", "Fireflies", "https://fireflies.ai/"),
    ("fathom3", "Fathom", "https://fathom.video/"),
    ("circleback3", "Circleback", "https://circleback.ai/"),
    ("granola3", "Granola", "https://www.granola.ai/"),
    ("superhuman3", "Superhuman", "https://superhuman.com/"),
    ("shortwave3", "Shortwave", "https://www.shortwave.com/"),
    ("front3", "Front", "https://front.com/"),
    ("missive3", "Missive", "https://missiveapp.com/"),
    ("plain3", "Plain", "https://www.plain.com/"),
    ("pylon3", "Pylon", "https://www.usepylon.com/"),
    ("intercom", "Intercom", "https://www.intercom.com/"),
    ("zendesk", "Zendesk", "https://www.zendesk.com/"),
    ("gorgias", "Gorgias", "https://www.gorgias.com/"),
    ("kustomer", "Kustomer", "https://www.kustomer.com/"),
    ("dixa", "Dixa", "https://www.dixa.com/"),
    ("crisp", "Crisp", "https://crisp.chat/"),
    ("freshworks", "Freshworks", "https://www.freshworks.com/"),
    ("hubspot", "HubSpot", "https://www.hubspot.com/"),
    ("attio", "Attio", "https://attio.com/"),
    ("folk", "Folk", "https://www.folk.app/"),
    ("affinity", "Affinity", "https://www.affinity.co/"),
    ("close", "Close", "https://www.close.com/"),
    ("pipedrive", "Pipedrive", "https://www.pipedrive.com/"),
    ("copper", "Copper", "https://www.copper.com/"),
    ("streak", "Streak", "https://www.streak.com/"),
    ("apollo3", "Apollo", "https://www.apollo.io/"),
    ("clay3", "Clay", "https://www.clay.com/"),
    ("lemlist", "lemlist", "https://www.lemlist.com/"),
    ("instantly", "Instantly", "https://instantly.ai/"),
    ("smartlead", "Smartlead", "https://www.smartlead.ai/"),
    ("lavendar", "Lavender", "https://www.lavender.ai/"),
    ("regie3", "Regie", "https://www.regie.ai/"),
    ("copyai3", "Copy.ai", "https://www.copy.ai/"),
    ("jasper3", "Jasper", "https://www.jasper.ai/"),
    ("writer3", "Writer", "https://writer.com/"),
    ("grammarly", "Grammarly", "https://www.grammarly.com/"),
    ("notion3", "Notion", "https://www.notion.com/"),
    ("coda4", "Coda", "https://coda.io/"),
    ("slate", "Slite", "https://slite.com/"),
    ("slab", "Slab", "https://slab.com/"),
    ("gitbook", "GitBook", "https://www.gitbook.com/"),
    ("readme", "ReadMe", "https://readme.com/"),
    ("mintlify", "Mintlify", "https://www.mintlify.com/"),
    ("archbee", "Archbee", "https://www.archbee.com/"),
    ("outline", "Outline", "https://www.getoutline.com/"),
    ("anytype", "Anytype", "https://anytype.io/"),
    ("craft", "Craft", "https://www.craft.do/"),
    ("capacities", "Capacities", "https://capacities.io/"),
    ("reflect", "Reflect", "https://reflect.app/"),
    ("mem3", "Mem", "https://mem.ai/"),
    ("tana", "Tana", "https://tana.inc/"),
    ("heptabase", "Heptabase", "https://heptabase.com/"),
    ("affine", "AFFiNE", "https://affine.pro/"),
    ("appflowy", "AppFlowy", "https://appflowy.io/"),
    ("clickup3", "ClickUp", "https://clickup.com/"),
    ("asana3", "Asana", "https://asana.com/"),
    ("monday3", "monday.com", "https://monday.com/"),
    ("height3", "Height", "https://height.app/"),
    ("linear3", "Linear", "https://linear.app/"),
    ("shortcut", "Shortcut", "https://www.shortcut.com/"),
    ("plane", "Plane", "https://plane.so/"),
    ("huly", "Huly", "https://huly.io/"),
    ("rows3", "Rows", "https://rows.com/"),
    ("equals3", "Equals", "https://equals.com/"),
    ("causal3", "Causal", "https://causal.app/"),
    ("runway3", "Runway", "https://runway.com/"),
    ("pigment3", "Pigment", "https://www.pigment.com/"),
    ("mosaic3", "Mosaic", "https://www.mosaic.tech/"),
    ("puzzle3", "Puzzle", "https://puzzle.io/"),
    ("digits3", "Digits", "https://digits.com/"),
    ("finta3", "Finta", "https://www.finta.com/"),
    ("pilotcom", "Pilot", "https://pilot.com/"),
    ("bench3", "Bench", "https://bench.co/"),
    ("puzzleio", "Puzzle", "https://puzzle.io/"),
    ("rillet", "Rillet", "https://www.rillet.com/"),
    ("campfire", "Campfire", "https://www.campfire.ai/"),
    ("numeric", "Numeric", "https://www.numeric.io/"),
    ("floqast", "FloQast", "https://www.floqast.com/"),
    ("blackline", "BlackLine", "https://www.blackline.com/"),
    ("avalara", "Avalara", "https://www.avalara.com/"),
    ("taxjar", "TaxJar", "https://www.taxjar.com/"),
    ("anrok", "Anrok", "https://www.anrok.com/"),
    ("sphere", "Sphere", "https://www.getsphere.com/"),
    ("numeral", "Numeral", "https://www.numeralhq.com/"),
    ("ravical2", "Ravical", "https://ravical.com/"),
    ("accountant", "Basis", "https://www.getbasis.ai/"),
    ("truewind", "Truewind", "https://www.truewind.ai/"),
    ("booke", "Booke", "https://www.booke.ai/"),
    ("docyt", "Docyt", "https://docyt.com/"),
    ("botkeeper", "Botkeeper", "https://www.botkeeper.com/"),
    ("vic", "Vic.ai", "https://www.vic.ai/"),
    ("appzen", "AppZen", "https://www.appzen.com/"),
    ("stampli", "Stampli", "https://www.stampli.com/"),
    ("tipalti", "Tipalti", "https://tipalti.com/"),
    ("billcom", "BILL", "https://www.bill.com/"),
    ("melio", "Melio", "https://www.meliopayments.com/"),
    ("routable", "Routable", "https://www.routable.com/"),
    ("airbase", "Airbase", "https://www.airbase.com/"),
    ("teampay", "Teampay", "https://www.teampay.co/"),
    ("expensify", "Expensify", "https://www.expensify.com/"),
    ("divvy", "Divvy", "https://www.divvy.co/"),
    ("brex4", "Brex", "https://www.brex.com/"),
    ("ramp4", "Ramp", "https://ramp.com/"),
    ("mercury4", "Mercury", "https://mercury.com/"),
    ("arc4", "Arc", "https://arc.tech/"),
    ("pulley3", "Pulley", "https://pulley.com/"),
    ("carta3", "Carta", "https://carta.com/"),
    ("angellist3", "AngelList", "https://www.angellist.com/"),
    ("clerky3", "Clerky", "https://www.clerky.com/"),
    ("seedlegals3", "SeedLegals", "https://seedlegals.com/"),
    ("cake3", "Cake Equity", "https://www.cakeequity.com/"),
    ("ledgy3", "Ledgy", "https://ledgy.com/"),
    ("vestd3", "Vestd", "https://www.vestd.com/"),
    ("capdesk3", "Capdesk", "https://www.capdesk.com/"),
    ("pave", "Pave", "https://www.pave.com/"),
    ("comprehensive", "Comprehensive", "https://www.comprehensive.io/"),
    ("ravio", "Ravio", "https://www.ravio.com/"),
    ("figures", "Figures", "https://www.figures.hr/"),
    ("pavehr", "Pave", "https://www.pave.com/"),
    ("assemble", "Assemble", "https://www.assemble.inc/"),
    ("opencomp", "OpenComp", "https://www.opencomp.com/"),
    ("paisa", "Pave", "https://www.pave.com/"),
]


def existing():
    text = ""
    for path in [
        "/workspace/src/lib/seedstage/directory.generated.ts",
        "/workspace/src/lib/seedstage/public-investors.ts",
        "/workspace/src/lib/seedstage/startups.ts",
    ]:
        text += Path(path).read_text()
    ids = set(re.findall(r'id: "([^"]+)"', text))
    names = set(re.findall(r'(?:firm|name): "([^"]+)"', text))
    hosts = set(re.findall(r'https?://([^/"\s]+)', text))
    return ids, names, hosts


def clip(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    for marker in ["Cookie", "Privacy", "Subscribe", "Don't invest", "©"]:
        i = text.find(marker)
        if i > 40:
            text = text[:i].strip()
    parts = re.split(r"(?<=[.!?])\s+", text)
    kept = [p for p in parts if len(p) > 20][:2]
    return " ".join(kept)[:420] if kept else text[:220]


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
    funds = [row for row in FUNDS if row[0] not in ids and row[1] not in names]
    startups = []
    for sid, name, url in STARTUPS:
        host = re.sub(r"^www\.", "", url.split("/")[2])
        if sid in ids or name in names:
            continue
        if any(host == re.sub(r"^www\.", "", h) for h in hosts):
            continue
        startups.append((sid, name, url, "", ""))
    print("try", len(funds), len(startups))
    got_f, got_s = [], []
    with ThreadPoolExecutor(14) as pool:
        futs = [pool.submit(fd.one_fund, row) for row in funds]
        futs += [pool.submit(fd.one_startup, row) for row in startups]
        for fut in as_completed(futs):
            kind, fid, rec, status = fut.result()
            if not rec:
                continue
            print("ok", kind, fid)
            (got_f if kind == "fund" else got_s).append(rec)
    fund_chunks = []
    for f in got_f:
        if f["firm"] in names or f["id"] in ids:
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
            "    synthetic: false,\n    confirmed: false,\n    currency: \"GBP\",\n  }"
        )
        names.add(f["firm"])
        ids.add(f["id"])
    startup_chunks = []
    for s in got_s:
        if s["name"] in names or s["id"] in ids:
            continue
        body = clip(s["summary"])
        if len(body) < 24:
            continue
        stage = ""
        low = body.lower()
        if "pre-seed" in low:
            stage = "Pre-seed"
        elif re.search(r"\bseed\b", low):
            stage = "Seed"
        startup_chunks.append(
            "  {\n"
            f"    id: {json.dumps(s['id'])},\n"
            f"    name: {json.dumps(s['name'])},\n"
            f"    website: {json.dumps(s['website'])},\n"
            f"    logo: {json.dumps(s['logo'])},\n"
            f"    stage: {json.dumps(stage)},\n"
            "    round: null,\n"
            f"    summary: {json.dumps(body, ensure_ascii=False)},\n"
            "    person: null,\n    funder: \"\",\n    source: \"Company site\",\n"
            f"    sourceUrl: {json.dumps(s['website'])},\n  }}\n"
        )
        names.add(s["name"])
    text = GEN.read_text()
    if fund_chunks:
        text = text.replace(
            "\n];\n\nexport const extraStartups",
            ",\n" + ",\n".join(fund_chunks) + "\n];\n\nexport const extraStartups",
            1,
        )
    if startup_chunks:
        text = text.rstrip()
        if text.endswith("];"):
            text = text[:-2] + ",\n" + ",\n".join(startup_chunks) + "\n];\n"
    GEN.write_text(text)
    print("ADDED", len(fund_chunks), len(startup_chunks))


if __name__ == "__main__":
    main()
