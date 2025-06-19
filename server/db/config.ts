import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<db_username>:<db_password>@cluster0.6vhpei8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.DB_NAME || 'whalex_casino';

// MongoDB Client
const client = new MongoClient(MONGODB_URI);

// Database connection
export async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        return client.db(DB_NAME);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// Export collections
export const getCollections = (db: any) => ({
    users: db.collection('users'),
    wallets: db.collection('wallets'),
    gameHistory: db.collection('gameHistory'),
    transactions: db.collection('transactions'),
    gameSessions: db.collection('gameSessions')
});

// Close database connection
export async function closeDatabaseConnection() {
    await client.close();
    console.log('Database connection closed');
}

// Export the client for use in other parts of the application
export { client }; 