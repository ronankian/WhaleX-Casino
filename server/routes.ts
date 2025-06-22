import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { insertUserSchema, insertGameResultSchema, insertDepositSchema, insertWithdrawalSchema, insertFarmCharacterSchema } from "@shared/schema";
import { storage } from "./storage.js";
import crypto from "crypto";
import { hashPassword, verifyPassword } from "./utils.js";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const gamePlaySchema = z.object({
  gameType: z.enum(["dice", "slots", "hilo", "crash", "mines", "plinko", "roulette"]),
  betAmount: z.number().positive(),
  gameData: z.record(z.any()),
});

const farmActionSchema = z.object({
  userId: z.number(),
  characterType: z.string(),
});

const tokenConvertSchema = z.object({
  amount: z.number().positive(),
  direction: z.enum(["moby-to-tokmoby", "tokmoby-to-moby"]),
});

const levelUpCosts: { [key: string]: number } = {
  'Fisherman': 100,
  'Woodcutter': 500,
  'Steamman': 2000,
  'Graverobber': 5000
};

const HIRE_COSTS = [1000, 5000, 20000, 50000];
const LEVEL_UP_COSTS = [
  0.0100, 0.0150, 0.0225, 0.0325, 0.0450, 0.0600, 0.0775, 0.0975, 0.1200, 0.1450,
  0.1725, 0.2025, 0.2350, 0.2700, 0.3075, 0.3475, 0.3900, 0.4350, 0.4825, 0.5325,
  0.5850, 0.6400, 0.6975, 0.7575,
];

