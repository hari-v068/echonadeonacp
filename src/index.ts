import { agents } from "@/game/agents";
import { createAgent, runAgent } from "@/lib/helpers";

const agentCreations = Object.values(agents).map(createAgent);

Promise.all(agentCreations)
  .then((agents) => {
    return Promise.all(agents.map(runAgent));
  })
  .catch((error) => {
    console.error("Fatal error in agent system:", error);
    process.exit(1);
  });
