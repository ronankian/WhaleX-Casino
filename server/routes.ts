import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { insertUserSchema, insertGameResultSchema, insertDepositSchema, insertWithdrawalSchema, insertFarmCharacterSchema } from "@shared/schema";
import { storage } from "./storage.js";
import crypto from "crypto";
import { hashPassword, verifyPassword } from "./utils.js";
import { FARM_ITEMS, getRandomItem } from "./farm-items.js";
import { InsertFarmInventory } from "@shared/schema";

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

const LEVEL_STATS = Array.from({ length: 25 }, (_, i) => {
  const level = i + 1;
  return {
    level,
    fishPerMin: 1 + Math.floor(level / 5), // Example: 1 at L1, 2 at L5, 3 at L10
    bonusChance: level * 0.2, // Example: 0.2% at L1, 5% at L25
  };
});

const ALL_CHARACTERS = [
  { name: "Fisherman", profileImg: "/farm/fishing/Character animation/Fisherman/Fisherman_profile.png" },
  { name: "Graverobber", profileImg: "/farm/fishing/Character animation/Graverobber/Graverobber_profile.png" },
  { name: "Steamman", profileImg: "/farm/fishing/Character animation/Steamman/Steamman_profile.png" },
  { name: "Woodcutter", profileImg: "/farm/fishing/Character animation/Woodcutter/Woodcutter_profile.png" },
];

