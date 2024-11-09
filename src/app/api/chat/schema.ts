import { z } from "zod";

export const messageSchema = z.object({
  text: z.string().optional(),
  imageUrl: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional(),
  previousMessages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.union([
      z.string(),
      z.array(z.object({
        type: z.enum(["text", "image_url"]),
        text: z.string().optional(),
        image_url: z.object({ url: z.string() }).optional()
      }))
    ])
  })).optional(),
  auditUuid: z.string()
}).refine(data => data.text || data.imageUrl, {
  message: "Either text or imageUrl must be provided"
});

export type ChatPayload = z.infer<typeof messageSchema>;
