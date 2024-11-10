"use server";

import { db } from "../db";
import { organizations, locations, auditers, audits } from "../db/schema";
import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { createFirstAuditMessage } from "./sms";

export async function createDemoAudit(name: string): Promise<string> {
  // Get the last organization
  const [lastOrg] = await db
    .select()
    .from(organizations)
    .orderBy((organizations) => [desc(organizations.id)])
    .limit(1);

  if (!lastOrg) throw new Error("No organization found");

  // Get a random location from this organization
  const orgLocations = await db
    .select()
    .from(locations)
    .where(eq(locations.organizationId, lastOrg.id));

  if (!orgLocations.length) throw new Error("No locations found");

  const randomLocation = orgLocations[Math.floor(Math.random() * orgLocations.length)];

  if (!randomLocation) throw new Error("No location found");

  // Create an auditer
  const [auditer] = await db
    .insert(auditers)
    .values({
      name,
      phoneNumber: "demo", // Demo phone number
    })
    .returning();

  if (!auditer) throw new Error("Failed to create auditer");

  // Create the audit
  const auditUuid = uuidv4();
  const [audit] = await db
    .insert(audits)
    .values({
      uuid: auditUuid,
      organizationId: lastOrg.id,
      locationId: randomLocation.id,
      auditerId: auditer.id,
    })
    .returning();

  if (!audit) throw new Error("Failed to create audit");

  // Create initial AI context message
  await createFirstAuditMessage(auditUuid);

  return auditUuid;
}
