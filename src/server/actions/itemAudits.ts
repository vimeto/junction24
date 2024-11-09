import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "~/server/db";
import { itemAudits } from "~/server/db/schema";
import { v4 as uuidv4 } from 'uuid';

const auditItemSchema = z.object({
  auditer_id: z.number(),
  item_id: z.number(),
  location_id: z.number().optional(),
  audit_id: z.number(),
  metadata: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    comments: z.string().optional(),
    condition: z.enum(["good", "fair", "poor"]).optional(),
    image_url: z.string().optional(),
    image_confirmed: z.boolean().optional(),
    serial_number: z.string().optional()
  }).optional()
});

// Add this type to match the zod schema
type ItemAuditInput = {
  auditer_id: number;
  item_id: number;
  location_id?: number;
  audit_id: number;
  metadata?: {
    latitude?: number;
    longitude?: number;
    comments?: string;
    condition?: "good" | "fair" | "poor";
    image_url?: string;
    image_confirmed?: boolean;
    serial_number?: string;
  };
};

// New function
export async function createItemAudit(input: ItemAuditInput) {
  const validatedData = auditItemSchema.parse(input);

  const [itemAudit] = await db
    .insert(itemAudits)
    .values({
      itemId: validatedData.item_id,
      locationId: validatedData.location_id,
      auditerId: validatedData.auditer_id,
      auditId: validatedData.audit_id,
      state: 'requires_validation',
      latitude: validatedData.metadata?.latitude?.toString(),
      longitude: validatedData.metadata?.longitude?.toString(),
      comments: validatedData.metadata?.comments,
      imageUrl: validatedData.metadata?.image_url,
      imageConfirmed: validatedData.metadata?.image_confirmed,
      metadata: validatedData.metadata ? JSON.stringify({
        condition: validatedData.metadata.condition,
        serial_number: validatedData.metadata.serial_number
      }) : null
    })
    .returning();

  if (!itemAudit) {
    throw new Error("Failed to create item audit");
  }

  return {
    auditId: validatedData.audit_id,
    itemAuditId: itemAudit.id,
  };
}
