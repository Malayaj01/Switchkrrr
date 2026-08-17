import { HustleStatus } from "@prisma/client";
import { z } from "zod";

export const hustleStatusUpdateSchema = z.object({
  status: z.enum([HustleStatus.ACTIVE, HustleStatus.PAUSED, HustleStatus.COMPLETED]),
});

export type HustleStatusUpdateInput = z.infer<typeof hustleStatusUpdateSchema>;
