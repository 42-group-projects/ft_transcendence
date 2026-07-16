import { z } from 'zod';

export const matchResultSchema = z.object({
    player1Id: z.string().uuid('Invalid player1Id'),
    player2Id: z.string().uuid('Invalid player2Id').nullable().optional(),
    winnerId: z.string().uuid('Invalid winnerId'),
    isCpuGame: z.boolean(),
    cpuLevel: z
        .enum(['easy', 'medium', 'hard', 'oni'], {
            errorMap: () => ({ message: 'Invalid CPU level' }),
        })
        .nullable()
        .optional(),
    startedAt: z
        .union([z.string().datetime(), z.number().positive()])
        .optional(),
});

export type MatchResult = z.infer<typeof matchResultSchema>;
