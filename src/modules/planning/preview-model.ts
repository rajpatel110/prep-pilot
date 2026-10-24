import "server-only";
import type { Types } from "mongoose";
import {
  Schema,
  type Connection,
  type Model,
  type InferSchemaType,
} from "mongoose";
import { proposalValue } from "./schemas";
import { evidenceValue } from "./adaptation";
const schema = new Schema(
  {
    userId: { type: String, required: true, immutable: true },
    kind: {
      type: String,
      enum: ["initial", "adapt", "reschedule"],
      required: true,
    },
    basePlanId: { type: Schema.Types.ObjectId, default: null },
    baseStateRevision: { type: Number, required: true, min: 0 },
    catalogRevision: { type: Number, required: true, min: 0 },
    templateVersion: { type: String, required: true },
    rulesVersion: { type: String, required: true },
    localDateAtCreation: { type: String, required: true },
    proposal: {
      type: Schema.Types.Mixed,
      required: true,
      validate: (value: unknown) => proposalValue.safeParse(value).success,
    },
    evidence: {
      type: [Schema.Types.Mixed],
      default: [],
      validate: (value: unknown[]) =>
        value.length <= 100 &&
        value.every((entry) => evidenceValue.safeParse(entry).success),
    },
    expiresAt: { type: Date, required: true },
    purgeAt: { type: Date, required: true },
    state: {
      type: String,
      enum: ["pending", "confirmed"],
      default: "pending",
      required: true,
    },
    confirmedPlanId: { type: Schema.Types.ObjectId, default: null },
    confirmedAt: { type: Date, default: null },
    schemaVersion: { type: Number, default: 1, enum: [1] },
  },
  {
    collection: "planPreviews",
    strict: "throw",
    autoIndex: false,
    autoCreate: false,
    timestamps: true,
    versionKey: false,
  },
);
export function previewModel(connection: Connection) {
  return (connection.models.PlanPreview ??
    connection.model("PlanPreview", schema)) as Model<
    InferSchemaType<typeof schema>
  >;
}
export type PreviewRecord = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
