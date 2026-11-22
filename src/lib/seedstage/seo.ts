const APEX = "https://seedstage.si";

export function pageHead(path: string, title: string, description: string) {
  const href = path === "/" ? `${APEX}/` : `${APEX}${path.startsWith("/") ? path : `/${path}`}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
    ],
    links: [{ rel: "canonical", href }],
  };
}

export function organizationJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "SeedStage",
        url: "https://seedstage.si/",
        logo: "https://seedstage.si/icon-512.png",
      },
      {
        "@type": "WebSite",
        name: "SeedStage",
        url: "https://seedstage.si/",
      },
    ],
  });
}
