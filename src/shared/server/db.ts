import "server-only";
import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { serverConfig } from "./config";

const cache = globalThis as typeof globalThis & {
  prepAuthClient?: Promise<MongoClient>;
  prepDomainConnection?: Promise<mongoose.Connection>;
};

export async function getAuthClient() {
  if (!serverConfig.AUTH_ENABLED) throw new Error("Authentication unavailable");
  cache.prepAuthClient ??= new MongoClient(serverConfig.MONGODB_URI!, {
    maxPoolSize: 5,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  })
    .connect()
    .catch((error) => {
      delete cache.prepAuthClient;
      throw error;
    });
  return cache.prepAuthClient;
}

export async function getDomainConnection() {
  if (!serverConfig.AUTH_ENABLED) throw new Error("Authentication unavailable");
  cache.prepDomainConnection ??= mongoose
    .createConnection(serverConfig.MONGODB_URI!, {
      dbName: serverConfig.MONGODB_DB_NAME!,
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      autoIndex: false,
    })
    .asPromise()
    .catch((error) => {
      delete cache.prepDomainConnection;
      throw error;
    });
  return cache.prepDomainConnection;
}
