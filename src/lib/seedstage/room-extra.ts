import { createServerFn } from "@tanstack/react-start";

export type RoomExtraFile = { title: string; text: string; source: string };

export const readRoomExtra = createServerFn({ method: "POST" })
  .validator((input: { id: string; kind: "startup" | "investor" }) => {
    const id = String(input?.id ?? "").slice(0, 80);
    const kind = input?.kind === "investor" ? "investor" : "startup";
    return { id, kind };
  })
  .handler(async ({ data }): Promise<RoomExtraFile[]> => {
    const extra = (await import("./room-extra.json")).default as {
      startups: Record<string, RoomExtraFile[]>;
      investors: Record<string, RoomExtraFile[]>;
    };
    const bag = data.kind === "investor" ? extra.investors : extra.startups;
    return bag[data.id] ?? [];
  });
