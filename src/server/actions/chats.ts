import { z } from "zod";
import { db } from "~/server/db";
import { chats, audits } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const chatSchema = z.object({
  auditUuid: z.string(),
  sender: z.enum(["user", "assistant"]),
  chatText: z.string().optional(),
  imageUrl: z.string().optional(),
  hidden: z.boolean().optional(),
});

type ChatInput = z.infer<typeof chatSchema>;

export async function createChat(input: ChatInput) {
  const validatedData = chatSchema.parse(input);

  const audit = await db.query.audits.findFirst({
    where: (model, { eq }) => eq(model.uuid, validatedData.auditUuid),
  });

  if (!audit) {
    throw new Error("Audit not found");
  }

  const [savedChat] = await db
    .insert(chats)
    .values({
      auditId: audit.id,
      sender: validatedData.sender,
      chatText: validatedData.chatText ?? null,
      imageUrl: validatedData.imageUrl ?? null,
      hidden: validatedData.hidden ?? false,
      createdAt: new Date(),
    })
    .returning();

  if (!savedChat) {
    throw new Error("Failed to save chat message");
  }

  return savedChat;
}
