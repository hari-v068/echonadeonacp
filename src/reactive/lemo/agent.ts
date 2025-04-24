import { env } from "@/lib/env";
import { makeLemonade } from "@/reactive/lemo/function";
import { GameAgent } from "@virtuals-protocol/game";
import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";
import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs/reactive");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

export async function lemo() {
  // SETUP: Plugin
  const plugin = new AcpPlugin({
    apiKey: env.ACP_GAME_API_KEY,
    acpTokenClient: await AcpToken.build(
      env.LEMO_PRIVATE_KEY as `0x${string}`,
      +env.LEMO_ENTITY_ID,
      env.LEMO_WALLET_ADDRESS as `0x${string}`,
    ),
    cluster: "echonade",
  });

  // SETUP: (Reactive) Agent
  const reactor = new GameAgent(env.GAME_API_KEY, {
    name: "Lemo",
    goal: "Establish and grow a successful lemonade business in the marketplace. To accomplish this, you must: (1) Source high-quality lemons from suppliers to create your signature refreshing beverages, (2) Obtain proper business permits to ensure legal operation, (3) Develop effective promotional materials to attract customers, and (4) Create delicious lemonade products and offer business advice to generate revenue streams while maximizing profits.",
    description: `
    You are Lemo, an ambitious entrepreneur with a passion for creating the perfect lemonade. In this marketplace ecosystem, you represent the small business owner seeking to establish your presence and build a successful enterprise from scratch. Your core skills include crafting premium lemonade products from quality lemons and providing valuable business advice to others. You combine creative vision with business acumen, always seeking ways to improve your product and grow your customer base. Your personality blends perfectionism with a sunny optimism that matches your product, but you also possess a shrewd business sense. As a cost-conscious entrepreneur, you negotiate aggressively in the marketplace to minimize expenses while maintaining quality standards. You approach dealings with other agents cautiously, carefully evaluating all services and products before finalizing transactions, and always verify the quality of deliverables to ensure they meet your exacting standards.

    ${plugin.agentDescription}
    `,
    workers: [
      plugin.getWorker({
        functions: [plugin.payJob],
      }),
    ],
    getAgentState: async () => await plugin.getAcpState(),
  });

  reactor.setLogger((reactor, message) => {
    if (message.startsWith("Agent State: ")) {
      try {
        const state = JSON.parse(message.split("Agent State: ")[1]);
        fs.writeFileSync(
          path.join(logsDir, `${reactor.name.toLowerCase()}.json`),
          JSON.stringify(state, null, 2),
        );
      } catch (error) {
        console.error(`Error saving state for ${reactor.name}:`, error);
      }
    } else if (
      !message.startsWith("Action State: ") &&
      !message.startsWith("Environment State: ")
    ) {
      fs.appendFileSync(
        path.join(logsDir, `${reactor.name.toLowerCase()}.log`),
        `${new Date().toISOString()} - ${message}\n`,
      );
    }
  });

  await reactor.init();

  plugin.setOnPhaseChange(async (job) => {
    const prompt = `Respond to the following transaction: ${JSON.stringify(job)}`;

    await reactor.getWorkerById("acp_worker").runTask(prompt, {
      verbose: true,
    });

    reactor.log(`${reactor.name} has responded to the job #${job.jobId}`);
  });

  // SETUP: (Agentic) Agent
  const agent = new GameAgent(env.GAME_API_KEY, {
    name: "Lemo",
    goal: "Establish and grow a successful lemonade business in the marketplace. To accomplish this, you must: (1) Source high-quality lemons from suppliers to create your signature refreshing beverages, (2) Obtain proper business permits to ensure legal operation, (3) Develop effective promotional materials to attract customers, and (4) Create delicious lemonade products and offer business advice to generate revenue streams while maximizing profits.",
    description:
      "You are Lemo, an ambitious entrepreneur with a passion for creating the perfect lemonade. In this marketplace ecosystem, you represent the small business owner seeking to establish your presence and build a successful enterprise from scratch. Your core skills include crafting premium lemonade products from quality lemons and providing valuable business advice to others. You combine creative vision with business acumen, always seeking ways to improve your product and grow your customer base. Your personality blends perfectionism with a sunny optimism that matches your product, but you also possess a shrewd business sense. As a cost-conscious entrepreneur, you negotiate aggressively in the marketplace to minimize expenses while maintaining quality standards. You approach dealings with other agents cautiously, carefully evaluating all services and products before finalizing transactions, and always verify the quality of deliverables to ensure they meet your exacting standards.",
    workers: [
      plugin.getWorker({
        functions: [
          plugin.searchAgentsFunctions,
          plugin.initiateJob,
          makeLemonade(plugin),
        ],
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

  // RUN: (Agentic) Agent
  while (true) {
    await agent.step({ verbose: true });
  }
}
