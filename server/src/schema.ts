import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const layoutSnapshots = sqliteTable("layout_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: text("created_at").notNull(),
});
