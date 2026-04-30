"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionEvents = exports.apiKeys = exports.transitions = exports.states = exports.sessions = exports.accounts = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.accounts = (0, pg_core_1.pgTable)("accounts", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    apiKey: (0, pg_core_1.text)("api_key").notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    accountId: (0, pg_core_1.uuid)("account_id")
        .notNull()
        .references(() => exports.accounts.id, { onDelete: "cascade" }),
    sessionKey: (0, pg_core_1.text)("session_key").notNull().unique(),
    lastStateId: (0, pg_core_1.uuid)("last_state_id").references(() => exports.states.id, {
        onDelete: "set null",
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull()
});
exports.states = (0, pg_core_1.pgTable)("states", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
}, (table) => ({
    nameIdx: (0, pg_core_1.uniqueIndex)("states_name_idx").on(table.name),
}));
exports.transitions = (0, pg_core_1.pgTable)("transitions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    accountId: (0, pg_core_1.uuid)("account_id")
        .notNull()
        .references(() => exports.accounts.id, { onDelete: "cascade" }),
    sessionId: (0, pg_core_1.uuid)("session_id")
        .notNull()
        .references(() => exports.sessions.id, { onDelete: "cascade" }),
    fromStateId: (0, pg_core_1.uuid)("from_state_id")
        .notNull()
        .references(() => exports.states.id, { onDelete: "cascade" }),
    toStateId: (0, pg_core_1.uuid)("to_state_id")
        .notNull()
        .references(() => exports.states.id, { onDelete: "cascade" }),
    count: (0, pg_core_1.integer)("count").default(1).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.apiKeys = (0, pg_core_1.pgTable)("api_keys", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    accountId: (0, pg_core_1.uuid)("account_id")
        .notNull()
        .references(() => exports.accounts.id, { onDelete: "cascade" }),
    key: (0, pg_core_1.text)("key").notNull().unique(),
    label: (0, pg_core_1.text)("label").notNull().default("Default Key"),
    revokedAt: (0, pg_core_1.timestamp)("revoked_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.sessionEvents = (0, pg_core_1.pgTable)("session_events", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    accountId: (0, pg_core_1.uuid)("account_id").notNull().references(() => exports.accounts.id, { onDelete: "cascade" }),
    sessionId: (0, pg_core_1.uuid)("session_id").notNull().references(() => exports.sessions.id, { onDelete: "cascade" }),
    stateId: (0, pg_core_1.uuid)("state_id").notNull().references(() => exports.states.id, { onDelete: "cascade" }),
    occurredAt: (0, pg_core_1.timestamp)("occurred_at").notNull().defaultNow(),
});
