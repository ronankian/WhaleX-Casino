import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import { hashPassword } from "../utils";

async function createDemoAccount() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log("Creating demo account...");

  try {
    // Check if demo user already exists
    const existingDemo = await db.select().from(schema.users).where(eq(schema.users.username, "demo"));
    
    if (existingDemo.length === 0) {
      console.log("Creating demo user...");
      const hashedPassword = await hashPassword("demo123");

      const demoUser = await db.insert(schema.users).values({
        username: "demo",
        email: "demo@whalex.com",
        password: hashedPassword,
        role: "player",
        isActive: true,
        level: 1
      }).returning();

      if (demoUser.length > 0) {
        console.log("Creating demo wallet with 999,999 WhaleX coins and $MOBY tokens...");
        await db.insert(schema.wallets).values({
          userId: demoUser[0].id,
          coins: "999999.00", // 999,999 WhaleX coins
          mobyTokens: "999999.0000", // 999,999 $MOBY tokens
          mobyCoins: "999999.00" // 999,999 $MOBY coins
        });
        console.log("✅ Demo account created successfully!");
        console.log("📧 Username: demo");
        console.log("🔑 Password: demo123");
        console.log("💰 WhaleX Coins: 999,999");
        console.log("🪙 $MOBY Tokens: 999,999");
      }
    } else {
      console.log("Demo user already exists, updating wallet...");
      const demoUser = existingDemo[0];
      
      // Update existing demo wallet with max coins
      await db.update(schema.wallets)
        .set({
          coins: "999999.00",
          mobyTokens: "999999.0000", 
          mobyCoins: "999999.00"
        })
        .where(eq(schema.wallets.userId, demoUser.id));
      
      console.log("✅ Demo wallet updated with 999,999 coins and tokens!");
      console.log("📧 Username: demo");
      console.log("🔑 Password: demo123");
      console.log("💰 WhaleX Coins: 999,999");
      console.log("🪙 $MOBY Tokens: 999,999");
    }

  } catch (error) {
    console.error("❌ Error creating demo account:", error);
    throw error;
  }
}

createDemoAccount().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
}); 