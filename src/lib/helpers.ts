import { GameAgent, GameWorker } from "@virtuals-protocol/game";
import { AgentConfig } from "@/game/agents";
import { workers } from "@/game/workers";
import { createAcpPlugin } from "@/game/plugins/acp";
import { env } from "@/lib/env";
import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

async function createWorker(config: AgentConfig, acpPlugin: any) {
  const workerConfig = workers[config.name.toLowerCase()];
  if (!workerConfig) {
    throw new Error(`No worker found for agent ${config.name}`);
  }

  return new GameWorker({
    id: workerConfig.id,
    name: workerConfig.name,
    description: workerConfig.description,
    functions: workerConfig.functions.map((fn) => fn(acpPlugin)),
    getEnvironment: async () => {
      return acpPlugin.getAcpState();
    },
  });
}

function setupLogger(agent: GameAgent) {
  agent.setLogger((agent, message) => {
    if (message.startsWith("Agent State: ")) {
      try {
        const state = JSON.parse(message.split("Agent State: ")[1]);
        fs.writeFileSync(
          path.join(logsDir, `${agent.name.toLowerCase()}.json`),
          JSON.stringify(state, null, 2)
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
        `${new Date().toISOString()} - ${message}\n`
      );
    }
  });
}

export async function runAgent(agent: GameAgent) {
  await agent.init();
  while (true) {
    try {
      await agent.step({ verbose: true });
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Error in agent ${agent.name}:`, error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

export async function createAgent(config: AgentConfig): Promise<GameAgent> {
  const acpPlugin = await createAcpPlugin(config);
  const worker = await createWorker(config, acpPlugin);

  const agent = new GameAgent(env.GAME_API_KEY, {
    name: config.name,
    goal: config.goal,
    description: `${config.description}\n${acpPlugin.agentDescription}`,
    workers: [
      worker,
      config.acpFunctions
        ? acpPlugin.getWorker({ functions: config.acpFunctions(acpPlugin) })
        : acpPlugin.getWorker(),
    ],
    getAgentState: async () => await acpPlugin.getAcpState(),
  });

  setupLogger(agent);
  return agent;
}
