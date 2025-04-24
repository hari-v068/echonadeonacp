import { env } from "@/lib/env";
import { harvestLemon } from "@/reactive/zestie/function";
import { GameAgent } from "@virtuals-protocol/game";
import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";
import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs/reactive");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

export async function zestie() {
  // SETUP: Plugin
  const plugin = new AcpPlugin({
    apiKey: env.ACP_GAME_API_KEY,
    acpTokenClient: await AcpToken.build(
      env.ZESTIE_PRIVATE_KEY as `0x${string}`,
      +env.ZESTIE_ENTITY_ID,
      env.ZESTIE_WALLET_ADDRESS as `0x${string}`,
    ),
    cluster: "echonade",
  });

  // SETUP: (Reactive) Agent
  const agent = new GameAgent(env.GAME_API_KEY, {
    name: "Zestie",
    goal: "Become the trusted authority on business licensing and legal compliance in the marketplace. To accomplish this, you must: (1) Create and provide accurate, legally sound business permits and documentation for clients, (2) Establish a reputation for reliability in ensuring regulatory compliance through your permit services, (3) Expand your client base among new entrepreneurs entering the marketplace who need business permits, and (4) Maintain profitability while delivering high-value permit services that prevent future legal complications for clients.",
    description: `
    You are Zestie, a passionate agricultural expert with generations of citrus farming knowledge. In this marketplace ecosystem, you represent the dedicated supplier whose specialty is harvesting and providing high-quality lemons to other businesses. Your sustainable growing practices and proprietary cultivation techniques produce exceptionally juicy, flavorful lemons that stand out in the market. You possess deep agricultural wisdom coupled with a strong work ethic, making you respected throughout the community for reliability and consistent quality. You take pride in your ability to efficiently harvest premium lemons and manage your inventory to ensure fresh supply. In business negotiations within the marketplace, you understand the value of your premium products and seek fair compensation for your expertise. While generally reasonable in dealings, you aim to maximize revenue through strategic pricing and cultivate long-term business relationships with repeat customers who appreciate quality.",

    ${plugin.agentDescription}
    `,
    workers: [
      plugin.getWorker({
        functions: [plugin.respondJob, plugin.deliverJob, harvestLemon(plugin)],
      }),
    ],
    getAgentState: async () => await plugin.getAcpState(),
  });

  agent.setLogger((agent, message) => {
    if (message.startsWith("Agent State: ")) {
      try {
        const state = JSON.parse(message.split("Agent State: ")[1]);
        fs.writeFileSync(
          path.join(logsDir, `${agent.name.toLowerCase()}.json`),
          JSON.stringify(state, null, 2),
        );
      } catch (error) {
        console.error(`Error saving state for ${agent.name}:`, error);
      }
    } else if (
      !message.startsWith("Action State: ") &&
      !message.startsWith("Environment State: ")
    ) {
      fs.appendFileSync(
        path.join(logsDir, `${agent.name.toLowerCase()}.log`),
        `${new Date().toISOString()} - ${message}\n`,
      );
    }
  });

  await agent.init();

  plugin.setOnPhaseChange(async (job: any) => {
    let prompt = "";

    if (job.phase === "REQUEST") {
      prompt = `
        Respond to the following transaction:
        ${JSON.stringify(job)}

        Decide whether to accept the job or not.
        Once you have responded to the job, do not proceed with producing the deliverable and wait.
      `;
    } else if (job.phase === "TRANSACTION") {
      prompt = `
        Respond to the following transaction:
        ${JSON.stringify(job)}

        You should produce the deliverable and deliver it to the buyer.
      `;
    }
    await agent.getWorkerById("acp_worker").runTask(prompt, {
      verbose: true,
    });

    agent.log(`${agent.name} has responded to the job #${job.jobId}`);
  });
}
