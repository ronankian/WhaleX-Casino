import "dotenv/config";
import { eq } from "drizzle-orm";
import { hashPassword } from "../utils.js";
import { db } from "./index.ts";
import { users, jackpot } from "../../shared/schema.ts";

async function main() {
  console.log("Seeding database...");

  // Check if admin user already exists
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.username, "admin"),
  });

  if (!existingAdmin) {
    console.log("Creating admin user...");
    const hashedPassword = await hashPassword("admin1234");

    await db.insert(users).values({
      username: "admin",
      email: "admin@whalex.com",
      password: hashedPassword,
      role: "admin",
      isActive: true,
      level: 99,
    });
    console.log("Admin user created successfully!");
  } else {
    console.log("Admin user already exists, skipping creation.");
  }

  // Check if jackpot exists, if not create it
  const existingJackpot = await db.query.jackpot.findFirst();

  if (!existingJackpot) {
    console.log("Creating jackpot...");
    await db.insert(jackpot).values({
      totalPool: "0.0000",
    });
    console.log("Jackpot created successfully!");
  } else {
    console.log("Jackpot already exists, skipping creation.");
  }

  console.log("Database seeding completed!");
}

main()
  .then(() => {
    console.log("Database seeding finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error seeding database:", err);
    process.exit(1);
  });