export type UpstreamMode = "wired" | "forked" | "not-adopted";

export type Upstream = {
  id: string;
  name: string;
  repo: string;
  commit: string;
  mode: UpstreamMode;
  role: string;
  fork: string | null;
};

function row(id: string, name: string, repo: string, commit: string, mode: UpstreamMode, role: string, forkName: string | null = null): Upstream {
  return { id, name, repo, commit, mode, role, fork: forkName ? `https://github.com/Blockchains/${forkName}` : null };
}

export const UPSTREAM: Upstream[] = [
  row("table", "TanStack Table", "https://github.com/TanStack/table", "1cfb2e57cbfecf25e3d4ee1bda32fbd65e4e0327", "wired", "Entity table in the data room"),
  row("xyflow", "XYFlow", "https://github.com/xyflow/xyflow", "29ab9e001c2ba320c9d84b00c729c745132d9145", "wired", "Relationship graph", "xyflow"),
  row("openfga", "OpenFGA", "https://github.com/openfga/openfga", "d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251", "wired", "Viewer tuples decide which room file an investor can ask", "openfga"),
  row("ftm", "FollowTheMoney", "https://github.com/opensanctions/followthemoney", "81515906aa4377c25b177e5018bf74108d1c0f9b", "wired", "Company, Person and LegalEntity schema names", "followthemoney"),
  row("opencontracts", "OpenContracts", "https://github.com/Open-Source-Legal/OpenContracts", "56ca972a22aba207b1e6681356c56053b5f63080", "forked", "Latest release is read from GitHub. The app itself needs a container.", "OpenContracts"),
  row("docling", "Docling", "https://github.com/docling-project/docling", "5182e556308958f3ac4762bb7d03a092c2f339c9", "forked", "The API server is installed in this workspace when the package finishes.", "docling"),
  row("dlt", "dlt", "https://github.com/dlt-hub/dlt", "efaf0e32d2ca3ac5f42653059065bb3ff8f972ec", "forked", "Ingestion library. Forked. No live connector.", "dlt"),
  row("sources", "dlt verified sources", "https://github.com/dlt-hub/verified-sources", "952bf8df696ebe285353a183f92be2a633a538ba", "forked", "Connector examples. Forked. None connected.", "verified-sources"),
  row("pgvector", "pgvector", "https://github.com/pgvector/pgvector", "2eb55afb89ac656037030596787003b9ceeff932", "forked", "Postgres extension. Forked. This build searches the text it already holds.", "pgvector"),
  row("gotenberg", "Gotenberg", "https://github.com/gotenberg/gotenberg", "082d57755c3b04bfa31bc9a2fef51351d54a4e0a", "wired", "Chromium convert is answering here. LibreOffice still needs the container image.", "gotenberg"),
  row("promptfoo", "Promptfoo", "https://github.com/promptfoo/promptfoo", "3c2c86d3a173df1242b698f0c40fe4112a77288d", "forked", "Eval tool. The room answer tests cover the same cases.", "promptfoo"),
  row("keycloak", "Keycloak", "https://github.com/keycloak/keycloak", "d0284ffeb094f3b1e8b2c5a528d2d1c6314a33b1", "wired", "Dev server in this workspace. SeedStage still uses its own session.", "keycloak"),
  row("temporal", "Temporal", "https://github.com/temporalio/temporal", "32ef011fbd1e38ecddf656fc3f5026f6641cfeab", "wired", "Dev server in this workspace. The default namespace is registered.", "temporal"),
  row("langfuse", "Langfuse", "https://github.com/langfuse/langfuse", "4afc77978b844de865398c8e4f5af93c4b53e301", "forked", "Latest release is read from GitHub. The server needs its own database.", "langfuse"),
  row("openbao", "OpenBao", "https://github.com/openbao/openbao", "a943844dae65dcdaa031cd739b7545250578693d", "wired", "Dev server in this workspace. It holds the Ravical and MMC record.", "openbao"),
  row("papermark", "Papermark", "https://github.com/papermark/papermark", "ed19717ec02a1ac79aecf5569159aa9d2d869312", "not-adopted", "Mixed licence. Not forked."),
  row("documenso", "Documenso", "https://github.com/documenso/documenso", "80550e78b3e4852f87e9968e24b1984c427e4430", "not-adopted", "Signing is not in this workflow."),
  row("paperless", "Paperless-ngx", "https://github.com/paperless-ngx/paperless-ngx", "4973be8499bc61dc4f791a609d0d31e9ac9ccd41", "not-adopted", "Overlaps the document room."),
  row("paddle", "PaddleOCR", "https://github.com/PaddlePaddle/PaddleOCR", "dab3fe35379033fdcb2d0e9572fac0b36c9a9ebf", "not-adopted", "No scanned-document set in this build."),
  row("unstructured", "Unstructured", "https://github.com/Unstructured-IO/unstructured", "1ab3be89b689fbe91a2152b720908b7edb143945", "not-adopted", "A second parser was not added."),
  row("markitdown", "MarkItDown", "https://github.com/microsoft/markitdown", "ed178952a6672abdfd35b5f9e76a80b6cefc086e", "not-adopted", "Markdown conversion drops page references."),
  row("ragflow", "RAGFlow", "https://github.com/infiniflow/ragflow", "91c702e86be3dcb3cabc9f6d81e485d02241bef8", "not-adopted", "A second retrieval platform."),
  row("yente", "Yente", "https://github.com/opensanctions/yente", "7074db814a382971370c5840509c0c9ec69380e1", "not-adopted", "Screening data needs a separate licence."),
];
