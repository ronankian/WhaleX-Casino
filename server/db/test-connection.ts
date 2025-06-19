import { connectToDatabase, closeDatabaseConnection } from './config.js';

async function testConnection() {
    try {
        const db = await connectToDatabase();
        console.log('✅ Successfully connected to MongoDB!');
        
        // Test if we can perform operations
        const collections = await db.listCollections().toArray();
        console.log('\nAvailable collections:');
        collections.forEach((collection: any) => {
            console.log(`- ${collection.name}`);
        });

        // Close the connection
        await closeDatabaseConnection();
        console.log('\nConnection closed successfully');
    } catch (error: any) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testConnection(); 