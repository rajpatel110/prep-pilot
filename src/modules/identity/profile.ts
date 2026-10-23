import "server-only";
import { getDomainConnection } from "@/shared/server/db";
import { profileModel } from "./model";

export async function profiles() {
  return profileModel(await getDomainConnection());
}

export async function ensureProfile(userId: string) {
  const model = await profiles();
  try {
    return await model
      .findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      )
      .lean();
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      return model.findOne({ userId }).lean();
    throw error;
  }
}
