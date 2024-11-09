import { db } from "../db";
import { chats, audits } from "../db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function getVisibleChats(auditUuid: string, includeHidden = false) {
  const audit = await db.query.audits.findFirst({
    where: eq(audits.uuid, auditUuid),
  });

  if (!audit) {
    throw new Error("Audit not found");
  }

  const visibleChats = await db.query.chats.findMany({
    where: and(
      eq(chats.auditId, audit.id),
      includeHidden ? undefined : eq(chats.hidden, false)
    ),
    orderBy: (chats, { asc }) => [asc(chats.createdAt)],
  });

  const initialMessages = visibleChats.map((chat) => ({
    text: chat.chatText ?? undefined,
    role: chat.sender as "user" | "assistant",
    image: chat.imageUrl ?? undefined,
  }));

  return initialMessages;
}
