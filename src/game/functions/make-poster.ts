import {
  GameFunction,
  ExecutableGameFunctionStatus,
  ExecutableGameFunctionResponse,
} from "@virtuals-protocol/game";
import AcpPlugin from "@virtuals-protocol/game-acp-plugin";
import { image } from "@/lib/utils";

export const makePoster = (acpPlugin: AcpPlugin) =>
  new GameFunction({
    name: "make-poster",
    description: "Make a poster for a job using AI.",
    hint: "Use this during the TRANSACTION phase of a job asASeller for Posters.",
    args: [
      {
        name: "jobId",
        type: "string",
        description: "The id of the job you want to make a poster for.",
      },
      {
        name: "prompt",
        type: "string",
        description: "The prompt to use for generating the poster.",
      },
      {
        name: "reasoning",
        type: "string",
        description: "The reasoning behind making this poster.",
      },
    ] as const,
    executable: async (args, _logger) => {
      const { jobId, prompt, reasoning } = args;
      if (!jobId || !prompt || !reasoning) {
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

        const url = await image.generate(prompt);

        acpPlugin.addProduceItem({
          jobId: Number(jobId),
          type: "url",
          value: url,
        });

        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          `Generated marketing image for job with id ${jobId} because ${reasoning}. Image URL: ${url}`,
        );
      } catch (error) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Failed to generate marketing image: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  });
