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
 * Creates a demo user account with pre-populated data for demonstration purposes.
 * This includes a user, wallet, hired characters, and a full inventory of unique items.
 */
export async function createDemoAccount() {
  console.log("Checking for existing demo user...");
  let demoUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, "demo"),
  });

  if (demoUser) {
    console.log("Demo user already exists. Resetting data...");
    // Clear existing farm data for the demo user to ensure a clean slate
    await db.delete(farmInventory).where(eq(farmInventory.userId, demoUser.id));
    await db.delete(farmCharacters).where(eq(farmCharacters.userId, demoUser.id));
  } else {
    console.log("Creating new demo user...");
    const hashedPassword = await hashPassword("demo");
    const demoUsers = await db
      .insert(users)
      .values({
        username: "demo",
        email: "demo@example.com",
        password: hashedPassword,
      })
      .returning();
    demoUser = demoUsers[0];

    if (!demoUser) {
      throw new Error("Failed to create demo user.");
    }

    // Create a wallet for the demo user
    await db.insert(wallets).values({ userId: demoUser.id });
  }

  console.log("Setting up demo user's farm characters...");
  const characterNames = ["Fisherman", "Graverobber", "Steamman", "Woodcutter"];
  const initialCatches = [0, 0, 0, 0]; // Sums to 0
  
  await db
    .insert(farmCharacters)
    .values(
      characterNames.map((name, index) => ({
        userId: demoUser.id,
        characterType: name,
        hired: true,
        level: 10,
        status: "Idle",
        totalCatch: initialCatches[index],
      }))
    )
    .returning();

  console.log("Populating demo user's inventory with unique items...");
  // The total storage capacity for 4 characters at level 10 is 135.
  // We will add 0 items to leave space.
  const totalItemsToInsert = 0;
  const inventoryToInsert = [];
  for (let i = 0; i < totalItemsToInsert; i++) {
    const randomItem = FARM_ITEMS[Math.floor(Math.random() * FARM_ITEMS.length)]; 
    inventoryToInsert.push({
      userId: demoUser.id,
      itemId: randomItem.id,
      // quantity is no longer needed, it defaults to 1 in the schema
    });
  }

  if (inventoryToInsert.length > 0) {
    await db.insert(farmInventory).values(inventoryToInsert);
  }

  console.log("✅ Demo account setup complete!");
  console.log("   - Username: demo");
  console.log("   - Password: demo");
  console.log("   - Storage: 0/135");
  console.log("   - Total Catches: 0");
}

createDemoAccount().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
}); 