import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import { hashPassword } from "../utils.js";
import { db } from "./index";
import { farmCharacters, farmInventory, users, wallets } from "../../shared/schema";
import { FARM_ITEMS } from "../farm-items.js";

/**
 * Creates a demo01 user account with pre-populated data for demonstration purposes.
 * This includes a user, wallet with 100,000 coins, and starts fresh at reef tycoon.
 */
export async function createDemo01Account() {
  console.log("Checking for existing demo01 user...");
  let demoUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, "demo01"),
  });

  if (demoUser) {
    console.log("Demo01 user already exists. Resetting data...");
    // Clear existing farm data for the demo user to ensure a clean slate
    await db.delete(farmInventory).where(eq(farmInventory.userId, demoUser.id));
    await db.delete(farmCharacters).where(eq(farmCharacters.userId, demoUser.id));
  } else {
    console.log("Creating new demo01 user...");
    const hashedPassword = await hashPassword("demo123");
    const demoUsers = await db
      .insert(users)
      .values({
        username: "demo01",
        email: "demo01@example.com",
        password: hashedPassword,
      })
      .returning();
    demoUser = demoUsers[0];

    if (!demoUser) {
      throw new Error("Failed to create demo01 user.");
    }
  }

  // Create or update wallet for the demo user with 100,000 coins
  const existingWallet = await db.query.wallets.findFirst({
    where: (wallets, { eq }) => eq(wallets.userId, demoUser.id),
  });

  if (existingWallet) {
    await db.update(wallets)
      .set({ coins: "100000.00" })
      .where(eq(wallets.userId, demoUser.id));
  } else {
    await db.insert(wallets).values({ 
      userId: demoUser.id,
      coins: "100000.00" // Starting with 100,000 coins
    });
  }

  console.log("✅ Demo01 account setup complete!");
  console.log("   - Username: demo01");
  console.log("   - Password: demo123");
  console.log("   - Starting Coins: 100,000.00");
  console.log("   - Farm Characters: 0 (fresh start)");
  console.log("   - Storage: 0 (fresh start)");
  console.log("   - Ready for Reef Tycoon!");
}

createDemo01Account().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
}); 