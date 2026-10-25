import { z } from "zod";

export const roles = z.enum(["student", "admin", "owner"]);
export const accountEmail = z.string().trim().toLowerCase().email().max(254);
export const identityId = z.string().min(1).max(200);
export const revision = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER - 1);
export const lookupInput = z.strictObject({ email: accountEmail });
export const passwordInput = z.strictObject({
  password: z.string().min(1).max(128),
});
export const roleInput = z
  .strictObject({
    expectedRole: z.enum(["student", "admin"]),
    role: z.enum(["student", "admin"]),
    expectedStateRevision: revision,
    operationId: z.uuid(),
    reason: z.string().trim().min(1).max(500),
  })
  .refine((value) => value.role !== value.expectedRole, {
    message: "Choose a supported role transition.",
    path: ["role"],
  });
export type ManagedAccount = {
  userId: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: z.infer<typeof roles>;
  lifecycle: "active" | "deleting";
  stateRevision: number;
  eligible: boolean;
};
export const RECENT_AUTH_MS = 5 * 60 * 1000;
