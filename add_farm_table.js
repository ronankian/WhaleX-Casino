import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'whale_casino',
  user: 'postgres',
  password: 'postgres'
});

async function addFarmInventoryTable() {
  try {
    const client = await pool.connect();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS farm_inventory (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        item_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        locked BOOLEAN NOT NULL DEFAULT false,
        caught_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    
    await client.query(createTableQuery);
    console.log('✅ farm_inventory table created successfully!');
    
    client.release();
  } catch (error) {
    console.error('❌ Error creating farm_inventory table:', error);
  } finally {
    await pool.end();
  }
}

addFarmInventoryTable(); 