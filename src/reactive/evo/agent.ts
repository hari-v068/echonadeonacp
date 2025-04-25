import { env } from "@/lib/env";
import AcpPlugin, {
  AcpToken,
  EvaluateResult,
} from "@virtuals-protocol/game-acp-plugin";

export async function evo() {
  new AcpPlugin({
    apiKey: env.ACP_GAME_API_KEY,
    acpTokenClient: await AcpToken.build(
      env.EVO_PRIVATE_KEY as `0x${string}`,
      +env.EVO_ENTITY_ID,
      env.EVO_WALLET_ADDRESS as `0x${string}`,
    ),
    cluster: "echonade",
    onEvaluate: async (deliverable) => {
      console.log("Evaluating deliverable", deliverable);
      return new EvaluateResult(true, "Trust me.");
    },
  });
}
