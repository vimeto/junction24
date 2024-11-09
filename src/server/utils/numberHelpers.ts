export function formatPhoneNumber(phone: string): string {
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
