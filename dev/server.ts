import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Ctx } from "@hatch/space-sdk";
import { Actions } from "../server/src/actions";

const rootDir = path.resolve(import.meta.dir, "..");
const devDir = path.join(rootDir, ".dev");
const distDir = path.join(devDir, "dist");
const dbPath = path.join(devDir, "app.db");
const port = Number(process.env.PORT ?? 4174);

mkdirSync(distDir, { recursive: true });

const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: path.join(rootDir, "drizzle") });

async function buildClientBundle() {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });
  const result = await Bun.build({
    entrypoints: [path.join(rootDir, "client/index.html")],
    outdir: distDir,
    target: "browser",
    splitting: false,
    minify: false,
  });
  if (!result.success) {
    console.error("Client build failed:", result.logs);
  }
}

await buildClientBundle();

type AnyAction = {
  request: { parse: (v: unknown) => unknown };
  response: { parse: (v: unknown) => unknown };
  handler: (ctx: Ctx, args: unknown) => Promise<unknown>;
};

const actionMap = Actions as unknown as Record<string, AnyAction>;

const server = Bun.serve({
  port,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/actions") {
      try {
        const body = (await req.json()) as { action?: string; args?: unknown };
        const actionName = body.action ?? "";
        const def = actionMap[actionName];
        if (!def) {
          return Response.json({ error: `Unknown action: ${actionName}` }, { status: 404 });
        }
        const parsedArgs = def.request.parse(body.args ?? {});
        const ctx = {
          db: () => db,
          viewer: {
            source: "local" as const,
            authenticated: true as const,
            spaceSlug: "muse-layout-inspector",
            userId: "local-dev",
            ownerUserId: "local-dev",
            isOwner: true,
          },
          emit: () => {},
          invalidateQueries: () => {},
          executePrivileged: async () => {
            throw new Error("No privileged handlers configured");
          },
          agent: {
            spawnTask: async () => ({ ok: false as const, error: "Not configured in local dev" }),
            send: async () => ({ ok: false as const, error: "Not configured in local dev" }),
            status: async () => ({ taskId: "", status: "not_found" as const }),
          },
          inference: {
            complete: async () => {
              throw new Error("Not configured in local dev");
            },
          },
          tool: {} as Ctx["tool"],
        } as unknown as Ctx;
        const rawResult = await def.handler(ctx, parsedArgs);
        const validated = def.response.parse(rawResult);
        return Response.json({ data: validated });
      } catch (err) {
        return Response.json(
          { error: err instanceof Error ? err.message : String(err) },
          { status: 400 },
        );
      }
    }

    const relPath = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
    const filePath = path.join(distDir, relPath);
    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }
    return new Response(Bun.file(path.join(distDir, "index.html")));
  },
});

console.log(`Layout Inspector dev server listening on http://127.0.0.1:${server.port}`);
void readFileSync;
void writeFileSync;
