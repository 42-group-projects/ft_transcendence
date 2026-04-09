import { Hono } from "hono";
import postgres from "postgres";

type CreateMockScoreBody = {
	player1Nickname: string;
	player2Nickname: string;
	winner: "player1" | "player2";
	player1Score?: number;
	player2Score?: number;
};

const DATABASE_URL = process.env.DATABASE_URL;

function buildMockEmail(nickname: string): string {
	const safe = nickname.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
	return `${safe}_${Math.random().toString(36).slice(2, 8)}@mock.local`;
}

const app = new Hono()
	.get("/", (c) => {
		return c.json({
			message: "mock analysis route ready",
			usage: "POST /api/mock/analysis/scores",
		});
	})
	.post("/scores", async (c) => {
		if (!DATABASE_URL) {
			return c.json({ error: "DATABASE_URL is not set" }, 500);
		}

		const body = (await c.req.json().catch(() => null)) as CreateMockScoreBody | null;

		if (!body) {
			return c.json({ error: "Invalid JSON body" }, 400);
		}

		const p1 = body.player1Nickname?.trim();
		const p2 = body.player2Nickname?.trim();

		if (!p1 || !p2 || (body.winner !== "player1" && body.winner !== "player2")) {
			return c.json(
				{
					error:
						"player1Nickname, player2Nickname, and winner('player1' | 'player2') are required",
				},
				400
			);
		}

		if (p1.length > 20 || p2.length > 20) {
			return c.json({ error: "Nickname must be 1-20 chars" }, 400);
		}

		if (p1 === p2) {
			return c.json({ error: "player1Nickname and player2Nickname must differ" }, 400);
		}

		const sql = postgres(DATABASE_URL);

		try {
			const [existingP1] = await sql<{ id: string; nickname: string }[]>`
				select id, nickname from users where nickname = ${p1} limit 1
			`;

			const player1 =
				existingP1 ??
				(
					await sql<{ id: string; nickname: string }[]>`
						insert into users (id, email, nickname, password_hash, created_at, updated_at)
						values (${crypto.randomUUID()}, ${buildMockEmail(p1)}, ${p1}, ${"mock_password_hash"}, now(), now())
						returning id, nickname
					`
				)[0];

			const [existingP2] = await sql<{ id: string; nickname: string }[]>`
				select id, nickname from users where nickname = ${p2} limit 1
			`;

			const player2 =
				existingP2 ??
				(
					await sql<{ id: string; nickname: string }[]>`
						insert into users (id, email, nickname, password_hash, created_at, updated_at)
						values (${crypto.randomUUID()}, ${buildMockEmail(p2)}, ${p2}, ${"mock_password_hash"}, now(), now())
						returning id, nickname
					`
				)[0];

			const winnerId = body.winner === "player1" ? player1.id : player2.id;
			const loserId = winnerId === player1.id ? player2.id : player1.id;

			const roomId = crypto.randomUUID();
			const sessionId = crypto.randomUUID();
			const recordId = crypto.randomUUID();

			await sql`
				insert into game_rooms (id, match_type, host_id, guest_id, status, created_at, updated_at)
				values (${roomId}, ${"random"}, ${player1.id}, ${player2.id}, ${"finished"}, now(), now())
			`;

			await sql`
				insert into game_sessions (
					id, room_id, player1_id, player2_id, is_cpu_game, winner_id, status,
					started_at, finished_at, created_at, updated_at
				)
				values (
					${sessionId}, ${roomId}, ${player1.id}, ${player2.id}, false, ${winnerId}, ${"finished"},
					now(), now(), now(), now()
				)
			`;

			await sql`
				insert into match_records (
					id, session_id, player1_id, player2_id, winner_id, is_cpu_game, played_at, created_at
				)
				values (
					${recordId}, ${sessionId}, ${player1.id}, ${player2.id}, ${winnerId}, false, now(), now()
				)
			`;

			await sql`
				insert into user_stats (user_id, wins, losses, rating, updated_at)
				values (${winnerId}, 1, 0, 1016, now())
				on conflict (user_id)
				do update set
					wins = user_stats.wins + 1,
					rating = user_stats.rating + 16,
					updated_at = now()
			`;

			await sql`
				insert into user_stats (user_id, wins, losses, rating, updated_at)
				values (${loserId}, 0, 1, 984, now())
				on conflict (user_id)
				do update set
					losses = user_stats.losses + 1,
					rating = greatest(0, user_stats.rating - 16),
					updated_at = now()
			`;

			const result = {
				roomId,
				sessionId,
				matchRecordId: recordId,
				player1,
				player2,
				winnerId,
				submittedScore: {
					player1: body.player1Score ?? null,
					player2: body.player2Score ?? null,
				},
			};

			return c.json({ ok: true, created: result }, 201);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to insert mock score";
			return c.json({ error: message }, 500);
		} finally {
			await sql.end();
		}
	});


export { app as analysisRoutes };
