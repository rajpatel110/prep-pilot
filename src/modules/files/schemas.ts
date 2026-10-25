import { z } from "zod";

export const MAX_BYTES = 10485760;
export const LIMIT_BYTES = 524288000;
export const LIMIT_COUNT = 100;
export const UPLOAD_SECONDS = 300;
export const FINALIZE_SECONDS = 900;
export const REQUEST_MS = 60000;
export const LEASE_MS = 90000;
export const STAGING_PREFIX = "staging/";
export const fileId = z.string().regex(/^[a-f0-9]{24}$/);
export const fileMime = z.enum([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
export const fileStatus = z.enum([
  "uploading",
  "validating",
  "ready",
  "rejected",
  "deleting",
  "deleted",
]);
const counter = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const uploadInput = z.strictObject({
  filename: z.string().trim().min(1).max(180),
  declaredMime: fileMime,
  declaredBytes: z.number().int().min(1).max(MAX_BYTES),
});
export const cleanupInput = z.strictObject({
  assetIds: z
    .array(fileId)
    .min(1)
    .max(20)
    .refine((ids) => new Set(ids).size === ids.length),
});
export const fileRecord = z
  .strictObject({
    _id: fileId,
    createdBy: z.string().min(1).max(200),
    displayName: z.string().min(1).max(180),
    stagingKey: z.string().startsWith(STAGING_PREFIX).max(300),
    finalKey: z.string().startsWith("final/").max(300).optional(),
    candidateKey: z.string().startsWith("final/").max(300).optional(),
    declaredMime: fileMime,
    declaredBytes: z.number().int().min(1).max(MAX_BYTES),
    detectedMime: fileMime.optional(),
    actualBytes: z.number().int().min(1).max(MAX_BYTES).optional(),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    status: fileStatus,
    expiresAt: z.date(),
    leaseId: z.uuid().nullable(),
    leaseUntil: z.date().nullable(),
    reservationBytes: z.literal(MAX_BYTES),
    reservationState: z.enum(["reserved", "committed", "released"]),
    readyAt: z.date().nullable(),
    deletedAt: z.date().nullable(),
    errorCode: z.string().max(80).optional(),
    schemaVersion: z.literal(1),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((value, context) => {
    if (value.status === "ready" && value.reservationState !== "committed")
      context.addIssue({
        code: "custom",
        message: "Ready files require committed usage.",
      });
    if (
      !value.stagingKey.startsWith(`staging/${value._id}/`) ||
      (value.finalKey && !value.finalKey.startsWith(`final/${value._id}/`)) ||
      (value.candidateKey &&
        !value.candidateKey.startsWith(`final/${value._id}/`))
    )
      context.addIssue({
        code: "custom",
        message: "Object keys must belong to this asset.",
      });
    if (
      ["uploading", "validating"].includes(value.status) &&
      value.reservationState !== "reserved"
    )
      context.addIssue({
        code: "custom",
        message: "Pending uploads require a reservation.",
      });
    if (
      value.status === "validating" &&
      (!value.leaseId || !value.leaseUntil || !value.candidateKey)
    )
      context.addIssue({
        code: "custom",
        message: "Validation requires a bounded lease and candidate.",
      });
    if (value.status === "rejected" && value.reservationState !== "released")
      context.addIssue({
        code: "custom",
        message: "Rejected usage must be released.",
      });
    if (
      value.reservationState === "committed" &&
      (!value.finalKey ||
        !value.detectedMime ||
        !value.actualBytes ||
        !value.sha256 ||
        !value.readyAt)
    )
      context.addIssue({
        code: "custom",
        message: "Ready metadata is incomplete.",
      });
    if (value.status === "deleted" && value.reservationState !== "released")
      context.addIssue({
        code: "custom",
        message: "Deleted usage must be released.",
      });
  });
export type FileRecord = z.output<typeof fileRecord>;
export const quotaRecord = z
  .strictObject({
    _id: z.literal("r2"),
    readyBytes: counter,
    readyCount: counter,
    reservedBytes: counter,
    reservedCount: counter,
    limitBytes: z.literal(LIMIT_BYTES),
    limitCount: z.literal(LIMIT_COUNT),
    schemaVersion: z.literal(1),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine(
    (value) =>
      value.readyBytes + value.reservedBytes <= value.limitBytes &&
      value.readyCount + value.reservedCount <= value.limitCount &&
      value.reservedBytes === value.reservedCount * MAX_BYTES &&
      value.readyBytes >= value.readyCount &&
      value.readyBytes <= value.readyCount * MAX_BYTES,
  );
export function filename(value: string) {
  return (
    value
      .replace(/[\u0000-\u001f\u007f/\\"<>:|?*]/g, "_")
      .replace(/^\.+/, "_")
      .trim()
      .slice(0, 180) || "attachment"
  );
}
export function fileDto(asset: FileRecord) {
  return {
    id: asset._id,
    displayName: asset.displayName,
    status: asset.status,
    declaredMime: asset.declaredMime,
    declaredBytes: asset.declaredBytes,
    mimeType: asset.detectedMime ?? null,
    sizeBytes: asset.actualBytes ?? null,
    createdAt: asset.createdAt.toISOString(),
    readyAt: asset.readyAt?.toISOString() ?? null,
    finalizeBy: asset.expiresAt.toISOString(),
    errorCode: asset.errorCode ?? null,
  };
}
export type FileDto = ReturnType<typeof fileDto>;
