import "server-only";
import { Schema, type InferSchemaType, type Model } from "mongoose";
import { getDomainConnection } from "@/shared/server/db";

const profileSchema = new Schema(
  {
    userId: { type: String, required: true, immutable: true },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
      required: true,
    },
    lifecycle: {
      type: String,
      enum: ["active", "deleting"],
      default: "active",
      required: true,
    },
    preferences: { type: Schema.Types.Mixed, default: null },
    timezone: { type: String, default: "Asia/Kolkata" },
    activePlanId: { type: Schema.Types.ObjectId, default: null },
    planVersion: { type: Number, default: 0 },
    stateRevision: { type: Number, default: 0 },
    attemptSequence: { type: Number, default: 0 },
    schemaVersion: { type: Number, default: 1 },
  },
  {
    collection: "profiles",
    timestamps: true,
    strict: "throw",
    autoIndex: false,
  },
);
profileSchema.index(
  { userId: 1 },
  { unique: true, name: "profiles_userId_unique" },
);

export async function profiles() {
  const connection = await getDomainConnection();
  return (connection.models.Profile ??
    connection.model("Profile", profileSchema)) as Model<
    InferSchemaType<typeof profileSchema>
  >;
}

export async function ensureProfile(userId: string) {
  const model = await profiles();
  try {
    return await model
      .findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      )
      .lean();
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      return model.findOne({ userId }).lean();
    throw error;
  }
}