const ALL_CHARACTERS = [
  { name: "Fisherman", profileImg: "/farm/fishing/Character animation/Fisherman/Fisherman_profile.png" },
  { name: "Graverobber", profileImg: "/farm/fishing/Character animation/Graverobber/Graverobber_profile.png" },
  { name: "Steamman", profileImg: "/farm/fishing/Character animation/Steamman/Steamman_profile.png" },
  { name: "Woodcutter", profileImg: "/farm/fishing/Character animation/Woodcutter/Woodcutter_profile.png" },
];

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      const wallet = await storage.getWallet(user.id);
      
      res.json({ 
        user: { ...user, password: undefined },
        wallet 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Account is suspended" });
      }

      const wallet = await storage.getWallet(user.id);
      
      res.json({ 
        user: { ...user, password: undefined },
        wallet 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Invalid user ID" });
    }
  });

  // Wallet routes
  app.get("/api/wallet/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      res.json(wallet);
    } catch (error) {
      res.status(400).json({ message: "Invalid user ID" });
    }
  });

  app.post("/api/wallet/:userId/convert", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { amount, direction } = tokenConvertSchema.parse(req.body);
      
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      let updates: Partial<typeof wallet> = {};
      
      if (direction === "moby-to-tokmoby") {
        const mobyBalance = parseFloat(wallet.mobyTokens);
        if (mobyBalance < amount) {
          return res.status(400).json({ message: "Insufficient MOBY balance" });
        }
        
        updates.mobyTokens = (mobyBalance - amount).toFixed(4);
        updates.mobyCoins = (parseFloat(wallet.mobyCoins) + (amount * 5000)).toFixed(2);
      } else {
        const mobyCoinsBalance = parseFloat(wallet.mobyCoins);
        const requiredMobyCoins = amount * 5000;
        
        if (mobyCoinsBalance < requiredMobyCoins) {
          return res.status(400).json({ message: "Insufficient MOBY Token balance" });
        }
        
        updates.mobyCoins = (mobyCoinsBalance - requiredMobyCoins).toFixed(2);
        updates.mobyTokens = (parseFloat(wallet.mobyTokens) + amount).toFixed(4);
      }

      const updatedWallet = await storage.updateWallet(userId, updates);
      res.json(updatedWallet);
    } catch (error) {
      res.status(400).json({ message: "Invalid conversion data" });
    }
  });

  // Farm Game Routes
  app.get("/api/farm/characters/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userCharacters = await storage.getFarmCharacters(userId);
      
      const charactersWithDetails = ALL_CHARACTERS.map(staticChar => {
        const dbChar = userCharacters.find(db => db.characterType === staticChar.name);
        if (dbChar) {
          return {
            ...staticChar,
            hired: true,
            level: dbChar.level,
            status: dbChar.status,
            totalCatch: dbChar.totalCatch,
          };
        }
        return {
          ...staticChar,
          hired: false,
          level: 1,
          status: 'Idle',
          totalCatch: 0,
        };
      });
      
      res.json(charactersWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching farm characters", error: (error as Error).message });
    }
  });

  app.post("/api/farm/hire", async (req, res) => {
    try {
      const { userId, characterType } = farmActionSchema.parse(req.body);

      // 1. Get user's wallet
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      // 2. Determine hire cost
      const userCharacters = await storage.getFarmCharacters(userId);
      const numHired = userCharacters.length;
      if (numHired >= HIRE_COSTS.length) {
        return res.status(400).json({ message: "No more characters to hire" });
      }
      const hireCost = HIRE_COSTS[numHired];

      // 3. Check balance
      const balance = parseFloat(wallet.coins);
      if (balance < hireCost) {
        return res.status(400).json({ message: "Insufficient coins to hire" });
      }

      // 4. Deduct cost and create character
      await storage.updateWallet(userId, { coins: (balance - hireCost).toFixed(2) });
      const newCharacter = await storage.createFarmCharacter({ userId, characterType, hired: true, level: 1 });

      res.status(201).json(newCharacter);
    } catch (error) {
      res.status(400).json({ message: "Invalid hire request", error: (error as Error).message });
    }
  });

  app.post("/api/farm/level-up", async (req, res) => {
    try {
      const { userId, characterType } = farmActionSchema.parse(req.body);

      // 1. Get character and wallet
      const character = await storage.getFarmCharacter(userId, characterType);
      const wallet = await storage.getWallet(userId);
      if (!character || !wallet) {
        return res.status(404).json({ message: "Character or wallet not found" });
      }
      if (character.level >= 25) {
        return res.status(400).json({ message: "Character is at max level" });
      }

      // 2. Determine level up cost
      const levelUpCost = LEVEL_UP_COSTS[character.level - 1];
      const mobyBalance = parseFloat(wallet.mobyTokens);

      // 3. Check balance
      if (mobyBalance < levelUpCost) {
        return res.status(400).json({ message: "Insufficient $MOBY to level up" });
      }

      // 4. Deduct cost and update level
      await storage.updateWallet(userId, { mobyTokens: (mobyBalance - levelUpCost).toFixed(4) });
      const updatedCharacter = await storage.updateFarmCharacter(character.id, { level: character.level + 1 });
      
      res.json(updatedCharacter);
    } catch (error) {
      res.status(400).json({ message: "Invalid level-up request", error: (error as Error).message });
    }
  });

  // Game routes
  app.post("/api/games/play", async (req, res) => {
    try {
      const { gameType, betAmount, gameData, userId } = gamePlaySchema.parse(req.body);

      const wallet = await storage.getWallet(userId);
      if (!wallet || parseFloat(wallet.coins) < betAmount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      const serverSeed = crypto.randomBytes(32).toString("hex");
      const clientSeed = gameData.clientSeed || crypto.randomBytes(32).toString("hex");
      const nonce = gameData.nonce || 0;

      let result: any;
      let gameResult: any;

      switch (gameType) {
        case "dice":
          const diceTarget = gameData.target || 50;
          const diceRoll = generateProvablyFairNumber(serverSeed, clientSeed, nonce, 1, 100);
          result = { roll: diceRoll, target: diceTarget };
          gameResult = {
            gameType,
            betAmount: betAmount.toString(),
            payout: (diceRoll < diceTarget ? betAmount * (99 / Math.max(1, diceTarget - 1)) : 0).toFixed(2),
            isWin: diceRoll < diceTarget,
            multiplier: (diceRoll < diceTarget ? (99 / Math.max(1, diceTarget - 1)) : 0).toFixed(2),
            result: JSON.stringify(result),
            serverSeed,
            clientSeed,
            nonce
          };
          break;

        case "slots":
          const symbols = ['fish', 'crown', 'gem', 'ship', 'anchor'];
          const reels = Array(5).fill(0).map((_, i) => 
            symbols[generateProvablyFairNumber(serverSeed, clientSeed, nonce + i, 0, symbols.length - 1)]
          );
          
          // Simple win logic - check for matching symbols
          const matches = reels.filter(symbol => symbol === reels[0]).length;
          result = { reels, matches };
          gameResult = {
            gameType,
            betAmount: betAmount.toString(),
            payout: (matches >= 3 ? betAmount * (matches >= 5 ? 1000 : matches >= 4 ? 100 : matches >= 3 ? 10 : 0) : 0).toFixed(2),
            isWin: matches >= 3,
            multiplier: (matches >= 5 ? 1000 : matches >= 4 ? 100 : matches >= 3 ? 10 : 0).toFixed(2),
            result: JSON.stringify(result),
            serverSeed,
            clientSeed,
            nonce
          };
          break;

        case "hilo":
          const currentCard = gameData.currentCard || generateProvablyFairNumber(serverSeed, clientSeed, nonce, 1, 13);
          const nextCard = generateProvablyFairNumber(serverSeed, clientSeed, nonce + 1, 1, 13);
          const guess = gameData.guess; // "higher" or "lower"
          
          result = { currentCard, nextCard, guess };
          gameResult = {
            gameType,
            betAmount: betAmount.toString(),
            payout: (
              (guess === "higher" && nextCard > currentCard) || 
              (guess === "lower" && nextCard < currentCard)
              ? betAmount * Math.max(1, (gameData.streak || 0) + 1) * 1.5
              : 0
            ).toFixed(2),
            isWin: (guess === "higher" && nextCard > currentCard) || 
                    (guess === "lower" && nextCard < currentCard),
            multiplier: (
              (guess === "higher" && nextCard > currentCard) || 
              (guess === "lower" && nextCard < currentCard)
              ? Math.max(1, (gameData.streak || 0) + 1) * 1.5
              : 0
            ).toFixed(2),
            result: JSON.stringify(result),
            serverSeed,
            clientSeed,
            nonce
          };
          break;

        case "mines":
          const gridSize = gameData.gridSize || 25;
          const mineCount = gameData.mineCount || 5;
          const revealedCells = gameData.revealedCells || [];
          const selectedCell = gameData.selectedCell;
          
          // Generate mine positions
          const mines = [];
          for (let i = 0; i < mineCount; i++) {
            mines.push(generateProvablyFairNumber(serverSeed, clientSeed, nonce + i, 0, gridSize - 1));
          }
          
          result = { selectedCell, isMine: !mines.includes(selectedCell), revealedCells: [...revealedCells, selectedCell] };
          gameResult = {
            gameType,
            betAmount: betAmount.toString(),
            payout: (mines.includes(selectedCell) ? 0 : betAmount * Math.pow(1.2, revealedCells.length + 1)).toFixed(2),
            isWin: !mines.includes(selectedCell),
            multiplier: (mines.includes(selectedCell) ? 0 : Math.pow(1.2, revealedCells.length + 1)).toFixed(2),
            result: JSON.stringify(result),
            serverSeed,
            clientSeed,
            nonce
          };
          break;

        case "plinko":
          const rows = gameData.rows || 16;
          const ballPath = [];
          let position = rows / 2;
          
          for (let i = 0; i < rows; i++) {
            const direction = generateProvablyFairNumber(serverSeed, clientSeed, nonce + i, 0, 1);
            position += direction === 0 ? -0.5 : 0.5;
            ballPath.push(position);
          }
          
          const finalPosition = Math.floor(position);
          const multipliers = [1000, 130, 26, 9, 4, 2, 1.5, 1, 0.5, 1, 1.5, 2, 4, 9, 26, 130, 1000];
          const multiplier = multipliers[Math.max(0, Math.min(finalPosition, multipliers.length - 1))];
          result = { ballPath, finalPosition, multiplier };
          gameResult = {
            gameType,
            betAmount: betAmount.toString(),
            payout: (multiplier >= 1 ? betAmount * multiplier : 0).toFixed(2),
            isWin: multiplier >= 1,
            multiplier: multiplier.toFixed(2),
            result: JSON.stringify(result),
            serverSeed,
            clientSeed,
            nonce
          };
          break;

        case "roulette":
          const betType = gameData.betType || "number";
          const betValue = gameData.betValue || 0;
          const winningNumber = generateProvablyFairNumber(serverSeed, clientSeed, nonce, 0, 36);
          
          result = { winningNumber, betType, betValue };
          gameResult = {
            gameType,
            betAmount: betAmount.toString(),
            payout: (
              betType === "number" && winningNumber === betValue ? betAmount * 35 :
              betType === "red" && [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber) ? betAmount * 2 :
              betType === "black" && [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35].includes(winningNumber) ? betAmount * 2 :
              betType === "even" && winningNumber % 2 === 0 && winningNumber !== 0 ? betAmount * 2 :
              betType === "odd" && winningNumber % 2 === 1 ? betAmount * 2 :
              0
            ).toFixed(2),
            isWin: (
              betType === "number" && winningNumber === betValue ||
              betType === "red" && [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber) ||
              betType === "black" && [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35].includes(winningNumber) ||
              betType === "even" && winningNumber % 2 === 0 && winningNumber !== 0 ||
              betType === "odd" && winningNumber % 2 === 1
            ),
            multiplier: (
              betType === "number" && winningNumber === betValue ? 35 :
              betType === "red" && [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber) ? 2 :
              betType === "black" && [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35].includes(winningNumber) ? 2 :
              betType === "even" && winningNumber % 2 === 0 && winningNumber !== 0 ? 2 :
              betType === "odd" && winningNumber % 2 === 1 ? 2 :
              0
            ).toFixed(2),
            result: JSON.stringify(result),
            serverSeed,
            clientSeed,
            nonce
          };
          break;

        case "crash":
          const crashPoint = generateCrashPoint(serverSeed, clientSeed, nonce);
          const cashOutPoint = gameData.cashOut !== undefined ? gameData.cashOut : 1.0;
          
          // If cashOut is 0, it means the game crashed before cash out (loss)
          result = { crashPoint, cashOut: cashOutPoint };
          gameResult = {
            gameType,
            betAmount: betAmount.toString(),
            payout: (cashOutPoint > 0 && cashOutPoint <= crashPoint ? cashOutPoint : 0).toFixed(2),
            isWin: cashOutPoint > 0 && cashOutPoint <= crashPoint,
            multiplier: (cashOutPoint > 0 && cashOutPoint <= crashPoint ? cashOutPoint : 0).toFixed(2),
            result: JSON.stringify(result),
            serverSeed,
            clientSeed,
            nonce
          };
          break;
      }

      // Update wallet based on win/loss
      const newBalance = parseFloat(wallet.coins) + (gameResult.payout - betAmount);
      await storage.updateWallet(userId, { coins: newBalance.toFixed(2) });

      // Add to jackpot if it's a loss
      if (!gameResult.isWin && betAmount > 0) {
        const jackpotContribution = betAmount * 0.10; // 10% contribution
        await storage.addToJackpot(jackpotContribution);
      }

      // Save game result to DB
      await storage.createGameResult({
        userId,
        gameType,
        betAmount: betAmount.toString(),
        payout: gameResult.payout.toString(),
        isWin: gameResult.isWin,
        clientSeed,
        serverSeed,
        nonce,
      });

      res.json({
        result,
        gameResult,
        newBalance: newBalance.toFixed(2),
      });

    } catch (error) {
      console.error("Game play error:", error);
      res.status(400).json({ message: "Invalid game play data" });
    }
  });

  app.get("/api/games/history/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 10;
      
      const history = await storage.getGameResults(userId, limit);
      res.json(history);
    } catch (error) {
      res.status(400).json({ message: "Error fetching game history" });
    }
  });

  // Deposit routes
  app.post("/api/deposits", async (req, res) => {
    try {
      const depositData = insertDepositSchema.parse(req.body);
      const deposit = await storage.createDeposit(depositData);
      res.json(deposit);
    } catch (error) {
      res.status(400).json({ message: "Invalid deposit data" });
    }
  });

  app.get("/api/deposits/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const deposits = await storage.getDeposits(userId);
      res.json(deposits);
    } catch (error) {
      res.status(400).json({ message: "Invalid user ID" });
    }
  });

  // Withdrawal routes
  app.post("/api/withdrawals", async (req, res) => {
    try {
      const withdrawalData = insertWithdrawalSchema.parse(req.body);
      const withdrawal = await storage.createWithdrawal(withdrawalData);
      res.json(withdrawal);
    } catch (error) {
      res.status(400).json({ message: "Invalid withdrawal data" });
    }
  });

  app.get("/api/withdrawals/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const withdrawals = await storage.getWithdrawals(userId);
      res.json(withdrawals);
    } catch (error) {
      res.status(400).json({ message: "Invalid user ID" });
    }
  });

  // Jackpot routes
  app.get("/api/jackpot", async (req, res) => {
    try {
      const currentJackpot = await storage.getJackpot();
      res.json(currentJackpot);
    } catch (error) {
      res.status(500).json({ message: "Error fetching jackpot" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for provably fair gaming
function generateProvablyFairNumber(serverSeed: string, clientSeed: string, nonce: number, min: number, max: number): number {
  const combinedSeed = crypto.createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest('hex');
  
  const seedNumber = parseInt(combinedSeed.substring(0, 8), 16);
  return min + (seedNumber % (max - min + 1));
}

function generateCrashPoint(serverSeed: string, clientSeed: string, nonce: number): number {
  const hash = crypto.createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest('hex');
  
  const seedNumber = parseInt(hash.substring(0, 8), 16);
  const crashPoint = Math.max(1.01, seedNumber / 0xFFFFFFFF * 10);
  
  return Math.round(crashPoint * 100) / 100;
}
