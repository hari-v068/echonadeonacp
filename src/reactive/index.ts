import { evo } from "./evo/agent";
import { lemo } from "./lemo/agent";
import { lexie } from "./lexie/agent";
import { pixie } from "./pixie/agent";
import { zestie } from "./zestie/agent";

(async () => {
  await Promise.all([evo(), lemo(), lexie(), pixie(), zestie()]);
})().catch(console.error);
