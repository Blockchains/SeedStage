import { createServerFn } from "@tanstack/react-start";

export type ServiceLive = {
  id: string;
  name: string;
  running: boolean;
  detail: string;
};

async function getJson(url: string, headers?: Record<string, string>): Promise<unknown | null> {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(2000) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export const readLocalServices = createServerFn({ method: "GET" }).handler(async (): Promise<ServiceLive[]> => {
  const [bao, keycloak, temporal] = await Promise.all([
    getJson("http://127.0.0.1:8200/v1/secret/data/seedstage", { "X-Vault-Token": "seedstage-dev" }),
    getJson("http://127.0.0.1:8180/realms/master/.well-known/openid-configuration"),
    getJson("http://127.0.0.1:8233/api/v1/namespaces"),
  ]);

  const secret = (bao as { data?: { data?: { company?: string; firm?: string } } } | null)?.data?.data;
  const issuer = (keycloak as { issuer?: string } | null)?.issuer ?? "";
  const namespaces = (temporal as { namespaces?: { namespaceInfo?: { name?: string } }[] } | null)?.namespaces ?? [];
  const names = namespaces.map((item) => item.namespaceInfo?.name).filter((name): name is string => Boolean(name));

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
      detail: issuer || "Not answering",
    },
    {
      id: "docling",
      name: "Docling",
      running: false,
      detail: "Parser package is not installed in this workspace",
    },
    {
      id: "gotenberg",
      name: "Gotenberg",
      running: false,
      detail: "Needs a container. None is available here",
    },
    {
      id: "langfuse",
      name: "Langfuse",
      running: false,
      detail: "Needs its own database and is not started",
    },
    {
      id: "opencontracts",
      name: "OpenContracts",
      running: false,
      detail: "The Django app is not started",
    },
  ];
});
