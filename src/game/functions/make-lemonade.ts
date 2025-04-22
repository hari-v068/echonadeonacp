import {
  GameFunction,
  ExecutableGameFunctionStatus,
  ExecutableGameFunctionResponse,
} from "@virtuals-protocol/game";
import AcpPlugin from "@virtuals-protocol/game-acp-plugin";

export const makeLemonade = (acpPlugin: AcpPlugin) =>
  new GameFunction({
    name: "make-lemonade",
    description: "Make lemonades out of lemons in your acquired inventory.",
    hint: "Use this during the TRANSACTION phase of a job asASeller for Lemonades.",
    args: [
      {
        name: "jobId",
        type: "string",
        description: "The id of the job you want to make lemonade for.",
      },
      {
        name: "reasoning",
        type: "string",
        description: "The reasoning behind making lemonade for this job.",
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

        if (
          state.inventory.aquired.filter((item) => item.value === "Lemon")
            .length === 0
        ) {
          return new ExecutableGameFunctionResponse(
            ExecutableGameFunctionStatus.Failed,
            "No lemons available in inventory",
          );
        }

        acpPlugin.addProduceItem({
          jobId: Number(jobId),
          type: "text",
          value: `Lemonade`,
        });

        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          `Made lemonades for job with id ${jobId} because ${reasoning}`,
        );
      } catch (error) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to make lemonade: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  });
