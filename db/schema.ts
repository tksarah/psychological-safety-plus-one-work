import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const workshopSessions = sqliteTable(
  "workshop_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("workshop_sessions_code_unique").on(table.code)],
);

export const plusActions = sqliteTable("plus_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionCode: text("session_code").notNull(),
  itemNumber: integer("item_number").notNull(),
  actionText: text("action_text").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
