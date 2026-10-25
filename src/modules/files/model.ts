import "server-only";
import {
  Schema,
  type Connection,
  type Model,
  type InferSchemaType,
} from "mongoose";
import {
  fileRecord,
  quotaRecord,
  MAX_BYTES,
  LIMIT_BYTES,
  LIMIT_COUNT,
} from "./schemas";

const options = {
  strict: "throw",
  timestamps: true,
  autoIndex: false,
  autoCreate: false,
  versionKey: false,
} as const;
const schema = new Schema(
  {
    createdBy: { type: String, required: true },
    displayName: { type: String, required: true },
    stagingKey: { type: String, required: true },
    finalKey: String,
    candidateKey: String,
    declaredMime: { type: String, required: true },
    declaredBytes: { type: Number, required: true },
    detectedMime: String,
    actualBytes: Number,
    sha256: String,
    status: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    leaseId: { type: String, default: null },
    leaseUntil: { type: Date, default: null },
    reservationBytes: { type: Number, default: MAX_BYTES },
    reservationState: { type: String, required: true },
    readyAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    errorCode: String,
    schemaVersion: { type: Number, default: 1 },
  },
  { ...options, collection: "fileAssets" },
);
schema.pre("validate", function () {
  fileRecord.parse({ ...this.toObject(), _id: String(this._id) });
});
const quota = new Schema(
  {
    _id: { type: String, enum: ["r2"] },
    readyBytes: { type: Number, default: 0 },
    readyCount: { type: Number, default: 0 },
    reservedBytes: { type: Number, default: 0 },
    reservedCount: { type: Number, default: 0 },
    limitBytes: { type: Number, default: LIMIT_BYTES },
    limitCount: { type: Number, default: LIMIT_COUNT },
    schemaVersion: { type: Number, default: 1 },
  },
  { ...options, collection: "storageQuota" },
);
quota.pre("validate", function () {
  quotaRecord.parse(this.toObject());
});
export function fileModels(connection: Connection) {
  return {
    asset: (connection.models.FileAsset ??
      connection.model("FileAsset", schema)) as Model<
      InferSchemaType<typeof schema>
    >,
    quota: (connection.models.StorageQuota ??
      connection.model("StorageQuota", quota)) as Model<
      InferSchemaType<typeof quota>
    >,
  };
}
