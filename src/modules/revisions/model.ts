import "server-only";
import {
  Schema,
  type Connection,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { storedRevision } from "./schemas";
const revisionSchema = new Schema(
  {
    userId: { type: String, required: true, immutable: true },
    contentId: { type: Schema.Types.ObjectId, required: true, immutable: true },
    lastAttemptId: { type: Schema.Types.ObjectId, required: true },
    lastAttemptSequence: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    dueDate: { type: String, required: true },
    timezone: {
      type: String,
      required: true,
      enum: ["Asia/Kolkata"],
      default: "Asia/Kolkata",
    },
    intervalDays: { type: Number, required: true, enum: [1, 3, 7] },
    reason: {
      type: String,
      required: true,
      enum: ["failed_or_hard", "help_or_medium", "independent_easy_or_unrated"],
    },
    schemaVersion: { type: Number, default: 1, required: true, enum: [1] },
  },
  {
    collection: "revisions",
    strict: "throw",
    autoIndex: false,
    autoCreate: false,
    timestamps: true,
    versionKey: false,
  },
);
revisionSchema.pre("validate", function () {
  const parsed = storedRevision.safeParse({
    ...this.toObject(),
    _id: String(this._id),
    contentId: String(this.contentId),
    lastAttemptId: String(this.lastAttemptId),
    createdAt: this.createdAt ?? new Date(),
    updatedAt: this.updatedAt ?? new Date(),
  });
  if (!parsed.success)
    for (const issue of parsed.error.issues)
      this.invalidate(issue.path.join("."), "Invalid revision record.");
});
export function revisionModel(connection: Connection) {
  return (connection.models.StudyRevision ??
    connection.model("StudyRevision", revisionSchema)) as Model<
    InferSchemaType<typeof revisionSchema>
  >;
}
