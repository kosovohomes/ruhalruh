import { z } from "zod";
import { LANGUAGE_CODES } from "./types";

export const createSessionSchema = z.object({
  language: z.enum(LANGUAGE_CODES).optional(),
  culturalContext: z.string().trim().max(120).optional(),
});

export const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(4_000),
});
