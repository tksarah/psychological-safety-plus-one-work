import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const plusActions = sqliteTable("plus_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionCode: text("session_code").notNull(),
  itemNumber: integer("item_number").notNull(),
  actionText: text("action_text").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
