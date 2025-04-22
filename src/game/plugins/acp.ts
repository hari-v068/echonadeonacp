import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";
import { env } from "@/lib/env";
import { AgentConfig } from "@/game/agents";

export const createAcpPlugin = async (
  config: AgentConfig,
): Promise<AcpPlugin> => {
  return new AcpPlugin({
    apiKey: env.ACP_GAME_API_KEY,
    acpTokenClient: await AcpToken.build(
      config.privateKey,
      config.entityId,
      config.walletAddress,
    ),
  });
};
