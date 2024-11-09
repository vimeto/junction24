'use server'

import { env } from "~/env";

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If number starts with 0, assume Finnish number and replace with +358
  if (cleaned.startsWith('0')) {
    cleaned = '+358' + cleaned.slice(1);
  }

  // If number doesn't start with +, assume Finnish number and add +358
  if (!cleaned.startsWith('+')) {
    cleaned = '+358' + cleaned;
  }

  // Validate the final format
  const phoneRegex = /^\+\d{8,15}$/;
  if (!phoneRegex.test(cleaned)) {
    throw new Error('Invalid phone number format. Please provide a valid phone number.');
  }

  return cleaned;
}

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
