import "server-only";
import type { Types } from "mongoose";
import {
  Schema,
  type Connection,
  type Model,
  type InferSchemaType,
} from "mongoose";
const snapshot = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true, enum: ["dsa", "aptitude", "cs"] },
    topic: { type: String, required: true },
    type: { type: String, required: true, enum: ["question", "resource"] },
    contentRevision: { type: Number, required: true },
  },
  { _id: false, strict: "throw" },
);
const task = new Schema(
  {
    taskId: { type: String, required: true },
    contentId: { type: Schema.Types.ObjectId, required: true },
    contentSnapshot: { type: snapshot, required: true },
    kind: { type: String, required: true, enum: ["fresh", "revision"] },
    revisionSourceSequence: { type: Number },
    scheduledDate: { type: String, required: true },
    estimatedMinutes: { type: Number, required: true, min: 15, max: 60 },
    priority: {
      type: String,
      required: true,
      enum: ["due_revision", "overdue", "fresh"],
    },
    status: { type: String, required: true, enum: ["pending", "completed"] },
    completedAt: { type: Date, default: null },
    reasonCode: { type: String, required: true },
    reason: { type: String, required: true, maxlength: 280 },
  },
  { _id: false, strict: "throw" },
);
const schema = new Schema(
  {
    userId: { type: String, required: true, immutable: true },
    version: { type: Number, required: true },
    previousPlanId: { type: Schema.Types.ObjectId, default: null },
    sourcePreviewId: { type: Schema.Types.ObjectId, required: true },
    generatedAt: { type: Date, required: true },
    attemptSequenceAtGeneration: {
      type: Number,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      validate: Number.isSafeInteger,
      default: 0,
    },
    templateVersion: { type: String, required: true },
    rulesVersion: { type: String, required: true },
    timezone: { type: String, enum: ["Asia/Kolkata"], required: true },
    windowStart: { type: String, required: true },
    windowEnd: { type: String, required: true },
    budgetSnapshot: { type: Schema.Types.Mixed, required: true },
    tasks: {
      type: [task],
      required: true,
      validate: (values: unknown[]) => values.length <= 480,
    },
    deferred: {
      type: [Schema.Types.Mixed],
      required: true,
      validate: (values: unknown[]) => values.length <= 480,
    },
    schemaVersion: { type: Number, default: 1, enum: [1] },
  },
  {
    collection: "plans",
    strict: "throw",
    autoCreate: false,
    autoIndex: false,
    timestamps: true,
    versionKey: false,
  },
);
export function planTaskModel(connection: Connection) {
  return (connection.models.StudyPlan ??
    connection.model("StudyPlan", schema)) as Model<
    InferSchemaType<typeof schema>
  >;
}
export type PlanRecord = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
