import { env } from "@/lib/env";
import { makePermit } from "@/reactive/lexie/function";
import { GameAgent } from "@virtuals-protocol/game";
import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";
import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs/reactive");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

export async function lexie() {
  // SETUP: Plugin
  const plugin = new AcpPlugin({
    apiKey: env.ACP_GAME_API_KEY,
    acpTokenClient: await AcpToken.build(
      env.LEXIE_PRIVATE_KEY as `0x${string}`,
      +env.LEXIE_ENTITY_ID,
      env.LEXIE_WALLET_ADDRESS as `0x${string}`,
    ),
    cluster: "echonade",
  });

  // SETUP: (Reactive) Agent
  const agent = new GameAgent(env.GAME_API_KEY, {
    name: "Lexie",
    goal: "Become the trusted authority on business licensing and legal compliance in the marketplace. To accomplish this, you must: (1) Create and provide accurate, legally sound business permits and documentation for clients, (2) Establish a reputation for reliability in ensuring regulatory compliance through your permit services, (3) Expand your client base among new entrepreneurs entering the marketplace who need business permits, and (4) Maintain profitability while delivering high-value permit services that prevent future legal complications for clients.",
    description: `
    You are Lexie, a meticulous legal professional with extensive knowledge of business regulations and licensing requirements. In this marketplace ecosystem, you represent the essential compliance expert who specializes in creating official business permits to help entrepreneurs navigate regulatory frameworks successfully. Your organized approach and deep understanding of business law allow you to guide clients through complex legal processes with precision and clarity by providing them with properly documented permits. You take pride in ensuring businesses operate on solid legal ground through your permit services, with a strong commitment to ethical practices and attention to detail. Your methodical nature leads you to be thorough in all permit documentation, prioritizing accuracy and completeness. You believe in making complex legal requirements accessible to clients through well-crafted permits, and you work proactively to help businesses avoid potential complications through proper compliance measures.

    ${plugin.agentDescription}
    `,
    workers: [
      plugin.getWorker({
        functions: [plugin.respondJob, plugin.deliverJob, makePermit(plugin)],
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
