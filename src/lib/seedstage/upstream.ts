export type UpstreamMode = "wired" | "pinned" | "not-adopted";

export type Upstream = {
  id: string;
  name: string;
  repo: string;
  commit: string;
  mode: UpstreamMode;
  role: string;
};

export const UPSTREAM: Upstream[] = [
  { id: "table", name: "TanStack Table", repo: "https://github.com/TanStack/table", commit: "1cfb2e57cbfecf25e3d4ee1bda32fbd65e4e0327", mode: "wired", role: "Entity and document tables in this app" },
  { id: "opencontracts", name: "OpenContracts", repo: "https://github.com/Open-Source-Legal/OpenContracts", commit: "56ca972a22aba207b1e6681356c56053b5f63080", mode: "pinned", role: "Evidence platform. Not merged into this frontend." },
  { id: "docling", name: "Docling", repo: "https://github.com/docling-project/docling", commit: "5182e556308958f3ac4762bb7d03a092c2f339c9", mode: "pinned", role: "Parser. Used by OpenContracts, not a second pipeline here." },
  { id: "ftm", name: "FollowTheMoney", repo: "https://github.com/opensanctions/followthemoney", commit: "81515906aa4377c25b177e5018bf74108d1c0f9b", mode: "pinned", role: "Entity model. This app keeps company, person and investor rows." },
  { id: "dlt", name: "dlt", repo: "https://github.com/dlt-hub/dlt", commit: "efaf0e32d2ca3ac5f42653059065bb3ff8f972ec", mode: "pinned", role: "Ingestion library. No live connector in this build." },
  { id: "sources", name: "dlt verified sources", repo: "https://github.com/dlt-hub/verified-sources", commit: "952bf8df696ebe285353a183f92be2a633a538ba", mode: "pinned", role: "Connector examples. None are connected." },
  { id: "pgvector", name: "pgvector", repo: "https://github.com/pgvector/pgvector", commit: "2eb55afb89ac656037030596787003b9ceeff932", mode: "pinned", role: "Postgres search extension. Retrieval here is exact text." },
  { id: "openfga", name: "OpenFGA", repo: "https://github.com/openfga/openfga", commit: "d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251", mode: "pinned", role: "Document grants in this app are checked before an answer." },
  { id: "gotenberg", name: "Gotenberg", repo: "https://github.com/gotenberg/gotenberg", commit: "082d57755c3b04bfa31bc9a2fef51351d54a4e0a", mode: "pinned", role: "PDF rendering service. Not running here." },
  { id: "promptfoo", name: "Promptfoo", repo: "https://github.com/promptfoo/promptfoo", commit: "3c2c86d3a173df1242b698f0c40fe4112a77288d", mode: "pinned", role: "Eval tool. The room answer tests cover the same boundary." },
  { id: "keycloak", name: "Keycloak", repo: "https://github.com/keycloak/keycloak", commit: "d0284ffeb094f3b1e8b2c5a528d2d1c6314a33b1", mode: "pinned", role: "Identity server. This build uses its own session gate." },
  { id: "temporal", name: "Temporal", repo: "https://github.com/temporalio/temporal", commit: "32ef011fbd1e38ecddf656fc3f5026f6641cfeab", mode: "pinned", role: "Workflow server. Approvals here are in-browser." },
  { id: "langfuse", name: "Langfuse", repo: "https://github.com/langfuse/langfuse", commit: "4afc77978b844de865398c8e4f5af93c4b53e301", mode: "pinned", role: "AI tracing. No model call is made from the room." },
  { id: "xyflow", name: "XYFlow", repo: "https://github.com/xyflow/xyflow", commit: "29ab9e001c2ba320c9d84b00c729c745132d9145", mode: "pinned", role: "Graph UI. Relationships are a table, not a diagram." },
  { id: "openbao", name: "OpenBao", repo: "https://github.com/openbao/openbao", commit: "a943844dae65dcdaa031cd739b7545250578693d", mode: "pinned", role: "Secrets manager. Not part of this frontend." },
  { id: "papermark", name: "Papermark", repo: "https://github.com/papermark/papermark", commit: "ed19717ec02a1ac79aecf5569159aa9d2d869312", mode: "not-adopted", role: "Mixed AGPL and commercial license. The room is SeedStage's." },
  { id: "documenso", name: "Documenso", repo: "https://github.com/documenso/documenso", commit: "80550e78b3e4852f87e9968e24b1984c427e4430", mode: "not-adopted", role: "Signing is not in this workflow." },
  { id: "paperless", name: "Paperless-ngx", repo: "https://github.com/paperless-ngx/paperless-ngx", commit: "4973be8499bc61dc4f791a609d0d31e9ac9ccd41", mode: "not-adopted", role: "Overlaps the document room." },
  { id: "paddle", name: "PaddleOCR", repo: "https://github.com/PaddlePaddle/PaddleOCR", commit: "dab3fe35379033fdcb2d0e9572fac0b36c9a9ebf", mode: "not-adopted", role: "No scanned-document test set in this build." },
  { id: "unstructured", name: "Unstructured", repo: "https://github.com/Unstructured-IO/unstructured", commit: "1ab3be89b689fbe91a2152b720908b7edb143945", mode: "not-adopted", role: "Second parser. Not added beside Docling." },
  { id: "markitdown", name: "MarkItDown", repo: "https://github.com/microsoft/markitdown", commit: "ed178952a6672abdfd35b5f9e76a80b6cefc086e", mode: "not-adopted", role: "Markdown conversion drops page references." },
  { id: "ragflow", name: "RAGFlow", repo: "https://github.com/infiniflow/ragflow", commit: "91c702e86be3dcb3cabc9f6d81e485d02241bef8", mode: "not-adopted", role: "A second retrieval platform." },
  { id: "yente", name: "Yente", repo: "https://github.com/opensanctions/yente", commit: "7074db814a382971370c5840509c0c9ec69380e1", mode: "not-adopted", role: "Screening data needs a separate licence." },
];
