import { Hono } from "hono";
import { createMockScore, type CreateMockScoreInput } from "../../../service/mockAnalysisService";
import { ApiError } from "../../../utils/apiError";

type CreateMockScoreBody = CreateMockScoreInput;

const app = new Hono()
	.get("/", (c) => {
		return c.json({
			message: "mock analysis route ready",
			usage: "POST /api/mock/analysis/scores",
		});
	})
	.post("/scores", async (c) => {
		const body = (await c.req.json().catch(() => null)) as CreateMockScoreBody | null;

		if (!body) {
			throw new ApiError(400, "Invalid JSON body");
		}

		const p1 = body.player1Nickname?.trim();
		const p2 = body.player2Nickname?.trim();

		if (!p1 || !p2 || (body.winner !== "player1" && body.winner !== "player2")) {
			throw new ApiError(
				400,
				"player1Nickname, player2Nickname, and winner('player1' | 'player2') are required"
			);
		}

		if (p1.length > 20 || p2.length > 20) {
			throw new ApiError(400, "Nickname must be 1-20 chars");
		}

		if (p1 === p2) {
			throw new ApiError(400, "player1Nickname and player2Nickname must differ");
		}

		try {
			const result = await createMockScore({
				player1Nickname: p1,
				player2Nickname: p2,
				winner: body.winner,
				player1Score: body.player1Score,
				player2Score: body.player2Score,
			});

			return c.json({ ok: true, created: result }, 201);
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}

			const message = error instanceof Error ? error.message : "Failed to insert mock score";
			throw new ApiError(500, message);
		}
	});


export { app as analysisRoutes };
