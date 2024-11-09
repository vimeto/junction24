import { NextResponse } from "next/server";
import { z } from "zod";
import { messageSchema } from "./schema";
import { processChat } from "./actions";

export async function POST(req: Request) {
  try {
    // Validate request body
    const payload = messageSchema.parse(await req.json());
    const { success, response, auditId } = await processChat(payload);

    return NextResponse.json({
      success,
      response,
      auditId
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
