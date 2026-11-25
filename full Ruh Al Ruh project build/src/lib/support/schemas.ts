import { z } from "zod";
import { LANGUAGE_CODES } from "@/lib/conversation/types";

export const resourceQuerySchema = z.object({
  language: z.enum(LANGUAGE_CODES),
  jurisdiction: z.string().trim().max(120).optional(),
});

export const supportEventSchema = z.object({
  sessionId: z.string().trim().min(1),
  decision: z.enum(["accepted", "declined"]),
  jurisdiction: z.string().trim().max(120).optional(),
});
