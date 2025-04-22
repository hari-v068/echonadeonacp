import {
  GameFunction,
  ExecutableGameFunctionStatus,
  ExecutableGameFunctionResponse,
} from "@virtuals-protocol/game";
import AcpPlugin from "@virtuals-protocol/game-acp-plugin";

export const harvestLemon = (acpPlugin: AcpPlugin) =>
  new GameFunction({
    name: "harvest-lemon",
    description: "Harvest lemons for a job.",
    hint: "Use this during the TRANSACTION phase of a job asASeller for Lemons.",
    args: [
      {
        name: "jobId",
        type: "string",
        description: "The id of the job you want to harvest lemons for.",
      },
      {
        name: "reasoning",
        type: "string",
        description: "The reasoning behind harvesting lemons for this job.",
      },
    ] as const,
    executable: async (args, _logger) => {
      const { jobId, reasoning } = args;
      if (!jobId || !reasoning) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          "One or more required arguments are missing",
        );
      }

      try {
        const state = await acpPlugin.getAcpState();

        const job = state.jobs.active.asASeller.find(
          (job) => job.jobId === Number(jobId),
        );

        if (!job) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Job with id ${jobId} not found in active seller jobs`,
          );
        }

        const lemonExists = state.inventory.produced.some(
          (lemon) => lemon.jobId === Number(jobId),
        );

        if (lemonExists) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            `Lemons already harvested for job with id ${jobId}. Proceed to deliver the lemons.`,
          );
        }

        acpPlugin.addProduceItem({
          jobId: Number(jobId),
          type: "text",
          value: "Lemon",
        });

        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          `Harvested lemons for job with id ${jobId} because ${reasoning}`,
        );
      } catch (error) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to harvest lemons: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  });
