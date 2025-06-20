import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { hashPassword } from "../utils";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // Delete all existing data
  await db.delete(schema.users);

  const hashedPassword = await hashPassword("admin1234");

  await db.insert(schema.users).values({
    username: "admin",
    email: "admin@whalex.com",
    password: hashedPassword,
    role: "admin",
    isActive: true,
    level: 99
  });

  console.log("Database seeded successfully!");
}

main().catch((err) => {
  console.error("Error seeding database:", err);
        process.exit(1);
});