import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import {
  users, wallets, gameResults, deposits, withdrawals, jackpot,
  type User, type InsertUser, type Wallet, type InsertWallet,
  type GameResult, type InsertGameResult, type Deposit, type InsertDeposit,
  type Withdrawal, type InsertWithdrawal, type Jackpot, type InsertJackpot
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

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
    const currentJackpot = await this.getJackpot();
    if (!currentJackpot) return undefined;
    
    const newTotal = parseFloat(currentJackpot.totalPool) + amount;
    return this.updateJackpot({ totalPool: newTotal.toFixed(4) });
  }
}

export const storage = new DbStorage();
