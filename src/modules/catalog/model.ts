import "server-only";
import {
  Schema,
  type Model,
  type InferSchemaType,
  type Connection,
} from "mongoose";
import { storedContentSchema, catalogStateSchema } from "./schemas";
import { getDomainConnection } from "@/shared/server/db";

const associationSchema = new Schema(
  {
    companyId: { type: String, required: true, enum: ["cognizant", "ltm"] },
    association: {
      type: String,
      required: true,
      enum: ["verified", "student_reported"],
    },
    source: { type: String, required: true, maxlength: 2048 },
    reviewedAt: { type: Date, required: true },
  },
  { _id: false, strict: "throw" },
);

export const contentItemSchema = new Schema(
  {
    slug: { type: String, required: true, maxlength: 120 },
    seedKey: { type: String, maxlength: 120 },
    title: { type: String, required: true, maxlength: 160 },
    subject: { type: String, required: true, enum: ["dsa", "aptitude", "cs"] },
    topic: { type: String, required: true, maxlength: 80 },
    type: { type: String, required: true, enum: ["question", "resource"] },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
    },
    estimatedMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 60,
      validate: Number.isSafeInteger,
    },
    tags: { type: [String], default: [], required: true },
    companies: { type: [associationSchema], default: [], required: true },
    prompt: { type: String, maxlength: 12000 },
    body: { type: String, maxlength: 12000 },
    explanation: { type: String, maxlength: 12000 },
    externalUrl: { type: String, maxlength: 2048 },
    assetIds: {
      type: [Schema.Types.ObjectId],
      default: [],
      required: true,
      validate: (values: unknown[]) =>
        values.length <= 5 &&
        new Set(values.map(String)).size === values.length,
    },
    source: { type: String, required: true, maxlength: 2048 },
    attribution: { type: String, default: "", maxlength: 2000 },
    reviewedAt: { type: Date, default: null },
    status: {
      type: String,
      required: true,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    revision: {
      type: Number,
      required: true,
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
      default: 1,
      validate: Number.isSafeInteger,
    },
    createdBy: { type: String, required: true, immutable: true },
    updatedBy: { type: String, required: true },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    schemaVersion: { type: Number, required: true, enum: [1], default: 1 },
  },
  {
    collection: "contentItems",
    strict: "throw",
    timestamps: true,
    autoIndex: false,
    autoCreate: false,
    versionKey: false,
  },
);

contentItemSchema.pre("validate", function () {
  const object = this.toObject({ versionKey: false });
  const parsed = storedContentSchema.safeParse({
    ...object,
    _id: this._id.toString(),
    assetIds: this.assetIds.map(String),
    createdAt: this.createdAt ?? new Date(),
    updatedAt: this.updatedAt ?? new Date(),
  });
  if (!parsed.success)
    for (const issue of parsed.error.issues)
      this.invalidate(issue.path.join("."), "Invalid catalog field.");
});

export const catalogStateModelSchema = new Schema(
  {
    _id: { type: String, required: true, enum: ["catalog"] },
    revision: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      validate: Number.isSafeInteger,
    },
    commitSerial: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      validate: Number.isSafeInteger,
    },
    schemaVersion: { type: Number, required: true, enum: [1], default: 1 },
  },
  {
    collection: "catalogState",
    strict: "throw",
    timestamps: true,
    autoIndex: false,
    autoCreate: false,
    versionKey: false,
  },
);

catalogStateModelSchema.pre("validate", function () {
  const parsed = catalogStateSchema.safeParse({
    ...this.toObject({ versionKey: false }),
    createdAt: this.createdAt ?? new Date(),
    updatedAt: this.updatedAt ?? new Date(),
  });
  if (!parsed.success)
    for (const issue of parsed.error.issues)
      this.invalidate(issue.path.join("."), "Invalid catalog state.");
});

export function catalogModels(connection: Connection) {
  return {
    content: (connection.models.ContentItem ??
      connection.model("ContentItem", contentItemSchema)) as Model<
      InferSchemaType<typeof contentItemSchema>
    >,
    state: (connection.models.CatalogState ??
      connection.model("CatalogState", catalogStateModelSchema)) as Model<
      InferSchemaType<typeof catalogStateModelSchema>
    >,
  };
}

export async function catalogPersistence() {
  return catalogModels(await getDomainConnection());
}
