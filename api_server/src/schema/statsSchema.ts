import { z } from "zod";
import {
  decodeHistoryCursor,
  decodeRankingCursor,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from "../lib/statsCursor";

const limitSchema = z.coerce.number().int().positive().max(MAX_PAGE_LIMIT);

const invalidCursorIssue = {
  code: z.ZodIssueCode.custom,
  message: "Invalid cursor format",
} as const;

function createCursorSchema(decoder: (value: string) => unknown) {
  return z.string().transform((value, ctx) => {
    try {
      return decoder(value);
    } catch {
      ctx.addIssue(invalidCursorIssue);
      return z.NEVER;
    }
  });
}

function createPaginationQuerySchema(cursorSchema: ReturnType<typeof createCursorSchema>) {
  return z
    .object({
      cursor: cursorSchema.optional(),
      limit: limitSchema.optional(),
    })
    .transform((input) => ({
      cursor: input.cursor ?? null,
      limit: input.limit ?? DEFAULT_PAGE_LIMIT,
    }));
}

export const rankingsQuerySchema = createPaginationQuerySchema(
  createCursorSchema(decodeRankingCursor)
);

export const userHistoryQuerySchema = createPaginationQuerySchema(
  createCursorSchema(decodeHistoryCursor)
);
