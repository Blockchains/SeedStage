export type AnalyticsEvent =
  | "preview_started"
  | "preview_completed"
  | "first_output"
  | "save_intent"
  | "sample_opened";

export type AnalyticsRecord = { name: AnalyticsEvent; at: string };

const KEY = "seedstage.analytics.v1";

export function record(events: AnalyticsRecord[], name: AnalyticsEvent, at: string): AnalyticsRecord[] {
  return [...events, { name, at }].slice(-50);
}

export function track(name: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(KEY);
  const current = raw ? (JSON.parse(raw) as AnalyticsRecord[]) : [];
  window.localStorage.setItem(KEY, JSON.stringify(record(current, name, new Date().toISOString())));
}
