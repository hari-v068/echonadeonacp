import { agents } from "@/agentic/configs/agents";
import { createAgent, runAgent } from "@/agentic/helpers";

const createAgents = Object.values(agents).map(createAgent);

Promise.all(createAgents)
  .then((agents) => {
    return Promise.all(agents.map(runAgent));
  })
  .catch((error) => {
    console.error("AGENTS DOWN:", error);
    process.exit(1);
  });
