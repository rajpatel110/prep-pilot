import "server-only";
import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { getServerEnv } from "@/shared/server/env";
import { MAX_BYTES } from "./schemas";
import { HttpError } from "@/shared/server/http";

export interface FileStorage {
  signPut(key: string, mime: string): Promise<string>;
  signGet(key: string, mime: string, name: string): Promise<string>;
  head(key: string, signal: AbortSignal): Promise<{ bytes: number }>;
  read(key: string, signal: AbortSignal): Promise<AsyncIterable<Uint8Array>>;
  put(
    key: string,
    bytes: Buffer,
    mime: string,
    signal: AbortSignal,
  ): Promise<void>;
  remove(key: string, signal: AbortSignal): Promise<void>;
  list(prefix: string, signal: AbortSignal): Promise<string[]>;
}
export async function boundedRead(
  source: AsyncIterable<Uint8Array>,
  signal: AbortSignal,
) {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of source) {
    signal.throwIfAborted();
    length += chunk.byteLength;
    if (length > MAX_BYTES)
      throw new HttpError(422, "FILE_TOO_LARGE", "The file exceeds 10 MiB.");
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks, length);
}
export function r2Storage(
  config: ReturnType<typeof getServerEnv>,
): FileStorage {
  if (
    !config.FILES_ENABLED ||
    !config.R2_ACCOUNT_ID ||
    !config.R2_BUCKET ||
    !config.R2_ACCESS_KEY_ID ||
    !config.R2_SECRET_ACCESS_KEY
  )
    throw new HttpError(503, "FILES_DISABLED", "File storage is unavailable.");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    maxAttempts: 2,
  });
  const Bucket = config.R2_BUCKET;
  return {
    signPut: (Key, ContentType) =>
      getSignedUrl(client, new PutObjectCommand({ Bucket, Key, ContentType }), {
        expiresIn: 300,
        signableHeaders: new Set(["content-type"]),
      }),
    signGet: (Key, ResponseContentType, name) =>
      getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket,
          Key,
          ResponseContentType,
          ResponseContentDisposition: `${ResponseContentType === "application/pdf" ? "attachment" : "inline"}; filename="attachment"; filename*=UTF-8''${encodeURIComponent(name).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16)}`)}`,
        }),
        { expiresIn: 60 },
      ),
    async head(Key, signal) {
      try {
        const result = await client.send(
          new HeadObjectCommand({ Bucket, Key }),
          { abortSignal: signal },
        );
        return { bytes: result.ContentLength ?? 0 };
      } catch (error) {
        if (
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode === 404
        )
          throw new HttpError(
            409,
            "UPLOAD_NOT_FOUND",
            "Upload the file before finalizing.",
          );
        throw error;
      }
    },
    async read(Key, signal) {
      let result;
      try {
        result = await client.send(
          new GetObjectCommand({ Bucket, Key, Range: `bytes=0-${MAX_BYTES}` }),
          { abortSignal: signal },
        );
      } catch (error) {
        if (
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode === 404
        )
          throw new HttpError(
            409,
            "UPLOAD_NOT_FOUND",
            "Upload the file before finalizing.",
          );
        throw error;
      }
      if (!result.Body) throw new Error("Missing object body");
      return result.Body as AsyncIterable<Uint8Array>;
    },
    async put(Key, Body, ContentType, signal) {
      await client.send(
        new PutObjectCommand({
          Bucket,
          Key,
          Body,
          ContentType,
          IfNoneMatch: "*",
        }),
        { abortSignal: signal },
      );
    },
    async remove(Key, signal) {
      await client.send(new DeleteObjectCommand({ Bucket, Key }), {
        abortSignal: signal,
      });
    },
    async list(Prefix, signal) {
      const keys: string[] = [];
      let ContinuationToken: string | undefined;
      do {
        const result = await client.send(
          new ListObjectsV2Command({
            Bucket,
            Prefix,
            ...(ContinuationToken ? { ContinuationToken } : {}),
          }),
          { abortSignal: signal },
        );
        for (const item of result.Contents ?? [])
          if (item.Key) keys.push(item.Key);
        if (keys.length > 1000)
          throw new Error("Orphan inspection limit exceeded");
        ContinuationToken = result.IsTruncated
          ? result.NextContinuationToken
          : undefined;
      } while (ContinuationToken);
      return keys;
    },
  };
}
