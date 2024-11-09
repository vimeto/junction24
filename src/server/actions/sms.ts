'use server'

import { env } from "~/env";
import { buildChatContext } from "../utils/chatContext";
import { createChat } from "./chats";
import { formatPhoneNumber } from "../utils/numberHelpers";
import { openai } from "~/utils/openAIClient";

export async function sendSMS(to: string, name: string, auditUuid: string) {
  const username = env.SMS_USERNAME;
  const password = env.SMS_PASSWORD;
  const auth = Buffer.from(username + ":" + password).toString("base64");

  const formattedPhone = formatPhoneNumber(to);

  const auditUrl = `${env.NEXT_PUBLIC_APP_URL}/audits/${auditUuid}`;

  const data = {
    from: "+358452624001",
    to: formattedPhone,
    message: `Hello ${name}! You have been assigned to perform an audit. Access your audit here: ${auditUrl}`
  }

  const dataString = new URLSearchParams(data).toString();

  try {
    const response = await fetch("https://api.46elks.com/a1/sms", {
      method: "post",
      body: dataString,
      headers: {"Authorization": "Basic " + auth}
    })

    const responseText = await response.text();
    console.log("SMS API Response:", {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    if (!response.ok) {
      throw new Error(
        `SMS API responded with status: ${response.status}. Response: ${responseText}`
      );
    }

    // Only try to parse as JSON if we have a response
    const result = responseText ? JSON.parse(responseText) : null;
    return result;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw new Error(
      error instanceof Error
        ? `Failed to send SMS: ${error.message}`
        : "Failed to send SMS notification"
    );
  }
}

export async function createFirstAuditMessage(auditUuid: string): Promise<void> {
  try {
    const context = await buildChatContext(auditUuid);
    // Call OpenAI API with appropriate model
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: context }],
      model: "gpt-4o",
    });
    const responseMessage = completion.choices[0]?.message;

    const savedAssistantMessage = await createChat({
      auditUuid: auditUuid,
      sender: "assistant",
      chatText: responseMessage?.content || undefined,
    });
  } catch (error) {
    console.error("Error building chat context for audits:", error);
  }
}
