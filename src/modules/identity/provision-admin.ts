import "server-only";
import type { Connection } from "mongoose";
import { profileModel } from "./model";

export async function provisionAdministrator(
  connection: Connection,
  userId: string,
  emailMode: "test" | "live",
  requestId: string,
) {
  void emailMode;
  void requestId;
  const profile = await profileModel(connection)
    .findOne({ userId, lifecycle: "active" })
    .lean();
  if (profile?.role === "admin" || profile?.role === "owner")
    return "unchanged";
  throw new Error(
    "Direct operator admin grants are retired. Provision the owner explicitly, then use owner-controlled management.",
  );
}
