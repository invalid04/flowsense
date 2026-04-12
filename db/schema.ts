import { pgTable, uuid, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";

export const accounts = pgTable("accounts", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    apiKey: text("api_key").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
        .notNull()
        .references(() => accounts.id, { onDelete: "cascade" }),
    sessionKey: text("session_key").notNull().unique(),
    lastStateId: uuid("last_state_id").references(() => states.id, {
        onDelete: "set null",
      }),
    createdAt: timestamp("created_at").defaultNow().notNull()
});

export const states = pgTable(
    "states",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        name: text("name").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => ({
        nameIdx: uniqueIndex("states_name_idx").on(table.name),
    })
); 

export const transitions = pgTable("transitions", {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
        .notNull()
        .references(() => sessions.id, { onDelete: "cascade" }), 
    fromStateId: uuid("from_state_id")
        .notNull()
        .references(() => states.id, { onDelete: "cascade" }), 
    toStateId: uuid("to_state_id")
        .notNull()
        .references(() => states.id, { onDelete: "cascade" }), 
    count: integer("count").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});