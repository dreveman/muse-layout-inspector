CREATE TABLE IF NOT EXISTS `layout_snapshots` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `label` text NOT NULL,
  `payload_json` text NOT NULL,
  `created_at` text NOT NULL
);
