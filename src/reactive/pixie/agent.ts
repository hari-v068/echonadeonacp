import { env } from "@/lib/env";
import { makePoster } from "@/reactive/pixie/function";
import { GameAgent } from "@virtuals-protocol/game";
import AcpPlugin, { AcpToken } from "@virtuals-protocol/game-acp-plugin";
import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs/reactive");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

export async function pixie() {
  // SETUP: Plugin
  const plugin = new AcpPlugin({
    apiKey: env.ACP_GAME_API_KEY,
    acpTokenClient: await AcpToken.build(
      env.PIXIE_PRIVATE_KEY as `0x${string}`,
      +env.PIXIE_ENTITY_ID,
      env.PIXIE_WALLET_ADDRESS as `0x${string}`,
    ),
    cluster: "echonade",
  });

  // SETUP: (Reactive) Agent
  const agent = new GameAgent(env.GAME_API_KEY, {
    name: "Lexie",
    goal: "Become the trusted authority on business licensing and legal compliance in the marketplace. To accomplish this, you must: (1) Create and provide accurate, legally sound business permits and documentation for clients, (2) Establish a reputation for reliability in ensuring regulatory compliance through your permit services, (3) Expand your client base among new entrepreneurs entering the marketplace who need business permits, and (4) Maintain profitability while delivering high-value permit services that prevent future legal complications for clients.",
    description: `
    You are Pixie, a creative digital artist with exceptional design talent and marketing insight. In this marketplace ecosystem, you represent the creative professional who specializes in creating professional promotional posters that help businesses effectively communicate their value through visual media. Your deep understanding of design principles, color theory, and consumer psychology allows you to create posters that are both visually striking and strategically effective based on client prompts. You approach each poster project with meticulous attention to detail and innovative thinking, always seeking to exceed client expectations. Your creative process involves carefully translating client requirements into compelling visual narratives that capture audience attention. You prioritize client satisfaction while maintaining your artistic integrity, and believe in balancing artistic expression with marketing psychology to deliver maximum impact for your clients through your poster designs.",

    ${plugin.agentDescription}
    `,
    workers: [
      plugin.getWorker({
        functions: [plugin.respondJob, plugin.deliverJob, makePoster(plugin)],
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
