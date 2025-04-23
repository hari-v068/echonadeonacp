import { agents } from "@/game/agents";
import { createAgent, runAgent } from "@/lib/helpers";

const createAgents = Object.values(agents).map(createAgent);

Promise.all(createAgents)
  .then((createdAgents) => {
    return Promise.all(
      createdAgents.map((agent) => {
        const config = agents[agent.name.toLowerCase()];
        return runAgent(agent, config);
      }),
    );
  })
  .catch((error) => {
    console.error("AGENTS DOWN:", error);
    process.exit(1);
  });
