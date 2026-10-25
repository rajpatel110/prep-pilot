import "server-only";
import mongoose, {
  Schema,
  type Connection,
  type Model,
  type InferSchemaType,
} from "mongoose";
import type { MongoClient } from "mongodb";

const options = {
  timestamps: true,
  strict: "throw" as const,
  autoIndex: false,
  autoCreate: false,
  versionKey: false as const,
};
const claimSchema = new Schema(
  {
    tokenDigest: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
    userId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    claimedAt: { type: Date, default: null },
    purgeAt: { type: Date, required: true },
    schemaVersion: { type: Number, enum: [1], required: true },
  },
  { ...options, collection: "verificationClaims" },
);
const deliverySchema = new Schema(
  {
    operationKey: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
    userId: { type: String, required: true },
    type: { type: String, enum: ["verification", "reset"], required: true },
    state: {
      type: String,
      enum: ["pending", "accepted", "failed", "skipped_test"],
      required: true,
    },
    providerId: { type: String, maxlength: 200 },
    errorCode: { type: String, maxlength: 100 },
    attempts: {
      type: Number,
      min: 0,
      validate: Number.isInteger,
      required: true,
    },
    purgeAt: { type: Date, required: true },
    requestId: { type: String, required: true },
    schemaVersion: { type: Number, enum: [1], required: true },
  },
  { ...options, collection: "emailDeliveries" },
);
const connections = new WeakMap<MongoClient, Map<string, Connection>>();
export function emailModels(client: MongoClient, database: string) {
  let databases = connections.get(client);
  if (!databases) {
    databases = new Map();
    connections.set(client, databases);
  }
  let connection = databases.get(database);
  if (!connection) {
    connection = mongoose
      .createConnection()
      .setClient(client)
      .useDb(database, { useCache: true });
    databases.set(database, connection);
  }
  return {
    claims: (connection.models.VerificationClaim ??
      connection.model("VerificationClaim", claimSchema)) as Model<
      InferSchemaType<typeof claimSchema>
    >,
    deliveries: (connection.models.EmailDelivery ??
      connection.model("EmailDelivery", deliverySchema)) as Model<
      InferSchemaType<typeof deliverySchema>
    >,
  };
}
