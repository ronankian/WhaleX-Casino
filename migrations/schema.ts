import { pgTable, serial, integer, numeric, text, timestamp, boolean, unique, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const deposits = pgTable("deposits", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentMethod: text("payment_method").notNull(),
	status: text().default('pending').notNull(),
	receiptUrl: text("receipt_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
});

export const gameResults = pgTable("game_results", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	gameId: integer("game_id").notNull(),
	gameType: text("game_type").notNull(),
	betAmount: numeric("bet_amount", { precision: 10, scale:  2 }).notNull(),
	payout: numeric({ precision: 10, scale:  2 }).default('0.00').notNull(),
	multiplier: numeric({ precision: 10, scale:  2 }),
	result: text(),
	isWin: boolean("is_win").default(false).notNull(),
	mobyReward: numeric("moby_reward", { precision: 10, scale:  4 }).default('0.0000'),
	serverSeed: text("server_seed").notNull(),
	clientSeed: text("client_seed").notNull(),
	nonce: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const games = pgTable("games", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	type: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
});

export const wallets = pgTable("wallets", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	coins: numeric({ precision: 10, scale:  2 }).default('1000.00').notNull(),
	mobyTokens: numeric("moby_tokens", { precision: 10, scale:  4 }).default('0.0000').notNull(),
	mobyCoins: numeric("moby_coins", { precision: 10, scale:  2 }).default('0.00').notNull(),
});

export const withdrawals = pgTable("withdrawals", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	currency: text().notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	role: text().default('player').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	level: integer().default(1).notNull(),
	joinDate: timestamp("join_date", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const jackpot = pgTable("jackpot", {
	id: serial().primaryKey().notNull(),
	totalPool: numeric("total_pool", { precision: 12, scale:  4 }).default('0.0000').notNull(),
	lastWinner: text("last_winner"),
	lastWonAmount: numeric("last_won_amount", { precision: 12, scale:  4 }).default('0.0000'),
	lastWonAt: timestamp("last_won_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const farmCharacters = pgTable("farm_characters", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	characterType: text("character_type").notNull(),
	level: integer().default(1).notNull(),
	hired: boolean().default(false).notNull(),
	status: text().default('Idle').notNull(),
	totalCatch: integer("total_catch").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "farm_characters_user_id_users_id_fk"
		}),
]);
