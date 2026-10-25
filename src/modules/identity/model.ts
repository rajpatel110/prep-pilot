import "server-only";
import {
  Schema,
  type InferSchemaType,
  type Model,
  type Connection,
} from "mongoose";
import { preferencesSchema } from "./preferences-schema";

const profileSchema = new Schema(
  {
    userId: { type: String, required: true, immutable: true },
    role: {
      type: String,
      enum: ["student", "admin", "owner"],
      default: "student",
      required: true,
    },
    lifecycle: {
      type: String,
      enum: ["active", "deleting"],
      default: "active",
      required: true,
    },
    preferences: {
      type: Schema.Types.Mixed,
      default: null,
      validate: {
        validator: (value: unknown) =>
          value === null || preferencesSchema.safeParse(value).success,
        message: "Invalid preparation preferences.",
      },
    },
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

export function profileModel(connection: Connection) {
  return (connection.models.Profile ??
    connection.model("Profile", profileSchema)) as Model<
    InferSchemaType<typeof profileSchema>
  >;
}
