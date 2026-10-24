import "server-only";
import { HttpError } from "@/shared/server/http";
import { profiles } from "./profile";
import { actorDto, requireActor } from "./service";
import { destination } from "./policy";
import { serverConfig } from "@/shared/server/config";
import { preferenceFields, preferencesInputSchema } from "./preferences-schema";

export async function savePreferences(headers: Headers, input: unknown) {
  const actor = await requireActor(headers);
  const parsed = preferencesInputSchema.safeParse(input);
  if (!parsed.success)
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "Check your preparation preferences.",
      preferenceFields(parsed.error),
    );
  const { expectedStateRevision, ...preferences } = parsed.data;
  const model = await profiles();
  const profile = await model
    .findOneAndUpdate(
      {
        userId: actor.session.user.id,
        lifecycle: "active",
        role: actor.profile.role,
        stateRevision: expectedStateRevision,
      },
      { $set: { preferences }, $inc: { stateRevision: 1 } },
      {
        returnDocument: "after",
        runValidators: true,
      },
    )
    .lean();
  if (!profile) {
    await requireActor(headers);
    throw new HttpError(
      409,
      "STATE_CONFLICT",
      "Preferences changed. Read the saved values and reconcile before trying again.",
    );
  }
  return actorDto({
    ...actor,
    profile,
    destination: destination(
      { ...profile, preferences },
      actor.session.user.emailVerified,
      serverConfig.EMAIL_MODE,
    ),
  });
}
