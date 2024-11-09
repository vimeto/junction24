"use server";

import { db } from "../db";
import { audits, auditers } from "../db/schema";
import { v4 as uuidv4 } from 'uuid';

type CreateAuditParams = {
  name: string;
  phoneNumber: string;
  locationId: number;
  organizationId: number;
};

export async function createAuditWithAuditer(params: CreateAuditParams) {
  // First create the auditer
  const [auditer] = await db
    .insert(auditers)
    .values({
      name: params.name,
      phoneNumber: params.phoneNumber,
    })
    .returning();

  if (!auditer) {
    throw new Error("Failed to create auditer");
  }

  // Then create the audit with a unique UUID
  const [audit] = await db
    .insert(audits)
    .values({
      uuid: uuidv4(),
      organizationId: params.organizationId,
      auditerId: auditer.id,
      locationId: params.locationId,
    })
    .returning();

  if (!audit) {
    throw new Error("Failed to create audit");
  }

  return { audit, auditer };
}
