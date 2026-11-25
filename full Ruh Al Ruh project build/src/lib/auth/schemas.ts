import { z } from "zod";

export const registerSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12).max(128),
  name: z.string().trim().min(2).max(80),
  preferredLanguage: z.string().trim().min(2).max(10).default("en"),
  culturalContext: z.string().trim().max(120).optional(),
});

export const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});

export const passwordResetRequestSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(12).max(128),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
});
