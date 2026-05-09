import { z } from "zod";

export const userIdSchema = z.object({
    id: z.string().uuid(),
});
