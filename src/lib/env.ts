import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  // Core game configuration
  GAME_API_KEY: z.string().min(1),
  ACP_GAME_API_KEY: z.string().min(1),
  GAME_TWITTER_ACCESS_TOKEN: z.string().min(1),

  // Lemo agent configuration
  LEMO_PRIVATE_KEY: z.string().min(1),
  LEMO_ENTITY_ID: z.string().min(1),
  LEMO_WALLET_ADDRESS: z.string().min(1),

  // Lexie agent configuration
  LEXIE_PRIVATE_KEY: z.string().min(1),
  LEXIE_ENTITY_ID: z.string().min(1),
  LEXIE_WALLET_ADDRESS: z.string().min(1),

  // Pixie agent configuration
  PIXIE_PRIVATE_KEY: z.string().min(1),
  PIXIE_ENTITY_ID: z.string().min(1),
  PIXIE_WALLET_ADDRESS: z.string().min(1),

  // Zestie agent configuration
  ZESTIE_PRIVATE_KEY: z.string().min(1),
  ZESTIE_ENTITY_ID: z.string().min(1),
  ZESTIE_WALLET_ADDRESS: z.string().min(1),

  // Evo agent configuration
  EVO_PRIVATE_KEY: z.string().min(1),
  EVO_ENTITY_ID: z.string().min(1),
  EVO_WALLET_ADDRESS: z.string().min(1),

  // Utility configuration
  LEONARDO_API_KEY: z.string().min(1),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ INVALID ENV:", _env.error.format());
  throw new Error("Invalid environment variables.");
}

export const env = _env.data;
