import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(12, "Use at least 12 characters.").max(128);
export const signupSchema = z
  .object({ name: z.string().trim().min(1).max(100), email, password })
  .strict();
export const loginSchema = z
  .object({
    email,
    password: z.string().min(1).max(128),
    rememberMe: z.boolean().optional(),
  })
  .strict();
export const signoutSchema = z.object({}).strict();
