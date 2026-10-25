import { defineAction, z } from "@hatch/space-sdk";
import { desc, eq } from "drizzle-orm";
import * as schema from "./schema";

export const Actions = {
  getViewerInfo: defineAction({
    request: z.object({}),
    response: z.object({
      source: z.enum(["local", "cloudflare", "anonymous"]),
      spaceSlug: z.string(),
      isOwner: z.boolean(),
      displayName: z.string().nullable(),
    }),
    async handler(ctx) {
      const viewer = ctx.viewer;
      if (!viewer) {
        return {
          source: "anonymous" as const,
          spaceSlug: "unknown",
          isOwner: false,
          displayName: null,
        };
      }
      return {
        source: viewer.source,
        spaceSlug: viewer.spaceSlug,
        isOwner: viewer.isOwner,
        displayName: viewer.source === "cloudflare" ? (viewer.displayName ?? null) : null,
      };
    },
  }),

  listSnapshots: defineAction({
    request: z.object({}),
    response: z.object({
      snapshots: z.array(
        z.object({
          id: z.number(),
          label: z.string(),
          payloadJson: z.string(),
          createdAt: z.string(),
        }),
      ),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.layoutSnapshots)
        .orderBy(desc(schema.layoutSnapshots.id))
        .limit(20)
        .all();
      return { snapshots: rows };
    },
  }),

  saveSnapshot: defineAction({
    request: z.object({
      label: z.string().trim().min(1).max(120),
      payloadJson: z.string().min(2).max(32000),
    }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      await db
        .insert(schema.layoutSnapshots)
        .values({
          label: args.label,
          payloadJson: args.payloadJson,
          createdAt: new Date().toISOString(),
        })
        .run();
      ctx.invalidateQueries(["layout-snapshots"]);
      return { ok: true };
    },
  }),

  deleteSnapshot: defineAction({
    request: z.object({ id: z.number().int() }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      await db
        .delete(schema.layoutSnapshots)
        .where(eq(schema.layoutSnapshots.id, args.id))
        .run();
      ctx.invalidateQueries(["layout-snapshots"]);
      return { ok: true };
    },
  }),
};
