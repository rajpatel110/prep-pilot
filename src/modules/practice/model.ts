import "server-only";
import {
  Schema,
  type Connection,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { storedAttempt } from "./schemas";

const snapshotSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 160 },
    subject: { type: String, required: true, enum: ["dsa", "aptitude", "cs"] },
    topic: { type: String, required: true, maxlength: 80 },
    type: { type: String, required: true, enum: ["question"] },
    contentRevision: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
  },
  { _id: false, strict: "throw" },
);
const resultSchema = new Schema(
  {
    revisionId: { type: Schema.Types.ObjectId, required: true },
    dueDate: { type: String, required: true },
    intervalDays: { type: Number, enum: [1, 3, 7], required: true },
    resultingStateRevision: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    attemptDate: { type: String, required: true },
  },
  { _id: false, strict: "throw" },
);
export const attemptSchema = new Schema(
  {
    userId: { type: String, required: true, immutable: true },
    submissionId: { type: String, required: true, immutable: true },
    requestHash: { type: String, required: true, immutable: true },
    contentId: { type: Schema.Types.ObjectId, required: true, immutable: true },
    contentSnapshot: { type: snapshotSchema, required: true, immutable: true },
    subject: {
      type: String,
      required: true,
      enum: ["dsa", "aptitude", "cs"],
      immutable: true,
    },
    topic: { type: String, required: true, maxlength: 80, immutable: true },
    kind: {
      type: String,
      required: true,
      enum: ["practice", "revision"],
      immutable: true,
    },
    outcome: {
      type: String,
      required: true,
      enum: ["independent", "needed_help", "failed"],
      immutable: true,
    },
    perceivedDifficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      immutable: true,
    },
    attemptSequence: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
      immutable: true,
    },
    resultSnapshot: { type: resultSchema, required: true, immutable: true },
    createdAt: { type: Date, required: true, immutable: true },
    updatedAt: { type: Date, required: true, immutable: true },
    schemaVersion: {
      type: Number,
      required: true,
      enum: [1],
      default: 1,
      immutable: true,
    },
  },
  {
    collection: "attempts",
    strict: "throw",
    autoIndex: false,
    autoCreate: false,
    versionKey: false,
  },
);
attemptSchema.pre("validate", function () {
  const plain = this.toObject();
  const parsed = storedAttempt.safeParse({
    ...plain,
    _id: String(this._id),
    contentId: String(this.contentId),
    resultSnapshot: plain.resultSnapshot
      ? {
          ...plain.resultSnapshot,
          revisionId: String(plain.resultSnapshot.revisionId),
        }
      : undefined,
  });
  if (!parsed.success)
    for (const issue of parsed.error.issues)
      this.invalidate(issue.path.join("."), "Invalid attempt record.");
});
attemptSchema.pre("save", function () {
  if (!this.isNew) throw new Error("Attempts are immutable.");
});
for (const operation of [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "replaceOne",
  "findOneAndReplace",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete",
] as const)
  attemptSchema.pre(operation, function () {
    throw new Error("Attempts are immutable.");
  });
export function attemptModel(connection: Connection) {
  return (connection.models.PracticeAttempt ??
    connection.model("PracticeAttempt", attemptSchema)) as Model<
    InferSchemaType<typeof attemptSchema>
  >;
}
