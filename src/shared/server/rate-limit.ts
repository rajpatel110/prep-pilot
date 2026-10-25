import "server-only";
import { createHmac } from "node:crypto";
import { getDomainConnection } from "./db";
import { serverConfig } from "./config";
import { HttpError } from "./http";

export async function rateLimit(
  policy: string,
  subject: string,
  max: number,
  seconds: number,
) {
  const now = Date.now();
  const window = Math.floor(now / (seconds * 1000));
  const key = createHmac("sha256", serverConfig.RATE_LIMIT_SECRET!)
    .update(`${policy}:${subject}:${window}`)
    .digest("hex");
  const connection = await getDomainConnection();
  const collection = connection.db!.collection<{
    _id: string;
    count: number;
    expiresAt: Date;
  }>("rateBuckets");
  let result;
  try {
    result = await collection.findOneAndUpdate(
      { _id: key },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          expiresAt: new Date((window + 1) * seconds * 1000 + 86400000),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    result = await collection.findOneAndUpdate(
      { _id: key },
      { $inc: { count: 1 } },
      { returnDocument: "after" },
    );
  }
  if (!result || result.count > max)
    throw new HttpError(
      429,
      "RATE_LIMITED",
      "Too many requests. Please try again later.",
      undefined,
      Math.max(1, Math.ceil(((window + 1) * seconds * 1000 - now) / 1000)),
    );
}
