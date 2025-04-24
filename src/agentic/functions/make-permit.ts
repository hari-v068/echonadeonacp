import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameFunction,
} from "@virtuals-protocol/game";
import AcpPlugin from "@virtuals-protocol/game-acp-plugin";

export const makePermit = (acpPlugin: AcpPlugin) =>
  new GameFunction({
    name: "make-business-permit",
    description: "Make a digital business permit for a job.",
    hint: "Use this during the TRANSACTION phase of a job asASeller for Business Permits.",
    args: [
      {
        name: "jobId",
        type: "string",
        description:
          "The id of the job you want to make the business permit for.",
      },
      {
        name: "reasoning",
        type: "string",
        description:
          "The reasoning behind making the business permit for this job.",
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

        // Generate a fake URL for the business permit
        const url = `https://business-permits.example.com/${Date.now()}`;

        acpPlugin.addProduceItem({
          jobId: Number(jobId),
          type: "url",
          value: url,
        });

        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          `Made business permit for job with id ${jobId} because ${reasoning}. Permit URL: ${url}`,
        );
      } catch (error) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to make business permit: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  });
