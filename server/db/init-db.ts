import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import { hashPassword } from "../utils";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // Check if admin user already exists
  const existingAdmin = await db.select().from(schema.users).where(eq(schema.users.username, "admin"));
  
  if (existingAdmin.length === 0) {
    console.log("Creating admin user...");
    const hashedPassword = await hashPassword("admin1234");

    await db.insert(schema.users).values({
      username: "admin",
      email: "admin@whalex.com",
      password: hashedPassword,
      role: "admin",
      isActive: true,
      level: 99
    });
    console.log("Admin user created successfully!");
  } else {
    console.log("Admin user already exists, skipping creation.");
  }

  // Check if jackpot exists, if not create it
  const existingJackpot = await db.select().from(schema.jackpot);
  
  if (existingJackpot.length === 0) {
    console.log("Creating jackpot...");
    await db.insert(schema.jackpot).values({
      totalPool: "0.0000"
    });
    console.log("Jackpot created successfully!");
  } else {
    console.log("Jackpot already exists, skipping creation.");
  }

  console.log("Database seeding completed!");
}

main().catch((err) => {
  console.error("Error seeding database:", err);
        process.exit(1);
});