-- Add farm_inventory table
CREATE TABLE IF NOT EXISTS farm_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    locked BOOLEAN NOT NULL DEFAULT false,
    caught_at TIMESTAMP NOT NULL DEFAULT NOW()
); 