import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("player"), // "player" | "admin"
  isActive: boolean("is_active").notNull().default(true),
  level: integer("level").notNull().default(1),
  joinDate: timestamp("join_date").notNull().defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  coins: decimal("coins", { precision: 10, scale: 2 }).notNull().default("1000.00"),
  mobyTokens: decimal("moby_tokens", { precision: 10, scale: 4 }).notNull().default("0.0000"),
  mobyCoins: decimal("moby_coins", { precision: 10, scale: 2 }).notNull().default("0.00"),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "dice", "slots", "hilo", "crash"
  isActive: boolean("is_active").notNull().default(true),
});

export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: integer("game_id").notNull(),
  gameType: text("game_type").notNull(),
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  payout: decimal("payout", { precision: 10, scale: 2 }).notNull().default("0.00"),
  multiplier: decimal("multiplier", { precision: 10, scale: 2 }),
  result: text("result"), // JSON string with game-specific data
  isWin: boolean("is_win").notNull().default(false),
  mobyReward: decimal("moby_reward", { precision: 10, scale: 4 }).default("0.0000"),
  serverSeed: text("server_seed").notNull(),
  clientSeed: text("client_seed").notNull(),
  nonce: integer("nonce").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const jackpot = pgTable("jackpot", {
  id: serial("id").primaryKey(),
  totalPool: decimal("total_pool", { precision: 12, scale: 4 }).default("0.0000").notNull(),
  lastWinner: text("last_winner"),
  lastWonAmount: decimal("last_won_amount", { precision: 12, scale: 4 }).default("0.0000"),
  lastWonAt: timestamp("last_won_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(), // "coins", "moby"
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const farmCharacters = pgTable("farm_characters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  characterType: text("character_type").notNull(), // "Fisherman", "Woodcutter", etc.
  level: integer("level").notNull().default(1),
  hired: boolean("hired").notNull().default(false),
  status: text("status").notNull().default("Idle"),
  totalCatch: integer("total_catch").notNull().default(0),
});

export const farmInventory = pgTable("farm_inventory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  itemId: text("item_id").notNull(), // References the item ID from farm-items.ts
  locked: boolean("locked").notNull().default(false),
  caughtAt: timestamp("caught_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  joinDate: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
});

export const insertGameResultSchema = createInsertSchema(gameResults).omit({
  id: true,
  createdAt: true,
});

export const insertJackpotSchema = createInsertSchema(jackpot).omit({
  id: true,
  updatedAt: true,
});

export const insertDepositSchema = createInsertSchema(deposits).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertFarmCharacterSchema = createInsertSchema(farmCharacters).omit({
  id: true,
});

export const insertFarmInventorySchema = createInsertSchema(farmInventory).omit({
  id: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type GameResult = typeof gameResults.$inferSelect;
export type InsertGameResult = z.infer<typeof insertGameResultSchema>;
export type Jackpot = typeof jackpot.$inferSelect;
export type InsertJackpot = z.infer<typeof insertJackpotSchema>;
export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type FarmCharacter = typeof farmCharacters.$inferSelect;
export type InsertFarmCharacter = z.infer<typeof insertFarmCharacterSchema>;
export type FarmInventory = typeof farmInventory.$inferSelect;
export type InsertFarmInventory = z.infer<typeof insertFarmInventorySchema>;

export const selectJackpotSchema = createSelectSchema(jackpot);
