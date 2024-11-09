import { z } from "zod";
import { db } from "~/server/db";
import { chats } from "~/server/db/schema";

const chatSchema = z.object({
  itemAuditId: z.number().optional(),
  sender: z.enum(["user", "assistant"]),
  chatText: z.string().optional(),
  imageUrl: z.string().optional(),
});

type ChatInput = z.infer<typeof chatSchema>;

export async function createChat(input: ChatInput) {
  const validatedData = chatSchema.parse(input);

  const [savedChat] = await db
    .insert(chats)
    .values({
      itemAuditId: validatedData.itemAuditId ?? null,
      sender: validatedData.sender,
      chatText: validatedData.chatText ?? null,
      imageUrl: validatedData.imageUrl ?? null,
      createdAt: new Date(),
    })
    .returning();

  if (!savedChat) {
    throw new Error("Failed to save chat message");
  }

  return savedChat;
}
