import { MongoClient, Db } from 'mongodb';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

export async function connectMongoDB(): Promise<Db> {
  if (mongoDb) {
    return mongoDb;
  }

  const mongoUrl = process.env.MONGODB_URL || 'mongodb://sweatbot:secure_password@localhost:8002/';
  const dbName = process.env.MONGODB_DATABASE || 'sweatbot_conversations';

  try {
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);

    console.log(`✅ MongoDB connected successfully: ${dbName}`);
    return mongoDb;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export function getMongoDb(): Db {
  if (!mongoDb) {
    throw new Error('MongoDB not initialized. Call connectMongoDB() first');
  }
  return mongoDb;
}

export async function disconnectMongoDB(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDb = null;
    console.log('✅ MongoDB disconnected');
  }
}
