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
    try {
      const { gameType, betAmount, gameData, userId } = gamePlaySchema.parse(req.body);

      console.log('--- SLOTS GAME DEBUG ---');
      console.log('userId:', userId);
      console.log('betAmount:', betAmount);
      const wallet = await storage.getWallet(userId);
      console.log('wallet:', wallet);
      if (!wallet || parseFloat(wallet.coins) < betAmount) {
        console.log('WALLET CHECK FAILED:', !wallet ? 'No wallet found' : `Balance: ${wallet.coins}, Bet: ${betAmount}`);
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
          const symbols = ['fish', 'anchor', 'ship', 'crown', 'gem'];
          const symbolMultipliers = {
            fish:   { 3: 0.75, 4: 1.5, 5: 2.5 },
            anchor: { 3: 1.0, 4: 2.0, 5: 3.5 },
            ship:   { 3: 1.5, 4: 3.0, 5: 6.0 },
            crown:  { 3: 2.5, 4: 5.0, 5: 12.5 },
            gem:    { 3: 4.0, 4: 7.5, 5: 25.0 },
          };
          const reels = Array(5).fill(0).map((_, i) => 
            symbols[generateProvablyFairNumber(serverSeed, clientSeed, nonce + i, 0, symbols.length - 1)]
          );
          // Check for matching symbols (all must match the first symbol)
          const firstSymbol = reels[0];
          const matches = reels.filter(symbol => symbol === firstSymbol).length;
          let payout = 0;
          let multiplier = 0;
          if (matches >= 3) {
            const m = symbolMultipliers[firstSymbol][matches] || 0;
            payout = betAmount * m;
            multiplier = m;
          }
          result = { reels, matches };
          gameResult = {
            gameType,
            betAmount: betAmount.toString(),
            payout: payout.toFixed(2),
            isWin: matches >= 3,
            multiplier: multiplier.toFixed(2),
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
          const multipliersArr = [1000, 130, 26, 9, 4, 2, 1.5, 1, 0.5, 1, 1.5, 2, 4, 9, 26, 130, 1000];
          const plinkoMultiplier = multipliersArr[Math.max(0, Math.min(finalPosition, multipliersArr.length - 1))];
          result = { ballPath, finalPosition, multiplier: plinkoMultiplier };
          gameResult = {
            gameType,
            betAmount: betAmount.toString(),
            payout: (plinkoMultiplier >= 1 ? betAmount * plinkoMultiplier : 0).toFixed(2),
            isWin: plinkoMultiplier >= 1,
            multiplier: plinkoMultiplier.toFixed(2),
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
