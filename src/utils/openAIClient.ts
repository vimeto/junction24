import OpenAI from "openai";
import { env } from "~/env";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export { openai };
