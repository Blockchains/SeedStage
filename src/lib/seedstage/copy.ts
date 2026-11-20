export const copy = {
  eyebrow: "Seed-funding intelligence and execution",
  headline: "See your next funding move.",
  support:
    "Find investors that fit a seed round, see how price and the option pool change ownership, and keep the evidence for the raise in one place.",
  primary: "Explore investors",
  secondary: "Model a round",
  quiet: "Open the workspace",
  reassurance: "The sample company is already loaded. Replace it with your own figures when you are ready.",
  illustrative: "",
  roundScope: "Priced equity. Pre-money or post-money pool. New shares, ownership and cash in.",
  decisionsTitle: "A seed round is a set of decisions, not a single number.",
  decisions: [
    {
      title: "Who can lead",
      body: "A lead writes the term sheet and sets the price. Followers fill the rest. The workspace keeps those roles apart and only marks a lead when the firm says it leads.",
    },
    {
      title: "Price and pool",
      body: "Pre-money valuation, the new money and the option pool together decide founder ownership. A pool created before the round dilutes the existing holders. A pool created after also dilutes the new investor.",
    },
    {
      title: "How much to raise",
      body: "The funding plan walks cash month by month to a buffer, then finds the smallest raise that stays above it. It does not divide a bank balance by an average burn.",
    },
    {
      title: "Evidence",
      body: "Revenue, pipeline and headcount stay attached to the sentence they came from. A second source that disagrees is kept as a contradiction instead of being averaged away.",
    },
    {
      title: "Geography and stage",
      body: "A firm is set aside when its stated stage or geography cannot cover this round. A blank field stays blank. It is not treated as a yes.",
    },
    {
      title: "The next action",
      body: "Shortlist, pipeline and materials use the same company record. A stage in the pipeline changes only when someone sets it.",
    },
  ],
  flowTitle: "From a company record to a round you can defend",
  flow: [
    { title: "Company", body: "Stage, geography, sector and the current cap table. Unknown stays unknown." },
    { title: "Baseline", body: "Cash, burn and the claims you are willing to stand behind." },
    { title: "Round", body: "Investment, pre-money price and pool. Shares are reconciled to the last share." },
    { title: "Investors", body: "Fit against that round: stage, geography, cheque and whether they lead." },
    { title: "Evidence", body: "Each number points at a quote. Conflicts stay visible." },
    { title: "Materials", body: "A draft uses accepted claims only. Pending figures stay out." },
    { title: "Pipeline", body: "Researching, meeting, diligence, terms. One status, set by a person." },
    { title: "Approval", body: "A release is tied to the exact recipient, subject, body and expiry." },
  ],
  termsTitle: "What the round model actually computes",
  terms: [
    { title: "Pre-money price", body: "The price of the company before the new money. Share price is that value divided by the shares already in existence, after any pool top-up the term sheet requires." },
    { title: "New shares", body: "Investment divided by the share price. The model uses whole shares and assigns any rounding remainder so the total still adds up." },
    { title: "Option pool", body: "A target pool is the unissued share of the company after the round, or before it, depending on the term you select. Increasing the pool issues shares to the pool, not to founders." },
    { title: "Ownership", body: "Founders, the pool, existing investors and the new investor are shown as percentages of the post-round total. A larger cheque at the same price buys more of the company. It does not shrink the investor’s stake." },
    { title: "Cash in", body: "Proceeds equal the shares issued times the price. Fees, secondary sales and convertible notes are not included." },
    { title: "Convertibles", body: "SAFEs and notes are refused until a specific template is loaded. The model will not guess a cap, a discount or a conversion." },
  ],
  trustTitle: "Evidence stays attached to its sentence",
  trust: "A claim without a quote is not created. Two quotes that disagree on the same metric are both kept. The funding plan and the investor note use only the claims a person has accepted.",
  pathsTitle: "Start where the raise is today",
  paths: [
    { title: "Exploring", body: "You have a range in mind and want to see ownership at £1m, £2m and £4m before you talk to anyone.", action: "Model three prices", to: "/round" },
    { title: "Preparing", body: "The story is forming. Cash, hiring and the first evidence need to sit on one baseline before a shortlist is useful.", action: "Build the funding plan", to: "/plan" },
    { title: "Raising", body: "Meetings are underway. The shortlist, the deck and the next step for each firm should match the round you are actually running.", action: "Open the pipeline", to: "/pipeline" },
  ],
  privacyTitle: "Your company stays on this device",
  privacy: [
    "The sample workspace is stored in this browser.",
    "Export makes a file you can keep. Delete clears that browser copy.",
    "Investor and company profiles link to the firm’s own site.",
  ],
  pilotTitle: "Workspace",
  pilot: "Northline Systems is the worked example: a UK B2B software company, a priced seed, and the investors whose public pages cover that kind of round.",
  faq: [
    {
      q: "What round does the model price?",
      a: "A priced equity seed. You set the investment, the pre-money valuation and whether the option pool is calculated before or after the new money. Convertibles are not estimated.",
    },
    {
      q: "How is investor fit decided?",
      a: "Stage, geography, sector and cheque are read from the firm’s public page. A hard miss on stage or geography sets the firm aside. A blank cheque is not treated as a fit or a miss.",
    },
    {
      q: "Why do some well-known firms sit lower?",
      a: "A growth fund, or a firm whose page only shows Series A and later, does not cover a seed round. Activity with no date is not treated as recent.",
    },
    {
      q: "What is in the company directory?",
      a: "Companies whose own sites describe a current product, with the site’s icon. Seed and pre-seed are marked when a public page names that stage. Later-stage companies are not listed as seed.",
    },
    {
      q: "Can I replace the sample company?",
      a: "Yes. Company, evidence and the round are editable. The investor pages stay the public profiles already loaded.",
    },
    {
      q: "Does a shortlist send anything?",
      a: "No. Shortlist and pipeline are records in the workspace. An approval covers a specific draft. Nothing is emailed.",
    },
    {
      q: "Where do the logos come from?",
      a: "Each icon is the firm’s own site icon, saved with the profile. A firm without a usable icon is not added.",
    },
    {
      q: "What should I read first?",
      a: "Investors, if you are choosing who can lead. Round, if you are testing price and pool. Funding plan, if you are deciding how much cash the next year needs.",
    },
  ],
  closeTitle: "Price the round. Then see who can hold it.",
  close: "Start with the investor list, the ownership maths, or the cash plan.",
} as const;
