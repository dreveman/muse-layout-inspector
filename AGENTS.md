# Building this web artifact

This directory is a git checkout for `muse-layout-inspector` — a TypeScript
space with a React client in `client/`, server actions in
`server/src/actions.ts`, schema in `server/src/schema.ts`, and Drizzle SQL
migrations in `drizzle/` (see `space.json.template` for the descriptor
template).

Build, audit, and publish it through the web-artifact builder interface your
session provides. See `docs/INSTALL_GUIDE_FOR_MUSE_ASSISTENT.md` for staging
the source under `~/workspace/ts-spaces/<generated-slug>/` and generating
`space.json` from `space.json.template`.
