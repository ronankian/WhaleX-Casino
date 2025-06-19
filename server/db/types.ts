import { ObjectId } from 'mongodb';

export interface User {
    _id?: ObjectId;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Wallet {
    _id?: ObjectId;
    userId: ObjectId;
    balance: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface GameHistory {
    _id?: ObjectId;
    userId: ObjectId;
    gameType: string;
    betAmount: number;
    result: string;
    profitLoss: number;
    gameData: any;
    createdAt: Date;
}

export interface Transaction {
    _id?: ObjectId;
    userId: ObjectId;
    type: 'deposit' | 'withdraw' | 'bet' | 'win';
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: Date;
}

export interface GameSession {
    _id?: ObjectId;
    userId: ObjectId;
    gameType: string;
    sessionData: any;
    status: 'active' | 'completed' | 'cancelled';
    createdAt: Date;
} 