'use server'

import { db } from "../db";
import { organizations, organizationRoles } from "../db/schema";
import { auth } from "@clerk/nextjs/server";

export async function makeSuperAdmin() {
  const user = await auth();
  if (!user.userId) throw new Error("Unauthorized");

  // Get the first organization
  const [firstOrg] = await db.select().from(organizations).limit(1);
  if (!firstOrg) throw new Error("No organization found");

  // Create admin role for user
  await db.insert(organizationRoles).values({
    userId: user.userId,
    organizationId: firstOrg.id,
    role: "admin",
  });

  return { success: true };
}
