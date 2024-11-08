'use server'

import { db } from "../db";
import { organizations } from "../db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
});

export async function updateOrganization(id: number, data: FormData) {
  const user = await auth();
  if (!user.userId) throw new Error("Unauthorized");

  const name = data.get("name");
  const parsed = updateOrganizationSchema.safeParse({ name });
  if (!parsed.success) {
    throw new Error("Invalid data");
  }

  await db.update(organizations)
    .set({
      name: parsed.data.name,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, id));

  return { success: true };
}
