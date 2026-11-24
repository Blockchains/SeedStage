import { extraStartups } from "./directory.generated.ts";
import repos from "./github-repos.json" with { type: "json" };

export type PublicStartup = {
  id: string;
  name: string;
  website: string;
  logo: string;
  stage: string;
  round: string | null;
  summary: string;
  person: string | null;
  funder: string;
  source: string;
  sourceUrl: string;
  files?: { title: string; text: string }[];
};

const listedStartups: PublicStartup[] = [
  {
    id: "ravical",
    name: "Ravical",
    website: "https://ravical.com/",
    logo: "/logos/ravical.png",
    stage: "Seed",
    round: "$17m seed, led by MMC",
    summary: "MMC is leading Ravical’s $17m Seed round, backing them to lead the AI transformation of accounting and tax firms.",
    person: "Joris Van Der Gucht, CEO",
    funder: "MMC",
    source: "MMC, 2 Nov 2026, and Ravical",
    sourceUrl: "https://mmc.vc/accountings-next-act-why-we-invested-in-ravical/",
  },
  {
    id: "hacktron",
    name: "Hacktron",
    website: "https://www.hacktron.ai/",
    logo: "/logos/hacktron.png",
    stage: "Pre-seed",
    round: "$2.9m pre-seed",
    summary: "Autonomous vulnerability hunting for engineering teams. $2.9m pre-seed.",
    person: "Zayne Zhang, CEO",
    funder: "Crane Venture Partners",
    source: "Crane home page and Hacktron",
    sourceUrl: "https://crane.vc/",
  },
  {
    id: "flexa",
    name: "Flexa",
    website: "https://flexa.careers/",
    logo: "/logos/flexa.png",
    stage: "Seed",
    round: null,
    summary: "Careers platform that matches people and companies using verified data on culture, benefits, flexibility and progression.",
    person: "Molly Johnson-Jones, CEO",
    funder: "Ada Ventures",
    source: "Ada Ventures company page",
    sourceUrl: "https://adaventures.com/company/flexa",
  },
  {
    id: "toothfairy",
    name: "Toothfairy",
    website: "https://toothfairyapp.co.uk/",
    logo: "/logos/toothfairy.png",
    stage: "Pre-seed",
    round: null,
    summary: "Digital dental platform connecting patients with UK-registered dentists by video, including consultations and prescriptions.",
    person: "Dr Deepak Singh Aulak, CEO",
    funder: "Ada Ventures",
    source: "Ada Ventures company page",
    sourceUrl: "https://adaventures.com/company/toothfairy",
  },
  {
    id: "blakbear",
    name: "BlakBear",
    website: "https://blakbear.com/",
    logo: "/logos/blakbear.png",
    stage: "Pre-seed",
    round: null,
    summary: "Low-cost gas sensors and software that monitor food freshness to cut waste.",
    person: "Dr Max Grell, CEO",
    funder: "Ada Ventures",
    source: "Ada Ventures company page",
    sourceUrl: "https://adaventures.com/company/blakbear",
  },
  {
    id: "matnex",
    name: "MatNex",
    website: "https://matnex.ai/",
    logo: "/logos/matnex.svg",
    stage: "Pre-seed",
    round: null,
    summary: "Artificial intelligence and quantum mechanics used to find sustainable materials faster.",
    person: "Jonathan Bean, CEO",
    funder: "Ada Ventures",
    source: "Ada Ventures company page",
    sourceUrl: "https://adaventures.com/company/materials-nexus",
  },
  {
    id: "bodyswaps",
    name: "Bodyswaps",
    website: "https://bodyswaps.co/",
    logo: "/logos/bodyswaps.png",
    stage: "Early",
    round: null,
    summary: "Soft-skills training with VR and AI, used by universities and hospitals.",
    person: null,
    funder: "Haatch",
    source: "Haatch home page and Bodyswaps",
    sourceUrl: "https://haatch.com/",
  },
];

export const publicStartups: PublicStartup[] = [...listedStartups, ...extraStartups].map((company) => {
  const repo = (repos as Record<string, { url: string; stars: number }>)[company.id];
  if (!repo) return company;
  return {
    ...company,
    files: [...(company.files ?? []), { title: "GitHub", text: `Repository: ${repo.url}\nStars: ${repo.stars}\nSource: https://github.com/yc-oss/open-source-companies` }],
  };
});
