import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import { hashPassword } from "../utils.js";
import { db } from "./index.ts";
import { farmCharacters, farmInventory, users, wallets } from "../../shared/schema.ts";
import { FARM_ITEMS } from "../farm-items.js";

/**
 * Creates a demo user account with pre-populated data for demonstration purposes.
 * This includes a user, wallet, hired characters, and a full inventory.
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
        lastLogin: new Date(),
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
  const initialCatches = [45, 35, 30, 25]; // These must sum to 135
  
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

  console.log("Populating demo user's inventory to be exactly full...");
  // The total storage capacity for 4 characters at level 10 is 135.
  // We will add exactly 135 items to the inventory.
  const totalItemsToInsert = 135;
  const items = [];
  for (let i = 0; i < totalItemsToInsert; i++) {
    // Just add a common item for simplicity.
    const randomItem = FARM_ITEMS[Math.floor(Math.random() * 10)]; 
    items.push({
      userId: demoUser.id,
      itemId: randomItem.id,
      quantity: 1, // Add one item at a time
    });
  }

  // To simulate a more realistic inventory, we will group the items.
  const itemMap = new Map<number, number>();
  for (const item of items) {
    itemMap.set(item.itemId, (itemMap.get(item.itemId) || 0) + 1);
  }

  const inventoryToInsert = Array.from(itemMap.entries()).map(
    ([itemId, quantity]) => ({
      userId: demoUser.id,
      itemId,
      quantity,
    })
  );

  await db.insert(farmInventory).values(inventoryToInsert);

  console.log("✅ Demo account setup complete!");
  console.log("   - Username: demo");
  console.log("   - Password: demo");
  console.log("   - Storage: 135/135");
  console.log("   - Total Catches: 135");
}

createDemoAccount().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
}); 