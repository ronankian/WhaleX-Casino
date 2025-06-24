import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and } from "drizzle-orm";
import {
  users, wallets, gameResults, deposits, withdrawals, jackpot, farmCharacters, farmInventory,
  type User, type InsertUser, type Wallet, type InsertWallet,
  type GameResult, type InsertGameResult, type Deposit, type InsertDeposit,
  type Withdrawal, type InsertWithdrawal, type Jackpot, type InsertJackpot,
  type FarmCharacter, type InsertFarmCharacter, type FarmInventory, type InsertFarmInventory
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { db } from "./db";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Wallet operations
  getWallet(userId: number): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(userId: number, updates: Partial<Wallet>): Promise<Wallet | undefined>;
  
  // Game operations
  createGameResult(result: InsertGameResult): Promise<GameResult>;
  getGameResults(userId: number, limit?: number): Promise<GameResult[]>;
  
  // Jackpot operations
  getJackpot(): Promise<Jackpot | undefined>;
  updateJackpot(updates: Partial<Jackpot>): Promise<Jackpot | undefined>;
  addToJackpot(amount: number): Promise<Jackpot | undefined>;
  
  // Deposit operations
  createDeposit(deposit: InsertDeposit): Promise<Deposit>;
  getDeposits(userId?: number): Promise<Deposit[]>;
  updateDeposit(id: number, updates: Partial<Deposit>): Promise<Deposit | undefined>;
  
  // Withdrawal operations
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getWithdrawals(userId?: number): Promise<Withdrawal[]>;
  updateWithdrawal(id: number, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined>;

  // Farm character operations
  getFarmCharacters(userId: number): Promise<FarmCharacter[]>;
  getFarmCharacter(userId: number, characterType: string): Promise<FarmCharacter | undefined>;
  createFarmCharacter(character: InsertFarmCharacter): Promise<FarmCharacter>;
  updateFarmCharacter(id: number, updates: Partial<FarmCharacter>): Promise<FarmCharacter | undefined>;
  getFishingCharacters(userId: number): Promise<FarmCharacter[]>;
  stopAllFishing(userId: number): Promise<void>;
  incrementTotalCatch(characterId: number, amount: number): Promise<void>;

  // Farm Inventory operations
  getFarmInventory(userId: number): Promise<FarmInventory[]>;
  getFarmInventoryItem(inventoryId: number): Promise<FarmInventory | undefined>;
  findFarmInventoryItem(userId: number, itemId: string): Promise<FarmInventory | undefined>;
  addFarmInventoryItem(item: InsertFarmInventory): Promise<FarmInventory>;
  addManyFarmInventoryItems(items: InsertFarmInventory[]): Promise<FarmInventory[]>;
  updateFarmInventoryItem(id: number, updates: Partial<FarmInventory>): Promise<FarmInventory | undefined>;
  deleteFarmInventoryItem(id: number): Promise<{ id: number }>;

  // Level stats operations
  getLevelStats(): Promise<any[]>;
}

export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser = await db.insert(users).values(insertUser).returning();
    
    // Create wallet for new user
    await this.createWallet({ userId: newUser[0].id });
    
    return newUser[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getWallet(userId: number): Promise<Wallet | undefined> {
    const result = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return result[0];
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const result = await db.insert(wallets).values({
      ...insertWallet,
      coins: "1000.00",
      mobyTokens: "0.0000",
      mobyCoins: "0.00"
    }).returning();
    return result[0];
  }

  async updateWallet(userId: number, updates: Partial<Wallet>): Promise<Wallet | undefined> {
    const result = await db.update(wallets).set(updates).where(eq(wallets.userId, userId)).returning();
    return result[0];
  }

  async createGameResult(insertResult: InsertGameResult): Promise<GameResult> {
    const result = await db.insert(gameResults).values(insertResult).returning();
    return result[0];
  }

  async getGameResults(userId: number, limit = 10): Promise<GameResult[]> {
    return db.select().from(gameResults)
      .where(eq(gameResults.userId, userId))
      .orderBy(desc(gameResults.createdAt))
      .limit(limit);
  }

  async createDeposit(insertDeposit: InsertDeposit): Promise<Deposit> {
    const result = await db.insert(deposits).values(insertDeposit).returning();
    return result[0];
  }

  async getDeposits(userId?: number): Promise<Deposit[]> {
    const query = db.select().from(deposits).orderBy(desc(deposits.createdAt));
    if (userId) {
      return query.where(eq(deposits.userId, userId));
    }
    return query;
  }

  async updateDeposit(id: number, updates: Partial<Deposit>): Promise<Deposit | undefined> {
    const result = await db.update(deposits).set(updates).where(eq(deposits.id, id)).returning();
    return result[0];
  }

  async createWithdrawal(insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const result = await db.insert(withdrawals).values(insertWithdrawal).returning();
    return result[0];
  }

  async getWithdrawals(userId?: number): Promise<Withdrawal[]> {
    const query = db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
    if (userId) {
      return query.where(eq(withdrawals.userId, userId));
    }
    return query;
  }

  async updateWithdrawal(id: number, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined> {
    const result = await db.update(withdrawals).set(updates).where(eq(withdrawals.id, id)).returning();
    return result[0];
  }

  async getJackpot(): Promise<Jackpot | undefined> {
    const result = await db.select().from(jackpot).limit(1);
    if (result.length === 0) {
      // Initialize jackpot if it doesn't exist
      const newJackpot = await db.insert(jackpot).values({
        totalPool: "0.0000"
      }).returning();
      return newJackpot[0];
    }
    return result[0];
  }

  async updateJackpot(updates: Partial<Jackpot>): Promise<Jackpot | undefined> {
    const currentJackpot = await this.getJackpot();
    if (!currentJackpot) return undefined;
    
    const result = await db.update(jackpot)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jackpot.id, currentJackpot.id))
      .returning();
    return result[0];
  }

  async addToJackpot(amount: number): Promise<Jackpot | undefined> {
    await db.execute(sql`UPDATE jackpot SET total_pool = total_pool + ${amount} WHERE id = 1`);
    return this.getJackpot();
  }

  async getFarmCharacters(userId: number): Promise<FarmCharacter[]> {
    return db.select().from(farmCharacters).where(eq(farmCharacters.userId, userId));
  }

  async getFarmCharacter(userId: number, characterType: string): Promise<FarmCharacter | undefined> {
    const result = await db.select().from(farmCharacters)
      .where(and(eq(farmCharacters.userId, userId), eq(farmCharacters.characterType, characterType)));
    return result[0];
  }

  async createFarmCharacter(character: InsertFarmCharacter): Promise<FarmCharacter> {
    const result = await db.insert(farmCharacters).values(character).returning();
    return result[0];
  }

  async updateFarmCharacter(id: number, updates: Partial<FarmCharacter>): Promise<FarmCharacter | undefined> {
    const result = await db.update(farmCharacters).set(updates).where(eq(farmCharacters.id, id)).returning();
    return result[0];
  }

  async getFishingCharacters(userId: number): Promise<FarmCharacter[]> {
    return db.select().from(farmCharacters)
      .where(and(eq(farmCharacters.userId, userId), eq(farmCharacters.status, 'Fishing')));
  }

  async stopAllFishing(userId: number): Promise<void> {
    await db.update(farmCharacters)
      .set({ status: 'Idle' })
      .where(and(eq(farmCharacters.userId, userId), eq(farmCharacters.status, 'Fishing')));
  }
  
  async incrementTotalCatch(characterId: number, amount: number): Promise<void> {
    const character = await db.select({ totalCatch: farmCharacters.totalCatch }).from(farmCharacters).where(eq(farmCharacters.id, characterId));
    if (character.length > 0) {
      const newTotal = character[0].totalCatch + amount;
      await db.update(farmCharacters).set({ totalCatch: newTotal }).where(eq(farmCharacters.id, characterId));
    }
  }

  async getFarmInventory(userId: number): Promise<FarmInventory[]> {
    return db.select().from(farmInventory).where(eq(farmInventory.userId, userId)).orderBy(desc(farmInventory.caughtAt));
  }

  async getFarmInventoryItem(inventoryId: number): Promise<FarmInventory | undefined> {
    const result = await db.select().from(farmInventory).where(eq(farmInventory.id, inventoryId));
    return result[0];
  }

  async findFarmInventoryItem(userId: number, itemId: string): Promise<FarmInventory | undefined> {
    const result = await db.select().from(farmInventory)
      .where(and(eq(farmInventory.userId, userId), eq(farmInventory.itemId, itemId), eq(farmInventory.locked, false)));
    return result[0];
  }

  async addFarmInventoryItem(item: InsertFarmInventory): Promise<FarmInventory> {
    const result = await db.insert(farmInventory).values(item).returning();
    return result[0];
  }

  async addManyFarmInventoryItems(items: InsertFarmInventory[]): Promise<FarmInventory[]> {
    if (items.length === 0) return [];
    const result = await db.insert(farmInventory).values(items).returning();
    return result;
  }

  async updateFarmInventoryItem(id: number, updates: Partial<FarmInventory>): Promise<FarmInventory | undefined> {
    const result = await db.update(farmInventory).set(updates).where(eq(farmInventory.id, id)).returning();
    return result[0];
  }

  async deleteFarmInventoryItem(id: number): Promise<{ id: number }> {
    const result = await db.delete(farmInventory).where(eq(farmInventory.id, id)).returning({ id: farmInventory.id });
    return result[0];
  }

  async getLevelStats(): Promise<any[]> {
    // Return level statistics for characters (fish per minute and bonus chance)
    return [
      { level: 1, fishPerMin: 1, bonusChance: 0.5 },
      { level: 2, fishPerMin: 1.2, bonusChance: 1.0 },
      { level: 3, fishPerMin: 1.4, bonusChance: 1.5 },
      { level: 4, fishPerMin: 1.6, bonusChance: 2.0 },
      { level: 5, fishPerMin: 1.8, bonusChance: 2.5 },
      { level: 6, fishPerMin: 2.0, bonusChance: 3.0 },
      { level: 7, fishPerMin: 2.2, bonusChance: 3.5 },
      { level: 8, fishPerMin: 2.4, bonusChance: 4.0 },
      { level: 9, fishPerMin: 2.6, bonusChance: 4.5 },
      { level: 10, fishPerMin: 2.8, bonusChance: 5.0 },
      { level: 11, fishPerMin: 3.0, bonusChance: 5.5 },
      { level: 12, fishPerMin: 3.2, bonusChance: 6.0 },
      { level: 13, fishPerMin: 3.4, bonusChance: 6.5 },
      { level: 14, fishPerMin: 3.6, bonusChance: 7.0 },
      { level: 15, fishPerMin: 3.8, bonusChance: 7.5 },
      { level: 16, fishPerMin: 4.0, bonusChance: 8.0 },
      { level: 17, fishPerMin: 4.2, bonusChance: 8.5 },
      { level: 18, fishPerMin: 4.4, bonusChance: 9.0 },
      { level: 19, fishPerMin: 4.6, bonusChance: 9.5 },
      { level: 20, fishPerMin: 4.8, bonusChance: 10.0 },
      { level: 21, fishPerMin: 5.0, bonusChance: 10.5 },
      { level: 22, fishPerMin: 5.2, bonusChance: 11.0 },
      { level: 23, fishPerMin: 5.4, bonusChance: 11.5 },
      { level: 24, fishPerMin: 5.6, bonusChance: 12.0 },
      { level: 25, fishPerMin: 5.8, bonusChance: 12.5 },
    ];
  }
}

export const storage = new DbStorage();
