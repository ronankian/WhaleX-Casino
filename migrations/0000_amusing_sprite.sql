CREATE TABLE IF NOT EXISTS "deposits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"receipt_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);

CREATE TABLE IF NOT EXISTS "farm_characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"character_type" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"hired" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'Idle' NOT NULL,
	"total_catch" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "farm_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"caught_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "game_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game_id" integer NOT NULL,
	"game_type" text NOT NULL,
	"bet_amount" numeric(10, 2) NOT NULL,
	"payout" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"multiplier" numeric(10, 2),
	"result" text,
	"is_win" boolean DEFAULT false NOT NULL,
	"moby_reward" numeric(10, 4) DEFAULT '0.0000',
	"server_seed" text NOT NULL,
	"client_seed" text NOT NULL,
	"nonce" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "jackpot" (
	"id" serial PRIMARY KEY NOT NULL,
	"total_pool" numeric(12, 4) DEFAULT '0.0000' NOT NULL,
	"last_winner" text,
	"last_won_amount" numeric(12, 4) DEFAULT '0.0000',
	"last_won_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'player' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"join_date" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"coins" numeric(10, 2) DEFAULT '1000.00' NOT NULL,
	"moby_tokens" numeric(10, 4) DEFAULT '0.0000' NOT NULL,
	"moby_coins" numeric(10, 2) DEFAULT '0.00' NOT NULL
);

CREATE TABLE IF NOT EXISTS "withdrawals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);

DO $$ BEGIN
 ALTER TABLE "farm_characters" ADD CONSTRAINT "farm_characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "farm_inventory" ADD CONSTRAINT "farm_inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email"); 