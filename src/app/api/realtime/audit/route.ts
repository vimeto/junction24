import { NextResponse } from "next/server";
import { z } from "zod";
import { createItemAudit } from "~/server/actions/itemAudits";

const auditRequestSchema = z.object({
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

export async function POST(req: Request) {
  try {
    const data = auditRequestSchema.parse(await req.json());
    const result = await createItemAudit(data);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Realtime Audit Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
