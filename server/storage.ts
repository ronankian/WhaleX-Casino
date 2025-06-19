import { 
  users, wallets, gameResults, deposits, withdrawals,
  type User, type InsertUser, type Wallet, type InsertWallet,
  type GameResult, type InsertGameResult, type Deposit, type InsertDeposit,
  type Withdrawal, type InsertWithdrawal
} from "@shared/schema";

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
  
  // Deposit operations
  createDeposit(deposit: InsertDeposit): Promise<Deposit>;
  getDeposits(userId?: number): Promise<Deposit[]>;
  updateDeposit(id: number, updates: Partial<Deposit>): Promise<Deposit | undefined>;
  
  // Withdrawal operations
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getWithdrawals(userId?: number): Promise<Withdrawal[]>;
  updateWithdrawal(id: number, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private wallets: Map<number, Wallet> = new Map();
  private gameResults: Map<number, GameResult> = new Map();
  private deposits: Map<number, Deposit> = new Map();
  private withdrawals: Map<number, Withdrawal> = new Map();
  
  private currentUserId = 1;
  private currentWalletId = 1;
  private currentGameResultId = 1;
  private currentDepositId = 1;
  private currentWithdrawalId = 1;

  constructor() {
    // Create admin user
    this.createUser({
      username: "admin",
      email: "admin@whalex.com",
      password: "admin1234",
      role: "admin",
      isActive: true,
      level: 99
    });

    // Create demo player
    this.createUser({
      username: "player123",
      email: "player123@email.com", 
      password: "password123",
      role: "player",
      isActive: true,
      level: 5
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      joinDate: new Date()
    };
    this.users.set(id, user);
    
    // Create wallet for new user
    await this.createWallet({ userId: id });
    
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getWallet(userId: number): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(wallet => wallet.userId === userId);
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = this.currentWalletId++;
    const wallet: Wallet = {
      id,
      ...insertWallet,
      coins: insertWallet.coins || "1000.00",
      mobyTokens: insertWallet.mobyTokens || "0.0000",
      tokMoby: insertWallet.tokMoby || "0.00"
    };
    this.wallets.set(id, wallet);
    return wallet;
  }

  async updateWallet(userId: number, updates: Partial<Wallet>): Promise<Wallet | undefined> {
    const wallet = Array.from(this.wallets.values()).find(w => w.userId === userId);
    if (!wallet) return undefined;
    
    const updatedWallet = { ...wallet, ...updates };
    this.wallets.set(wallet.id, updatedWallet);
    return updatedWallet;
  }

  async createGameResult(insertResult: InsertGameResult): Promise<GameResult> {
    const id = this.currentGameResultId++;
    const result: GameResult = {
      ...insertResult,
      id,
      createdAt: new Date()
    };
    this.gameResults.set(id, result);
    return result;
  }

  async getGameResults(userId: number, limit = 10): Promise<GameResult[]> {
    return Array.from(this.gameResults.values())
      .filter(result => result.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createDeposit(insertDeposit: InsertDeposit): Promise<Deposit> {
    const id = this.currentDepositId++;
    const deposit: Deposit = {
      ...insertDeposit,
      id,
      createdAt: new Date(),
      processedAt: null
    };
    this.deposits.set(id, deposit);
    return deposit;
  }

  async getDeposits(userId?: number): Promise<Deposit[]> {
    let deposits = Array.from(this.deposits.values());
    if (userId) {
      deposits = deposits.filter(deposit => deposit.userId === userId);
    }
    return deposits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateDeposit(id: number, updates: Partial<Deposit>): Promise<Deposit | undefined> {
    const deposit = this.deposits.get(id);
    if (!deposit) return undefined;
    
    const updatedDeposit = { ...deposit, ...updates };
    if (updates.status && updates.status !== "pending") {
      updatedDeposit.processedAt = new Date();
    }
    this.deposits.set(id, updatedDeposit);
    return updatedDeposit;
  }

  async createWithdrawal(insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const id = this.currentWithdrawalId++;
    const withdrawal: Withdrawal = {
      ...insertWithdrawal,
      id,
      createdAt: new Date(),
      processedAt: null
    };
    this.withdrawals.set(id, withdrawal);
    return withdrawal;
  }

  async getWithdrawals(userId?: number): Promise<Withdrawal[]> {
    let withdrawals = Array.from(this.withdrawals.values());
    if (userId) {
      withdrawals = withdrawals.filter(withdrawal => withdrawal.userId === userId);
    }
    return withdrawals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateWithdrawal(id: number, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined> {
    const withdrawal = this.withdrawals.get(id);
    if (!withdrawal) return undefined;
    
    const updatedWithdrawal = { ...withdrawal, ...updates };
    if (updates.status && updates.status !== "pending") {
      updatedWithdrawal.processedAt = new Date();
    }
    this.withdrawals.set(id, updatedWithdrawal);
    return updatedWithdrawal;
  }
}

export const storage = new MemStorage();
