CREATE TYPE "public"."cpu_level" AS ENUM('easy', 'medium', 'hard', 'oni');--> statement-breakpoint
CREATE TYPE "public"."friend_request_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('accepted', 'removed');--> statement-breakpoint
CREATE TYPE "public"."game_room_status" AS ENUM('waiting', 'ready', 'playing', 'finished', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."game_session_status" AS ENUM('playing', 'paused', 'finished');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('keyword', 'invite', 'random', 'cpu');--> statement-breakpoint
CREATE TYPE "public"."oauth_provider_type" AS ENUM('google', 'github');--> statement-breakpoint
CREATE TABLE "friend_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"status" "friend_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friend_requests_not_self_chk" CHECK ("friend_requests"."sender_id" <> "friend_requests"."receiver_id")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"friend_id" uuid NOT NULL,
	"status" "friendship_status" DEFAULT 'accepted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_not_self_chk" CHECK ("friendships"."user_id" <> "friendships"."friend_id")
);
--> statement-breakpoint
CREATE TABLE "game_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_type" "match_type" NOT NULL,
	"keyword" varchar(50),
	"host_id" uuid NOT NULL,
	"guest_id" uuid,
	"cpu_level" "cpu_level",
	"status" "game_room_status" DEFAULT 'waiting' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_rooms_keyword_match_type_chk" CHECK (("game_rooms"."match_type" = 'keyword' and "game_rooms"."keyword" is not null) or ("game_rooms"."match_type" <> 'keyword' and "game_rooms"."keyword" is null)),
	CONSTRAINT "game_rooms_cpu_level_match_type_chk" CHECK (("game_rooms"."match_type" = 'cpu' and "game_rooms"."cpu_level" is not null) or ("game_rooms"."match_type" <> 'cpu' and "game_rooms"."cpu_level" is null))
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"player1_id" uuid NOT NULL,
	"player2_id" uuid,
	"is_cpu_game" boolean DEFAULT false NOT NULL,
	"cpu_level" "cpu_level",
	"winner_id" uuid,
	"status" "game_session_status" DEFAULT 'playing' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_sessions_winner_member_chk" CHECK ("game_sessions"."winner_id" is null or "game_sessions"."winner_id" = "game_sessions"."player1_id" or "game_sessions"."winner_id" = "game_sessions"."player2_id"),
	CONSTRAINT "game_sessions_cpu_player2_chk" CHECK (("game_sessions"."is_cpu_game" = true and "game_sessions"."player2_id" is null) or ("game_sessions"."is_cpu_game" = false)),
	CONSTRAINT "game_sessions_finished_winner_chk" CHECK ("game_sessions"."finished_at" is null or "game_sessions"."winner_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "match_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"player1_id" uuid NOT NULL,
	"player2_id" uuid,
	"winner_id" uuid NOT NULL,
	"is_cpu_game" boolean DEFAULT false NOT NULL,
	"played_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "oauth_provider_type" NOT NULL,
	"provider_user_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 1000 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_stats_wins_non_negative_chk" CHECK ("user_stats"."wins" >= 0),
	CONSTRAINT "user_stats_losses_non_negative_chk" CHECK ("user_stats"."losses" >= 0),
	CONSTRAINT "user_stats_rating_non_negative_chk" CHECK ("user_stats"."rating" >= 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"nickname" varchar(20) NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_nickname_length_chk" CHECK (char_length("users"."nickname") between 1 and 20)
);
--> statement-breakpoint
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_users_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_rooms" ADD CONSTRAINT "game_rooms_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_rooms" ADD CONSTRAINT "game_rooms_guest_id_users_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_room_id_game_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."game_rooms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_player1_id_users_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_player2_id_users_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_records" ADD CONSTRAINT "match_records_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_records" ADD CONSTRAINT "match_records_player1_id_users_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_records" ADD CONSTRAINT "match_records_player2_id_users_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_records" ADD CONSTRAINT "match_records_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "friend_requests_sender_receiver_uq" ON "friend_requests" USING btree ("sender_id","receiver_id");--> statement-breakpoint
CREATE UNIQUE INDEX "friendships_user_friend_uq" ON "friendships" USING btree ("user_id","friend_id");--> statement-breakpoint
CREATE UNIQUE INDEX "game_sessions_room_uq" ON "game_sessions" USING btree ("room_id");--> statement-breakpoint
CREATE UNIQUE INDEX "match_records_session_uq" ON "match_records" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_accounts_provider_user_uq" ON "oauth_accounts" USING btree ("provider","provider_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_nickname_uq" ON "users" USING btree ("nickname");