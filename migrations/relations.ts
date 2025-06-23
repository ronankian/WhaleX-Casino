import { relations } from "drizzle-orm/relations";
import { users, farmCharacters } from "./schema";

export const farmCharactersRelations = relations(farmCharacters, ({one}) => ({
	user: one(users, {
		fields: [farmCharacters.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	farmCharacters: many(farmCharacters),
}));