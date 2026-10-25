import "server-only";
import { getDomainConnection } from "@/shared/server/db";
import { profileModel } from "./model";
import { ObjectId, type Db } from "mongodb";

export async function emailIdentity(db: Db, userId: string) {
  const user = await db.collection("user").findOne(
    {
      $or: [
        { id: userId },
        ...(/^[a-f0-9]{24}$/.test(userId)
          ? [{ _id: new ObjectId(userId) }]
          : []),
      ],
    },
    { projection: { email: 1, emailVerified: 1 } },
  );
  const model = await profiles();
  const profile = await model
    .findOne({ userId })
    .select({ lifecycle: 1 })
    .lean();
  return user &&
    profile?.lifecycle !== "deleting" &&
    typeof user.email === "string"
    ? { email: user.email, verified: user.emailVerified === true }
    : null;
}

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
