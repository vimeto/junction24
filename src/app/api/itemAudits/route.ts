import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { itemAudits, audits } from "~/server/db/schema";
import { v4 as uuidv4 } from 'uuid';

const auditItemSchema = z.object({
  auditer_id: z.string().transform(val => parseInt(val, 10)),
  item_id: z.string().transform(val => parseInt(val, 10)),
  location_id: z.string().transform(val => parseInt(val, 10)),
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

export async function POST(req: Request) {
  try {
    console.log("Item audit post request")
    console.log(req)  
    // Authenticate user
    const user = await auth();
    if (!user.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    console.log("Request body:", body); // Add this for debugging
    const validatedData = auditItemSchema.parse(body);

    // Create a new audit record
    const [audit] = await db
      .insert(audits)
      .values({
        uuid: uuidv4(),
        auditerId: validatedData.auditer_id,
      })
      .returning();

    if (!audit) {
      throw new Error("Failed to create audit");
    }

    const [itemAudit] = await db
      .insert(itemAudits)
      .values({
        itemId: validatedData.item_id,
        locationId: validatedData.location_id,
        auditerId: validatedData.auditer_id,
        auditId: audit.id,
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

    return NextResponse.json({
      success: true,
      message: "Item audit created successfully",
      data: {
        auditId: audit.id,
        itemAuditId: itemAudit.id,
      }
    });

  } catch (error) {
    console.error("Item Audit API Error:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 