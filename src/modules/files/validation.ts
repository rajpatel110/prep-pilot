import { createHash } from "node:crypto";
import { HttpError } from "@/shared/server/http";
import { MAX_BYTES } from "./schemas";
export function validateBytes(bytes: Buffer, declaredMime: string) {
  if (bytes.length > MAX_BYTES)
    throw new HttpError(422, "FILE_TOO_LARGE", "The file exceeds 10 MiB.");
  let mime: string | null = null;
  if (
    bytes.subarray(0, 5).toString("ascii") === "%PDF-" &&
    bytes.subarray(-1024).includes(Buffer.from("%%EOF"))
  )
    mime = "application/pdf";
  if (
    bytes.length >= 24 &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.subarray(12, 16).toString("ascii") === "IHDR"
  )
    mime = "image/png";
  if (
    bytes.length >= 4 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255 &&
    bytes[bytes.length - 2] === 255 &&
    bytes[bytes.length - 1] === 217
  )
    mime = "image/jpeg";
  if (
    bytes.length >= 20 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP" &&
    ["VP8 ", "VP8L", "VP8X"].includes(
      bytes.subarray(12, 16).toString("ascii"),
    ) &&
    bytes.readUInt32LE(4) + 8 === bytes.length
  )
    mime = "image/webp";
  if (!bytes.length || !mime || mime !== declaredMime)
    throw new HttpError(
      422,
      "FILE_VALIDATION_FAILED",
      "The uploaded bytes do not match an allowed file format.",
    );
  return {
    detectedMime: mime,
    actualBytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