function getStorageSlots(level: number) {
  let slots = 30;
  if (level >= 25) slots += 5;
  if (level >= 20) slots += 5;
  if (level >= 15) slots += 5;
  if (level >= 10) slots += 5;
  if (level >= 5) slots += 10;
  return slots;
}

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
      
      const allCharacters = ALL_CHARACTERS.map(staticChar => {
        const { name, ...rest } = staticChar;
        const dbChar = userCharacters.find(db => db.characterType === name);
        if (dbChar) {
          return {
            ...rest,
            characterType: name,
            id: dbChar.id,
            hired: true,
            level: dbChar.level,
            status: dbChar.status,
            totalCatch: dbChar.totalCatch,
          };
        }
        return {
          ...rest,
          characterType: name,
          id: null,
          hired: false,
          level: 1,
          status: 'Idle',
          totalCatch: 0,
        };
      });

      const hiredCharacters = allCharacters.filter(char => char.hired);
      
      res.json({
        allCharacters,
        hiredCharacters
      });
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

  // Start fishing for all hired characters
  app.post("/api/farm/start-fishing", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get all hired characters for the user
      const characters = await storage.getFarmCharacters(userId);
      const hiredCharacters = characters.filter(char => char.hired);

      if (hiredCharacters.length === 0) {
        return res.status(400).json({ message: "No hired characters to start fishing" });
      }

      // Check storage capacity
      const inventory = await storage.getFarmInventory(userId);
      const totalStorageSlots = hiredCharacters.reduce((acc, char) => {
        return acc + getStorageSlots(char.level);
      }, 0);

      if (inventory.length >= totalStorageSlots) {
        return res.status(400).json({ message: "Storage is full. Cannot start fishing." });
      }

      // Update all characters to fishing status
      for (const character of hiredCharacters) {
        await storage.updateFarmCharacter(character.id, { status: 'Fishing' });
      }

      res.json({ message: "Fishing started for all hired characters" });
    } catch (error) {
      res.status(500).json({ message: "Error starting fishing", error: (error as Error).message });
    }
  });

  // Stop fishing for all hired characters
  app.post("/api/farm/stop-fishing", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get all hired characters for the user
      const characters = await storage.getFarmCharacters(userId);
      const hiredCharacters = characters.filter(char => char.hired);

      // Update all characters to idle status
      for (const character of hiredCharacters) {
        await storage.updateFarmCharacter(character.id, { status: 'Idle' });
      }

      res.json({ message: "Fishing stopped for all hired characters" });
    } catch (error) {
      res.status(500).json({ message: "Error stopping fishing", error: (error as Error).message });
    }
  });

  // Process fishing catches (called by a cron job or timer)
  app.post("/api/farm/process-catches", async (req, res) => {
    try {
      const { userId } = z.object({ userId: z.number() }).parse(req.body);

      const fishingCharacters = await storage.getFishingCharacters(userId);
      if (fishingCharacters.length === 0) {
        return res.json({ newCatches: [] });
      }

      // Calculate total storage capacity
      const totalStorageSlots = fishingCharacters.reduce((acc, char) => {
        return acc + getStorageSlots(char.level);
      }, 0);
      
      const inventory = await storage.getFarmInventory(userId);
      let currentStorageUsed = inventory.length; // Each item is a row, so length is the count
      let availableSpace = totalStorageSlots - currentStorageUsed;
      
      if (availableSpace <= 0) {
        // If storage is already full, stop all characters and return.
        await storage.stopAllFishing(userId);
        return res.json({ newCatches: [], message: "Storage is full. Fishing stopped." });
      }

      const newCatchesForResponse: any[] = [];
      const newInventoryItems: InsertFarmInventory[] = [];
      const characterCatchCounts = new Map<number, number>();


      for (const character of fishingCharacters) {
        if (availableSpace <= 0) break;
        
        const staticChar = ALL_CHARACTERS.find(c => c.name === character.characterType);
        if (!staticChar) continue;

        const levelStats = LEVEL_STATS[character.level - 1];
        if (!levelStats) {
            continue;
        };

        // --- Catch Logic ---
        const itemsToCatch = Math.floor(levelStats.fishPerMin);
        for (let i = 0; i < itemsToCatch; i++) {
          if (availableSpace <= 0) {
            break;
          }
          
          const caughtItem = getRandomItem();
          if (caughtItem) {
            // Add to the list of items to be bulk-inserted
            newInventoryItems.push({
              userId,
              itemId: caughtItem.id,
              // quantity is no longer needed, it defaults to 1
            });

            // Keep track of how many items this character caught
            characterCatchCounts.set(character.id, (characterCatchCounts.get(character.id) || 0) + 1);
            
            // Add to the list that we send back to the client for the history log
            newCatchesForResponse.push({
              characterType: character.characterType,
              profileImg: staticChar.profileImg,
              itemName: caughtItem.name,
              itemImage: caughtItem.image,
              rarity: caughtItem.rarity,
            });

            availableSpace--;
          }
        }
      }
      
      // Perform bulk database operations after the loop
      if (newInventoryItems.length > 0) {
        await storage.addManyFarmInventoryItems(newInventoryItems);
        for (const [charId, count] of characterCatchCounts.entries()) {
          if (count > 0) {
            await storage.incrementTotalCatch(charId, count);
          }
        }
      }
      
      // If storage became full during this operation, stop fishing.
      if (currentStorageUsed + newInventoryItems.length >= totalStorageSlots) {
        await storage.stopAllFishing(userId);
      }

      res.json({ newCatches: newCatchesForResponse });
    } catch (error) {
      console.error('Error processing catches:', error);
      res.status(500).json({ message: "Failed to process catches." });
    }
  });

  // Get level stats
  app.get("/api/farm/level-stats", async (req, res) => {
    try {
      const levelStats = await storage.getLevelStats();
      res.json(levelStats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching level stats", error: (error as Error).message });
    }
  });

  // Get farm inventory
  app.get("/api/farm/inventory/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const inventory = await storage.getFarmInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error("Detailed error fetching inventory:", error);
      res.status(500).json({ message: "Error fetching inventory", error: (error as Error).message });
    }
  });

  // Manage farm inventory (lock, sell, dispose)
  app.post("/api/farm/inventory/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { action, inventoryId, quantity = 1 } = req.body;

      if (!action || !inventoryId) {
        return res.status(400).json({ message: "Missing action or inventoryId" });
      }

      const itemToUpdate = await storage.getFarmInventoryItem(inventoryId);
      if (!itemToUpdate || itemToUpdate.userId !== userId) {
        return res.status(404).json({ message: "Item not found or you do not own this item." });
      }

      const itemInfo = FARM_ITEMS.find(i => i.id === itemToUpdate.itemId);
      if (!itemInfo) {
        return res.status(404).json({ message: "Item metadata not found." });
      }

      switch (action) {
        case 'toggle-lock': {
          const updated = await storage.updateFarmInventoryItem(inventoryId, { 
            locked: !itemToUpdate.locked 
          });
          return res.json(updated);
        }

        case 'dispose': {
          if (itemInfo.rarity !== 'trash') {
            return res.status(400).json({ message: "Only trash items can be disposed." });
          }
          if (itemToUpdate.locked) {
            return res.status(400).json({ message: "Cannot dispose of a locked item." });
          }
          
          await storage.deleteFarmInventoryItem(inventoryId);
          return res.json({ message: "Item disposed", deleted: true, inventoryId });
        }

        case 'sell': {
          if (itemInfo.rarity === 'trash') {
            return res.status(400).json({ message: "Trash items cannot be sold." });
          }
          if (itemToUpdate.locked) {
            return res.status(400).json({ message: "Cannot sell a locked item." });
          }

          const sellValue = itemInfo.tokenValue;
          
          const wallet = await storage.getWallet(userId);
          if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
          }
          
          const currentMoby = parseFloat(wallet.mobyTokens);
          const newMoby = (currentMoby + sellValue).toFixed(4);
          await storage.updateWallet(wallet.userId, { mobyTokens: newMoby });

          await storage.deleteFarmInventoryItem(inventoryId);
          
          return res.json({ 
            message: "Item sold", 
            deleted: true,
            inventoryId,
            soldValue: sellValue,
            newBalance: wallet.mobyTokens + sellValue 
          });
        }

        default:
          return res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      console.error("Error managing inventory:", error);
      res.status(500).json({ message: "Error managing inventory", error: (error as Error).message });
    }
  });

  // Game routes
  app.post("/api/games/play", async (req, res) => {
    console.log("GAMES PLAY BODY:", req.body);
    try {
      const { userId, gameType, betAmount, gameData } = req.body;
      console.log("PARSED PARAMS:", { userId, gameType, betAmount, hasGameData: !!gameData });
      
      if (!userId || !gameType) {
        console.log("VALIDATION FAILED:", { userId, gameType });
        return res.status(400).json({ message: "Missing or invalid parameters" });
      }

      // Fetch wallet
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(400).json({ message: "Wallet not found" });
      }
      const balance = parseFloat(wallet.coins);

      // Handle different game types
      switch (gameType) {
        case "slots": {
          if (!betAmount || betAmount <= 0) {
            return res.status(400).json({ message: "Invalid bet amount" });
          }
      if (balance < betAmount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Slot logic: 3 reels, 3 symbols
      const symbols = ["anchor", "crown", "gem"];
      const symbolMultipliers = {
        anchor: { 2: 1.5, 3: 2.5 },
        crown:  { 2: 2.0, 3: 3.5 },
        gem:    { 2: 3.0, 3: 6.0 },
      };
      const reels = [
        symbols[Math.floor(Math.random() * 3)],
        symbols[Math.floor(Math.random() * 3)],
        symbols[Math.floor(Math.random() * 3)],
      ];
      const firstSymbol = reels[0];
      const matches = reels.filter(s => s === firstSymbol).length;
      let payout = 0;
      let multiplier = 0;
      if (matches >= 2) {
            multiplier = (symbolMultipliers as any)[firstSymbol]?.[matches] || 0;
        payout = betAmount * multiplier;
      }

      // Update wallet
      const newBalance = balance - betAmount + payout;
      await storage.updateWallet(userId, { coins: newBalance.toFixed(2) });

      if (payout === 0 && betAmount > 0) {
        const jackpotContribution = betAmount / 5000;
        await storage.addToJackpot(jackpotContribution);
      }

      // Respond
          return res.json({
        result: { reels, matches },
        gameResult: {
          payout,
          isWin: payout > 0,
          newBalance: newBalance.toFixed(2),
        }
      });
        }

        case "hilo": {
          console.log("HILO GAME DATA:", { gameData, betAmount, isFirstRound: gameData?.isFirstRound });
          
          if (!gameData) {
            return res.status(400).json({ message: "Missing game data" });
          }

          const { currentCard, guess, streak, isFirstRound } = gameData;
          
          // Handle first round bet
          if (isFirstRound) {
            if (!betAmount || betAmount <= 0) {
              return res.status(400).json({ message: "Invalid bet amount" });
            }
            if (balance < betAmount) {
              return res.status(400).json({ message: "Insufficient funds" });
            }
            
            // Deduct bet amount on first round
            const newBalance = balance - betAmount;
            await storage.updateWallet(userId, { coins: newBalance.toFixed(2) });
            
            // Add to jackpot
            const jackpotContribution = betAmount / 5000;
            await storage.addToJackpot(jackpotContribution);
          }

          // Generate next card (1-13, where 1=Ace, 11=Jack, 12=Queen, 13=King)
          const nextCard = Math.floor(Math.random() * 13) + 1;
          
          // Determine if guess is correct
          let isWin = false;
          if (guess === "higher" && nextCard > currentCard) {
            isWin = true;
          } else if (guess === "lower" && nextCard < currentCard) {
            isWin = true;
          }

          // Calculate payout if win
          let payout = 0;
          let finalBalance = balance;
          
          if (isWin) {
            const multiplier = 1 + (streak * 0.5); // 1x base + 0.5x per streak
            payout = betAmount * multiplier;
            
            // Get current wallet balance (after bet was deducted)
            const currentWallet = await storage.getWallet(userId);
            if (currentWallet) {
              const currentBalance = parseFloat(currentWallet.coins);
              finalBalance = currentBalance + payout;
              await storage.updateWallet(userId, { coins: finalBalance.toFixed(2) });
            }
          } else {
            // If not first round and lost, no additional wallet update needed
            // If first round and lost, bet was already deducted above
            const currentWallet = await storage.getWallet(userId);
            if (currentWallet) {
              finalBalance = parseFloat(currentWallet.coins);
            }
          }

          console.log("HILO RESULT:", { isWin, payout, finalBalance });

          return res.json({
            result: { 
              currentCard: nextCard, 
              nextCard: null, 
              guess 
            },
            gameResult: {
              payout,
              isWin,
              newBalance: finalBalance.toFixed(2),
              mobyReward: "0.0000"
            }
          });
        }

        case "crash": {
          if (!betAmount || betAmount <= 0) {
            return res.status(400).json({ message: "Invalid bet amount" });
          }
          if (balance < betAmount) {
            return res.status(400).json({ message: "Insufficient funds" });
          }

          const { cashOut } = gameData || {};
          
          // If this is a cash-out request (player successfully cashed out)
          if (cashOut && cashOut > 0) {
            // Calculate payout based on cash-out multiplier
            const payout = betAmount * cashOut;
            
            // Add winnings to wallet (bet was already deducted when game started)
            const newBalance = balance + payout;
            await storage.updateWallet(userId, { coins: newBalance.toFixed(2) });

            return res.json({
              result: { cashOut },
              gameResult: {
                payout,
                isWin: true,
                newBalance: newBalance.toFixed(2),
                mobyReward: "0.0000"
              }
            });
          }
          
          // If this is a crash (game crashed before player cashed out)
          // Generate crash point
          const crashPoint = generateCrashPoint("server-seed", gameData?.clientSeed || "default", gameData?.nonce || Date.now());
          
          // Update wallet (deduct bet)
          const newBalance = balance - betAmount;
          await storage.updateWallet(userId, { coins: newBalance.toFixed(2) });

          // Add to jackpot
          const jackpotContribution = betAmount / 5000;
          await storage.addToJackpot(jackpotContribution);

          return res.json({
            result: { crashPoint },
            gameResult: {
              payout: 0,
              isWin: false,
              newBalance: newBalance.toFixed(2),
              mobyReward: "0.0000"
            }
          });
        }

        case "dice": {
          if (!betAmount || betAmount <= 0) {
            return res.status(400).json({ message: "Invalid bet amount" });
          }
          if (balance < betAmount) {
            return res.status(400).json({ message: "Insufficient funds" });
          }

          const { target } = gameData || {};
          if (!target || target < 1 || target > 100) {
            return res.status(400).json({ message: "Invalid target" });
          }

          // Generate roll
          const roll = generateProvablyFairNumber("server-seed", gameData?.clientSeed || "default", gameData?.nonce || Date.now(), 1, 100);
          
          // Determine win
          const isWin = roll >= target;
          const multiplier = isWin ? (99 / (100 - target)) : 0;
          const payout = isWin ? betAmount * multiplier : 0;

          // Update wallet
          const newBalance = balance - betAmount + payout;
          await storage.updateWallet(userId, { coins: newBalance.toFixed(2) });

          if (payout === 0) {
            const jackpotContribution = betAmount / 5000;
            await storage.addToJackpot(jackpotContribution);
          }

          return res.json({
            result: { roll },
            gameResult: {
              payout,
              isWin,
              newBalance: newBalance.toFixed(2),
              mobyReward: "0.0000"
            }
          });
        }

        case "mines": {
          if (!gameData) {
            return res.status(400).json({ message: "Missing game data" });
          }

          const { selectedCell, revealedCells, mineCount, gridSize, isFirstRound } = gameData;
          
          // Handle first round bet
          if (isFirstRound) {
            if (!betAmount || betAmount <= 0) {
              return res.status(400).json({ message: "Invalid bet amount" });
            }
            if (balance < betAmount) {
              return res.status(400).json({ message: "Insufficient funds" });
            }
            
            // Deduct bet amount on first round
            const newBalance = balance - betAmount;
            await storage.updateWallet(userId, { coins: newBalance.toFixed(2) });
            
            // Add to jackpot
            const jackpotContribution = betAmount / 5000;
            await storage.addToJackpot(jackpotContribution);
          }

          // Generate mine positions (simplified - in real implementation would use provably fair)
          const totalCells = gridSize * gridSize;
          const minePositions = [];
          while (minePositions.length < mineCount) {
            const pos = Math.floor(Math.random() * totalCells);
            if (!minePositions.includes(pos)) {
              minePositions.push(pos);
            }
          }

          // Check if selected cell is a mine
          const isMine = minePositions.includes(selectedCell);
          const newRevealedCells = [...revealedCells, selectedCell];

          let payout = 0;
          let multiplier = 1;
          
          if (!isMine) {
            // Calculate multiplier based on revealed cells and mine count
            const safeCells = totalCells - mineCount;
            const revealedSafeCells = newRevealedCells.filter(cell => !minePositions.includes(cell)).length;
            multiplier = (safeCells / (safeCells - revealedSafeCells + 1));
          }

          return res.json({
            result: { 
              isMine, 
              revealedCells: newRevealedCells 
            },
            gameResult: {
              payout,
              isWin: !isMine,
              multiplier: multiplier.toFixed(2),
              newBalance: wallet.coins,
              mobyReward: "0.0000"
            }
          });
        }

        case "plinko": {
          if (!betAmount || betAmount <= 0) {
            return res.status(400).json({ message: "Invalid bet amount" });
          }
          if (balance < betAmount) {
            return res.status(400).json({ message: "Insufficient funds" });
          }

          const { rows } = gameData || {};
          const multipliers = [1000, 130, 26, 9, 4, 2, 1.5, 1, 0.5, 1, 1.5, 2, 4, 9, 26, 130, 1000];
          
          // Generate ball path and final position
          const finalPosition = Math.floor(Math.random() * multipliers.length);
          const multiplier = multipliers[finalPosition];
          const payout = betAmount * multiplier;

          // Update wallet
          const newBalance = balance - betAmount + payout;
          await storage.updateWallet(userId, { coins: newBalance.toFixed(2) });

          if (payout === 0) {
            const jackpotContribution = betAmount / 5000;
            await storage.addToJackpot(jackpotContribution);
          }

          return res.json({
            result: { multiplier },
            gameResult: {
              payout,
              isWin: payout > 0,
              newBalance: newBalance.toFixed(2),
              mobyReward: "0.0000"
            }
          });
        }

        case "roulette": {
          if (!betAmount || betAmount <= 0) {
            return res.status(400).json({ message: "Invalid bet amount" });
          }
          if (balance < betAmount) {
            return res.status(400).json({ message: "Insufficient funds" });
          }

          const { betType } = gameData || {};
          if (!betType) {
            return res.status(400).json({ message: "Missing bet type" });
          }

          // Generate winning number
          const winningNumber = Math.floor(Math.random() * 37); // 0-36
          
          // Calculate payout based on bet type
          let payout = 0;
          let isWin = false;
          
          switch (betType) {
            case "red":
              isWin = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
              payout = isWin ? betAmount * 2 : 0;
              break;
            case "black":
              isWin = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35].includes(winningNumber);
              payout = isWin ? betAmount * 2 : 0;
              break;
            case "even":
              isWin = winningNumber !== 0 && winningNumber % 2 === 0;
              payout = isWin ? betAmount * 2 : 0;
              break;
            case "odd":
              isWin = winningNumber !== 0 && winningNumber % 2 === 1;
              payout = isWin ? betAmount * 2 : 0;
              break;
            default:
              return res.status(400).json({ message: "Invalid bet type" });
          }

          // Update wallet
          const newBalance = balance - betAmount + payout;
          await storage.updateWallet(userId, { coins: newBalance.toFixed(2) });

          if (payout === 0) {
            const jackpotContribution = betAmount / 5000;
            await storage.addToJackpot(jackpotContribution);
          }

          return res.json({
            result: { winningNumber },
            gameResult: {
              payout,
              isWin,
              newBalance: newBalance.toFixed(2),
              mobyReward: "0.0000"
            }
          });
        }

        default:
          return res.status(400).json({ message: "Unsupported game type" });
      }
    } catch (err) {
      console.error("GAME ERROR", err);
      res.status(500).json({ message: "Server error" });
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

  // Create demo01 account route
  app.post("/api/create-demo01", async (req, res) => {
    try {
      // Check if demo01 user already exists
      let demoUser = await storage.getUserByUsername("demo01");
      
      if (demoUser) {
        // Update existing user's wallet to 100,000 coins
        await storage.updateWallet(demoUser.id, { coins: "100000.00" });
        res.json({ 
          message: "Demo01 account updated successfully",
          username: "demo01",
          password: "demo123",
          coins: "100000.00"
        });
      } else {
        // Create new demo01 user
        const hashedPassword = await hashPassword("demo123");
        const newUser = await storage.createUser({
          username: "demo01",
          email: "demo01@example.com",
          password: hashedPassword,
        });
        
        // Create wallet with 100,000 coins
        await storage.createWallet({
          userId: newUser.id,
          coins: "100000.00",
        });
        
        res.json({ 
          message: "Demo01 account created successfully",
          username: "demo01",
          password: "demo123",
          coins: "100000.00"
        });
      }
    } catch (error) {
      console.error("Error creating demo01 account:", error);
      res.status(500).json({ message: "Error creating demo01 account" });
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
