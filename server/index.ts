import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./storage.js";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { Api, IRequest, IResponse, Method } from "./utils";
import { FARM_ITEMS } from "./farm-items";

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

class FarmCharactersHandler implements IHandler {
  canHandle(request: IRequest): boolean {
    return this.method === Method.GET && this.path.startsWith("/api/farm/characters");
  }

  async handle(request: IRequest): Promise<IResponse> {
    const userId = parseInt(this.path.split("/")[4], 10);
    if (isNaN(userId)) {
      return Api.badRequest("Invalid user ID");
    }
    const characters = await storage.getFarmCharacters(userId);
    return Api.ok(characters);
  }
}

class FarmInventoryHandler implements IHandler {
  get method() { return Method.POST; }

  canHandle(request: IRequest): boolean {
    return request.path.startsWith("/api/farm/inventory");
  }

  async handle(request: IRequest): Promise<IResponse> {
    const userId = request.user?.id;
    if (!userId) {
      return Api.unauthorized();
    }

    if (request.method === Method.GET) {
      const inventory = await storage.getFarmInventory(userId);
      return Api.ok(inventory);
    }

    const { action, inventoryId, quantity } = request.body;

    if (!action || !inventoryId) {
      return Api.badRequest("Missing action or inventoryId");
    }

    const itemToUpdate = await storage.getFarmInventoryItem(inventoryId);

    if (!itemToUpdate || itemToUpdate.userId !== userId) {
      return Api.notFound("Item not found or you do not own this item.");
    }

    const itemInfo = FARM_ITEMS.find(i => i.id === itemToUpdate.itemId);
    if (!itemInfo) {
      return Api.notFound("Item metadata not found.");
    }


    switch (action) {
      case 'toggle-lock': {
        const updated = await storage.updateFarmInventoryItem(inventoryId, { locked: !itemToUpdate.locked });
        return Api.ok(updated);
      }

      case 'dispose': {
        if (itemInfo.rarity !== 'trash') {
          return Api.badRequest("Only trash items can be disposed.");
        }
        if (itemToUpdate.locked) {
          return Api.badRequest("Cannot dispose of a locked item.");
        }
        
        const qtyToDispose = quantity || 1;
        if(itemToUpdate.quantity > qtyToDispose) {
          const updated = await storage.updateFarmInventoryItem(inventoryId, { quantity: itemToUpdate.quantity - qtyToDispose });
          return Api.ok(updated);
        } else {
          await storage.deleteFarmInventoryItem(inventoryId);
          return Api.ok({ message: "Item disposed" });
        }
      }

      case 'sell': {
        if (itemInfo.rarity === 'trash') {
          return Api.badRequest("Trash items cannot be sold.");
        }
        if (itemToUpdate.locked) {
          return Api.badRequest("Cannot sell a locked item.");
        }

        const qtyToSell = quantity || 1;
        if (itemToUpdate.quantity < qtyToSell) {
          return Api.badRequest("Not enough items to sell.");
        }

        const sellValue = itemInfo.tokenValue * qtyToSell;
        
        const wallet = await storage.getWallet(userId);
        if(!wallet) {
          return Api.notFound("Wallet not found");
        }
        // Ensure mobyTokens is treated as a number for addition
        const currentMoby = parseFloat(wallet.mobyTokens);
        const newMoby = (currentMoby + sellValue).toFixed(4);
        await storage.updateWallet(wallet.userId, { mobyTokens: newMoby });

        if(itemToUpdate.quantity > qtyToSell) {
          const updated = await storage.updateFarmInventoryItem(inventoryId, { quantity: itemToUpdate.quantity - qtyToSell });
          return Api.ok(updated);
        } else {
          await storage.deleteFarmInventoryItem(inventoryId);
          return Api.ok({ message: "Item sold" });
        }
      }

      default:
        return Api.badRequest("Invalid action");
    }
  }
}

const handlers: IHandler[] = [
  new FarmCharactersHandler(),
  new FarmInventoryHandler(),
];

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
