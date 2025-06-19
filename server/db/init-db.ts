import { connectToDatabase, closeDatabaseConnection } from './config.js';
import { Db } from 'mongodb';

async function createCollections(db: Db) {
    try {
        // Users Collection
        await db.createCollection('users');
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        console.log('✅ Users collection created with indexes');

        // Wallets Collection
        await db.createCollection('wallets');
        await db.collection('wallets').createIndex({ userId: 1 }, { unique: true });
        console.log('✅ Wallets collection created with indexes');

        // Game History Collection
        await db.createCollection('gameHistory');
        await db.collection('gameHistory').createIndex({ userId: 1 });
        await db.collection('gameHistory').createIndex({ createdAt: 1 });
        console.log('✅ Game History collection created with indexes');

        // Transactions Collection
        await db.createCollection('transactions');
        await db.collection('transactions').createIndex({ userId: 1 });
        await db.collection('transactions').createIndex({ createdAt: 1 });
        console.log('✅ Transactions collection created with indexes');

        // Game Sessions Collection
        await db.createCollection('gameSessions');
        await db.collection('gameSessions').createIndex({ userId: 1 });
        await db.collection('gameSessions').createIndex({ status: 1 });
        console.log('✅ Game Sessions collection created with indexes');

    } catch (error: any) {
        console.error('Error creating collections:', error.message);
        throw error;
    }
}

async function initializeDatabase() {
    let db;
    try {
        db = await connectToDatabase();
        console.log('Connected to MongoDB');

        // Check if collections already exist
        const collections = await db.listCollections().toArray();
        if (collections.length > 0) {
            console.log('\nExisting collections found:');
            collections.forEach(collection => {
                console.log(`- ${collection.name}`);
            });
            
            const proceed = process.argv.includes('--force');
            if (!proceed) {
                console.log('\n⚠️ Collections already exist. To recreate them, run with --force flag');
                return;
            }
            
            // Drop existing collections if --force flag is used
            for (const collection of collections) {
                await db.dropCollection(collection.name);
                console.log(`Dropped collection: ${collection.name}`);
            }
        }

        // Create collections
        await createCollections(db);
        console.log('\n✅ All collections created successfully!');

    } catch (error: any) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    } finally {
        if (db) {
            await closeDatabaseConnection();
            console.log('\nDatabase connection closed');
        }
    }
}

// Run the initialization
initializeDatabase(); 