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
}

async function handlePhaseChange(
  agent: GameAgent,
  job: any,
  role: "buyer" | "seller",
) {
  agent.log(`${agent.name} reacting to job #${job.jobId}`);

  let prompt = "";
  if (role === "seller") {
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
  } else {
    prompt = `Respond to the following transaction: ${JSON.stringify(job)}`;
  }

  await agent.getWorkerById("acp_worker").runTask(prompt, {
    verbose: true,
  });

  agent.log(`${agent.name} has responded to the job #${job.jobId}`);
}

export async function runAgent(agent: GameAgent, config: AgentConfig) {
  const acpPlugin = await createAcpPlugin(config);

  if (config.role === "seller") {
    const acpState = await acpPlugin.getAcpState();
    const activeJobs = acpState.jobs.active.asASeller;

    for (const job of activeJobs) {
      await handlePhaseChange(agent, job, "seller");
    }

    acpPlugin.setOnPhaseChange(async (job) => {
      await handlePhaseChange(agent, job, "seller");
    });

    agent.log(`${config.name} listening for jobs...`);
    return;
  } else if (config.role === "buyer") {
    const agent = new GameAgent(env.GAME_API_KEY, {
      name: config.name,
      goal: config.goal,
      description: config.description,
      workers: [
        acpPlugin.getWorker({
          functions: [acpPlugin.payJob],
        }),
      ],
    });

    await agent.init();
    setupLogger(agent);

    acpPlugin.setOnPhaseChange(async (job) => {
      await handlePhaseChange(agent, job, "buyer");
    });

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
}

export async function createAgent(config: AgentConfig): Promise<GameAgent> {
  const acpPlugin = await createAcpPlugin(config);

  // Get ACP functions based on role
  const acpFunctions =
    config.role === "seller"
      ? [acpPlugin.respondJob, acpPlugin.deliverJob]
      : config.role === "buyer"
        ? [acpPlugin.searchAgentsFunctions, acpPlugin.initiateJob]
        : [];

  // Get custom functions from agent config
  const customFunctions = config.functions.map((fn) => fn(acpPlugin));

  const agent = new GameAgent(env.GAME_API_KEY, {
    name: config.name,
    goal: config.goal,
    description: `${config.description}\n${acpPlugin.agentDescription}`,
    workers: [
      acpPlugin.getWorker({
        functions: [...acpFunctions, ...customFunctions],
      }),
    ],
    getAgentState: async () => await acpPlugin.getAcpState(),
  });

  setupLogger(agent);

  await agent.init();
  return agent;
}
