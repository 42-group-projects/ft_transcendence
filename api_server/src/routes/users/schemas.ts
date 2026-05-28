import { z } from 'zod';

export const updateMeSchema = z
    .object({
        nickname: z.string().min(1).max(20).optional(),
        avatar_url: z.string().optional(),
    })
    .refine((d) => d.nickname !== undefined || d.avatar_url !== undefined, {
        message: 'UNPROCESSABLE',
    });

export const matchesQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const rankingQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type UpdateMe = z.infer<typeof updateMeSchema>;
export type MatchesQuery = z.infer<typeof matchesQuerySchema>;
export type RankingQuery = z.infer<typeof rankingQuerySchema>;
