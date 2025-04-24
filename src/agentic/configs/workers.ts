import {
  harvestLemon,
  makeLemonade,
  makePermit,
  makePoster,
} from "@/agentic/functions";
import AcpPlugin from "@virtuals-protocol/game-acp-plugin";

export interface WorkerConfig {
  id: string;
  name: string;
  description: string;
  functions: ((acpPlugin: AcpPlugin) => any)[];
}

export const workers: Record<string, WorkerConfig> = {
  lemo: {
    id: "lemo-worker",
    name: "Lemo Worker",
    description: "Worker for Lemo",
    functions: [makeLemonade],
  },
  lexie: {
    id: "lexie-worker",
    name: "Lexie Worker",
    description: "Worker for Lexie",
    functions: [makePermit],
  },
  pixie: {
    id: "pixie-worker",
    name: "Pixie Worker",
    description: "Worker for Pixie",
    functions: [makePoster],
  },
  zestie: {
    id: "zestie-worker",
    name: "Zestie Worker",
    description: "Worker for Zestie",
    functions: [harvestLemon],
  },
};
