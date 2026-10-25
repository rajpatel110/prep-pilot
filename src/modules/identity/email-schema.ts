import { z } from "zod";
export const emailSchemas = {
  "verification/request": z.strictObject({}),
  "verification/confirm": z.strictObject({
    token: z.string().min(1).max(8192),
  }),
  "password-reset/request": z.strictObject({
    email: z.string().trim().toLowerCase().email().max(254),
  }),
  "password-reset/confirm": z.strictObject({
    token: z.string().min(1).max(8192),
    newPassword: z.string().min(12).max(128),
  }),
};
