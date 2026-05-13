import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    nickname: z.string().min(1),
    password: z.string().min(8),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
