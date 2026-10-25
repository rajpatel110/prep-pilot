import "server-only";
import { ObjectId } from "mongodb";
import type { ClientSession, Connection } from "mongoose";

export async function administrationIdentity(
  connection: Connection,
  selector: { email: string } | { userId: string },
  session?: ClientSession,
) {
  const filter =
    "email" in selector
      ? { email: selector.email }
      : {
          $or: [
            { id: selector.userId },
            ...(/^[a-f0-9]{24}$/.test(selector.userId)
              ? [{ _id: new ObjectId(selector.userId) }]
              : []),
          ],
        };
  const user = await connection.db!.collection("user").findOne(filter, {
    projection: { id: 1, name: 1, email: 1, emailVerified: 1 },
    ...(session ? { session } : {}),
  });
  return user && typeof user.email === "string"
    ? {
        userId: typeof user.id === "string" ? user.id : String(user._id),
        name: typeof user.name === "string" ? user.name : "",
        email: user.email,
        emailVerified: user.emailVerified === true,
      }
    : null;
}
