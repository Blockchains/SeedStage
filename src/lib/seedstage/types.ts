export type Role = "founder" | "finance" | "adviser" | "board" | "admin";

export type Provenance = {
  source: string;
  method: "user_entered" | "document" | "synthetic_fixture";
  at: string;
  documentId?: string;
};

export type Field<T> = {
  value: T | null;
  provenance: Provenance | null;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  provenance: Provenance;
};

export type Company = {
  legalName: Field<string>;
  tradingName: Field<string>;
  jurisdiction: Field<string>;
  registrationId: Field<string>;
  website: Field<string>;
  product: Field<string>;
  businessModel: Field<string>;
  customers: Field<string>;
  geos: Field<string>;
  stage: Field<string>;
  founded: Field<string>;
  objective: Field<string>;
  team: TeamMember[];
};

export type DocumentRecord = {
  id: string;
  name: string;
  mediaType: string;
  text: string;
  uploadedAt: string;
  method: "synthetic_fixture" | "user_paste";
  quarantine: "clean_fixture" | "user_supplied_unscanned";
  scan: "not_connected" | "fixture_marked_clean";
  note: string;
};

export type ClaimKind = "historical" | "forecast" | "founder_statement";

export type Claim = {
  id: string;
  text: string;
  metricKey: string | null;
  period: string | null;
  value: number | null;
  unit: string | null;
  currency: string | null;
  kind: ClaimKind;
  observed: "observed" | "inferred";
  status: "pending" | "accepted" | "rejected";
  sourceId: string;
  extraction: "deterministic_fixture" | "structured_parse" | "grok" | "user";
  confidenceNote: string;
  evidenceQuote: string;
  updatedAt: string;
  history: { at: string; status: Claim["status"]; note: string }[];
};

export type Contradiction = {
  id: string;
  metricKey: string;
  period: string;
  claimIds: string[];
  note: string;
};

export type PlanAssumptions = {
  currency: string;
  horizonMonths: number;
  openingCashMinor: number;
  bufferMinor: number;
  startingReceiptsMinor: number;
  receiptGrowthBps: number;
  confirmedThroughMonth: number;
  receiptDelayMonths: number;
  payrollMinor: number;
  opexMinor: number;
  hiringStartMonth: number;
  hiringExtraMinor: number;
  hiringDelayMonths: number;
  financingMonth: number | null;
  financingAmountMinor: number;
};

export type PoolMechanic = "pre-money-pool" | "post-money-pool";

export type RoundInput = {
  name: string;
  currency: string;
  preMoneyMinor: number;
  investmentMinor: number;
  existingShares: number;
  unallocatedShares: number;
  targetPoolBps: number;
  mechanic: PoolMechanic;
};

export type RoundVersion = {
  id: string;
  savedAt: string;
  input: RoundInput;
  engine: string;
};

export type Investor = {
  id: string;
  firm: string;
  fund: string;
  partner: string | null;
  stages: string[];
  geos: string[];
  geoExclusions: string[];
  sectors: string[];
  sectorExclusions: string[];
  sectorExclusive: boolean;
  chequeMinMinor: number;
  chequeMaxMinor: number;
  participation: "lead" | "follow" | "either";
  themes: string[];
  portfolio: string[];
  activityDate: string | null;
  source: string;
  sourceDate: string;
  synthetic: true;
  confirmed: false;
  currency: string;
};

export type PipelineStage =
  | "researching"
  | "ready_for_review"
  | "approved_for_approach"
  | "contacted"
  | "meeting_scheduled"
  | "diligence"
  | "terms"
  | "closed"
  | "declined"
  | "paused";

export type Opportunity = {
  id: string;
  investorId: string;
  stage: PipelineStage;
  stageSource: "user";
  suggestion: PipelineStage | null;
  owner: string;
  nextAction: string;
  nextDate: string | null;
  introSource: string;
  declineReason: string | null;
  notes: string;
  updatedAt: string;
};

export type Activity = {
  id: string;
  opportunityId: string;
  at: string;
  kind: "note" | "stage" | "suggestion";
  text: string;
};

export type Draft = {
  id: string;
  kind: "outreach" | "meeting_brief" | "funding_brief" | "update";
  investorId: string | null;
  subject: string;
  body: string;
  origin: "deterministic" | "grok";
  updatedAt: string;
};

export type Approval = {
  id: string;
  draftId: string;
  action: "release_outreach";
  recipient: string;
  sender: string;
  subject: string;
  body: string;
  attachmentIds: string[];
  hash: string;
  idempotencyKey: string;
  expiresAt: string;
  approvedAt: string;
  approvedBy: Role;
};

export type ExternalAction = {
  id: string;
  approvalId: string;
  idempotencyKey: string;
  hash: string;
  at: string;
  delivery: "not_connected";
  outcome: "locked_nothing_sent" | "duplicate_blocked";
};

export type DiligenceItem = {
  id: string;
  request: string;
  status: "missing" | "linked" | "not_applicable";
  claimId: string | null;
  note: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: Role;
  action: string;
  detail: string;
};

export type Workspace = {
  version: 1;
  id: string;
  name: string;
  demo: boolean;
  role: Role;
  company: Company;
  documents: DocumentRecord[];
  claims: Claim[];
  plan: PlanAssumptions;
  roundDraft: RoundInput;
  roundVersions: RoundVersion[];
  investors: Investor[];
  shortlist: string[];
  opportunities: Opportunity[];
  activities: Activity[];
  drafts: Draft[];
  approvals: Approval[];
  actions: ExternalAction[];
  diligence: DiligenceItem[];
  audit: AuditEvent[];
  lastReviewedAt: string | null;
  asOf: string;
  sectorTags: string[];
};
