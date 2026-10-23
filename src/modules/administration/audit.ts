import "server-only";
import { z } from "zod";
import { Schema, type ClientSession, type Connection } from "mongoose";

const counter = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable();
export const auditInputSchema = z.strictObject({
  actorUserId: z.string().min(1).max(200),
  action: z.string().min(1).max(80),
  entityType: z.enum(["profile", "content", "file"]),
  entityId: z.string().min(1).max(200),
  priorRevision: counter,
  newRevision: counter,
  changedFields: z
    .array(
      z
        .string()
        .regex(/^[A-Za-z][A-Za-z0-9_.]*$/)
        .max(80),
    )
    .max(40),
  requestId: z.uuid(),
  reason: z.string().max(500).optional(),
});

const auditSchema = new Schema(
  {
    actorUserId: { type: String, required: true, maxlength: 200 },
    action: { type: String, required: true, maxlength: 80 },
    entityType: {
      type: String,
      required: true,
      enum: ["profile", "content", "file"],
    },
    entityId: { type: String, required: true, maxlength: 200 },
    priorRevision: { type: Number, default: null },
    newRevision: { type: Number, default: null },
    changedFields: { type: [String], required: true },
    requestId: { type: String, required: true },
    reason: { type: String, maxlength: 500 },
    schemaVersion: { type: Number, enum: [1], default: 1, required: true },
  },
  {
    collection: "adminAudit",
    strict: "throw",
    timestamps: true,
    autoIndex: false,
    autoCreate: false,
    versionKey: false,
  },
);

export async function appendAudit(
  connection: Connection,
  session: ClientSession,
  input: z.input<typeof auditInputSchema>,
) {
  if (!session.inTransaction())
    throw new Error("Audit insertion requires a domain transaction.");
  const data = auditInputSchema.parse(input);
  const model =
    connection.models.AdminAudit ?? connection.model("AdminAudit", auditSchema);
  await model.create([data], { session });
}
