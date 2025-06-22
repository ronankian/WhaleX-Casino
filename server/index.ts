import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./storage.js";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Farm Game Data Constants
const HIRE_COSTS = [1000, 5000, 20000, 50000];
const LEVEL_STATS = [
  { level: 1, fishPerMin: 1, bonusChance: 2.0 },
  { level: 2, fishPerMin: 1, bonusChance: 4.0 },
  { level: 3, fishPerMin: 1, bonusChance: 6.0 },
  { level: 4, fishPerMin: 1, bonusChance: 8.0 },
  { level: 5, fishPerMin: 2, bonusChance: 10.0 },
  { level: 6, fishPerMin: 2, bonusChance: 11.5 },
  { level: 7, fishPerMin: 2, bonusChance: 13.0 },
  { level: 8, fishPerMin: 2, bonusChance: 14.5 },
  { level: 9, fishPerMin: 2, bonusChance: 16.0 },
  { level: 10, fishPerMin: 3, bonusChance: 17.5 },
  { level: 11, fishPerMin: 3, bonusChance: 19.0 },
  { level: 12, fishPerMin: 3, bonusChance: 20.5 },
  { level: 13, fishPerMin: 3, bonusChance: 22.0 },
  { level: 14, fishPerMin: 3, bonusChance: 23.5 },
  { level: 15, fishPerMin: 4, bonusChance: 25.0 },
  { level: 16, fishPerMin: 4, bonusChance: 26.0 },
  { level: 17, fishPerMin: 4, bonusChance: 27.0 },
  { level: 18, fishPerMin: 4, bonusChance: 28.0 },
  { level: 19, fishPerMin: 4, bonusChance: 29.0 },
  { level: 20, fishPerMin: 5, bonusChance: 30.0 },
  { level: 21, fishPerMin: 5, bonusChance: 31.0 },
  { level: 22, fishPerMin: 5, bonusChance: 32.0 },
  { level: 23, fishPerMin: 5, bonusChance: 33.0 },
  { level: 24, fishPerMin: 5, bonusChance: 34.0 },
  { level: 25, fishPerMin: 6, bonusChance: 35.0 },
];
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
const farmActionSchema = z.object({
  userId: z.number(),
  characterType: z.string(),
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Farm Game Routes
  app.get("/api/farm/characters/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // userCharacters are the ones the user has hired, ordered by hiring time (id)
      const hiredCharacters = await storage.getFarmCharacters(userId);
      hiredCharacters.sort((a, b) => a.id - b.id);
      
      const allCharacters = ALL_CHARACTERS.map(staticChar => {
        const dbChar = hiredCharacters.find(db => db.characterType === staticChar.name);
        if (dbChar) {
          return { ...staticChar, hired: true, level: dbChar.level, status: dbChar.status, totalCatch: dbChar.totalCatch };
        }
        return { ...staticChar, hired: false, level: 1, status: 'Idle', totalCatch: 0 };
      });
      
      res.json({ allCharacters, hiredCharacters });
    } catch (error) {
      res.status(500).json({ message: "Error fetching farm characters", error: (error as Error).message });
    }
  });

  app.get("/api/farm/level-stats", (_req, res) => {
    try {
      res.json(LEVEL_STATS);
    } catch (error) {
      res.status(500).json({ message: "Error fetching level stats", error: (error as Error).message });
    }
  });

  app.post("/api/farm/hire", async (req, res) => {
    try {
      const { userId, characterType } = farmActionSchema.parse(req.body);
      const wallet = await storage.getWallet(userId);
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });

      const userCharacters = await storage.getFarmCharacters(userId);
      const numHired = userCharacters.length;
      if (numHired >= HIRE_COSTS.length) return res.status(400).json({ message: "No more characters to hire" });
      
      const hireCost = HIRE_COSTS[numHired];
      const balance = parseFloat(wallet.coins);
      if (balance < hireCost) return res.status(400).json({ message: "Insufficient coins to hire" });

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
      const character = await storage.getFarmCharacter(userId, characterType);
      const wallet = await storage.getWallet(userId);
      if (!character || !wallet) return res.status(404).json({ message: "Character or wallet not found" });
      if (character.level >= 25) return res.status(400).json({ message: "Character is at max level" });

      const levelUpCost = LEVEL_UP_COSTS[character.level - 1];
      const mobyBalance = parseFloat(wallet.mobyTokens);
      if (mobyBalance < levelUpCost) return res.status(400).json({ message: "Insufficient $MOBY to level up" });

      await storage.updateWallet(userId, { mobyTokens: (mobyBalance - levelUpCost).toFixed(4) });
      const updatedCharacter = await storage.updateFarmCharacter(character.id, { level: character.level + 1 });
      
      res.json(updatedCharacter);
    } catch (error) {
      res.status(400).json({ message: "Invalid level-up request", error: (error as Error).message });
    }
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
  });

  // Handle graceful shutdown
   process.on('SIGINT', async () => {
     process.exit(0);
   });
})();
