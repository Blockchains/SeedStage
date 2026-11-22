import { createServerFn } from "@tanstack/react-start";

export type ServiceLive = {
  id: string;
  name: string;
  running: boolean;
  detail: string;
};

async function getJson(url: string, headers?: Record<string, string>): Promise<unknown | null> {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(2500) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function githubRelease(repo: string): Promise<string | null> {
  const data = await getJson(`https://api.github.com/repos/${repo}/releases/latest`, {
    Accept: "application/vnd.github+json",
    "User-Agent": "seedstage",
  });
  const tag = (data as { tag_name?: string } | null)?.tag_name;
  return tag ?? null;
}

export const readLocalServices = createServerFn({ method: "GET" }).handler(async (): Promise<ServiceLive[]> => {
  const [bao, keycloak, temporal, docling, chromium, doclingRelease, gotenbergRelease, langfuseRelease, contractsRelease] = await Promise.all([
    getJson("http://127.0.0.1:8200/v1/secret/data/seedstage", { "X-Vault-Token": "seedstage-dev" }),
    getJson("http://127.0.0.1:8180/realms/master/.well-known/openid-configuration"),
    getJson("http://127.0.0.1:8233/api/v1/namespaces"),
    getJson("http://127.0.0.1:5001/health"),
    getJson("http://127.0.0.1:3010/health"),
    githubRelease("docling-project/docling"),
    githubRelease("gotenberg/gotenberg"),
    githubRelease("langfuse/langfuse"),
    githubRelease("Open-Source-Legal/OpenContracts"),
  ]);

  const secret = (bao as { data?: { data?: { company?: string; firm?: string } } } | null)?.data?.data;
  const issuer = (keycloak as { issuer?: string } | null)?.issuer ?? "";
  const namespaces = (temporal as { namespaces?: { namespaceInfo?: { name?: string } }[] } | null)?.namespaces ?? [];
  const names = namespaces.map((item) => item.namespaceInfo?.name).filter((name): name is string => Boolean(name));
  const chromiumUp = (chromium as { details?: { chromium?: { status?: string } } } | null)?.details?.chromium?.status === "up";
  const doclingStatus = (docling as { status?: string } | null)?.status ?? "";
  const doclingUp = doclingStatus === "ok" || doclingStatus === "up";

  return [
    {
      id: "openbao",
      name: "OpenBao",
      running: Boolean(secret?.company),
      detail: secret?.company ? `${secret.company} · ${secret.firm ?? ""}`.trim() : "Not answering",
    },
    {
      id: "temporal",
      name: "Temporal",
      running: names.length > 0,
      detail: names.length > 0 ? names.join(", ") : "Not answering",
    },
    {
      id: "keycloak",
      name: "Keycloak",
      running: issuer.length > 0,
      detail: issuer ? "master realm" : "Not answering",
    },
    {
      id: "docling",
      name: "Docling",
      running: doclingUp,
      detail: doclingUp ? "Convert API" : doclingRelease ? `${doclingRelease} on GitHub. Not answering yet` : "Not answering",
    },
    {
      id: "gotenberg",
      name: "Gotenberg",
      running: chromiumUp,
      detail: chromiumUp ? "Chromium route" : gotenbergRelease ? `${gotenbergRelease} needs a container` : "Not answering",
    },
    {
      id: "langfuse",
      name: "Langfuse",
      running: false,
      detail: langfuseRelease ? `${langfuseRelease} needs its own database` : "Needs its own database",
    },
    {
      id: "opencontracts",
      name: "OpenContracts",
      running: false,
      detail: contractsRelease ? `${contractsRelease} needs a container` : "Needs a container",
    },
  ];
});
