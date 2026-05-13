import { relations, sql } from 'drizzle-orm';
import {
    boolean,
    check,
    integer,
    pgEnum,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
    text,
} from 'drizzle-orm/pg-core';

export const oauthProviderTypeEnum = pgEnum('oauth_provider_type', [
    'google',
    'github',
]);

export const friendRequestStatusEnum = pgEnum('friend_request_status', [
    'pending',
    'accepted',
    'rejected',
]);

export const friendshipStatusEnum = pgEnum('friendship_status', [
    'accepted',
    'removed',
]);

export const matchTypeEnum = pgEnum('match_type', [
    'keyword',
    'invite',
    'random',
    'cpu',
]);

export const cpuLevelEnum = pgEnum('cpu_level', [
    'easy',
    'medium',
    'hard',
    'oni',
]);

export const gameRoomStatusEnum = pgEnum('game_room_status', [
    'waiting',
    'ready',
    'playing',
    'finished',
    'cancelled',
]);

export const gameSessionStatusEnum = pgEnum('game_session_status', [
    'playing',
    'paused',
    'finished',
]);

export const users = pgTable(
    'users',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        email: varchar('email', { length: 255 }).notNull(),
        passwordHash: varchar('password_hash', { length: 255 }),
        nickname: varchar('nickname', { length: 20 }).notNull(),
        avatarUrl: text('avatar_url'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex('users_email_uq').on(table.email),
        uniqueIndex('users_nickname_uq').on(table.nickname),
        check(
            'users_nickname_length_chk',
            sql`char_length(${table.nickname}) between 1 and 20`,
        ),
    ],
);

export const oauthAccounts = pgTable(
    'oauth_accounts',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        provider: oauthProviderTypeEnum('provider').notNull(),
        providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex('oauth_accounts_provider_user_uq').on(
            table.provider,
            table.providerUserId,
        ),
    ],
);

export const friendRequests = pgTable(
    'friend_requests',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        senderId: uuid('sender_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        receiverId: uuid('receiver_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        status: friendRequestStatusEnum('status').notNull().default('pending'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex('friend_requests_sender_receiver_uq').on(
            table.senderId,
            table.receiverId,
        ),
        check(
            'friend_requests_not_self_chk',
            sql`${table.senderId} <> ${table.receiverId}`,
        ),
    ],
);

export const friendships = pgTable(
    'friendships',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        friendId: uuid('friend_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        status: friendshipStatusEnum('status').notNull().default('accepted'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex('friendships_user_friend_uq').on(
            table.userId,
            table.friendId,
        ),
        check(
            'friendships_not_self_chk',
            sql`${table.userId} <> ${table.friendId}`,
        ),
    ],
);

export const gameRooms = pgTable(
    'game_rooms',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        matchType: matchTypeEnum('match_type').notNull(),
        keyword: varchar('keyword', { length: 50 }),
        hostId: uuid('host_id')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),
        guestId: uuid('guest_id').references(() => users.id, {
            onDelete: 'restrict',
        }),
        cpuLevel: cpuLevelEnum('cpu_level'),
        status: gameRoomStatusEnum('status').notNull().default('waiting'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        check(
            'game_rooms_keyword_match_type_chk',
            sql`(${table.matchType} = 'keyword' and ${table.keyword} is not null) or (${table.matchType} <> 'keyword' and ${table.keyword} is null)`,
        ),
        check(
            'game_rooms_cpu_level_match_type_chk',
            sql`(${table.matchType} = 'cpu' and ${table.cpuLevel} is not null) or (${table.matchType} <> 'cpu' and ${table.cpuLevel} is null)`,
        ),
    ],
);

export const gameSessions = pgTable(
    'game_sessions',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        roomId: uuid('room_id')
            .notNull()
            .references(() => gameRooms.id, { onDelete: 'restrict' }),
        player1Id: uuid('player1_id')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),
        player2Id: uuid('player2_id').references(() => users.id, {
            onDelete: 'restrict',
        }),
        isCpuGame: boolean('is_cpu_game').notNull().default(false),
        cpuLevel: cpuLevelEnum('cpu_level'),
        winnerId: uuid('winner_id').references(() => users.id, {
            onDelete: 'restrict',
        }),
        status: gameSessionStatusEnum('status').notNull().default('playing'),
        startedAt: timestamp('started_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        finishedAt: timestamp('finished_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex('game_sessions_room_uq').on(table.roomId),
        check(
            'game_sessions_winner_member_chk',
            sql`${table.winnerId} is null or ${table.winnerId} = ${table.player1Id} or ${table.winnerId} = ${table.player2Id}`,
        ),
        check(
            'game_sessions_cpu_player2_chk',
            sql`(${table.isCpuGame} = true and ${table.player2Id} is null) or (${table.isCpuGame} = false)`,
        ),
        check(
            'game_sessions_finished_winner_chk',
            sql`${table.finishedAt} is null or ${table.winnerId} is not null`,
        ),
    ],
);

export const matchRecords = pgTable(
    'match_records',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        sessionId: uuid('session_id')
            .notNull()
            .references(() => gameSessions.id, { onDelete: 'restrict' }),
        player1Id: uuid('player1_id')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),
        player2Id: uuid('player2_id').references(() => users.id, {
            onDelete: 'restrict',
        }),
        winnerId: uuid('winner_id')
            .notNull()
            .references(() => users.id, { onDelete: 'restrict' }),
        isCpuGame: boolean('is_cpu_game').notNull().default(false),
        playedAt: timestamp('played_at', { withTimezone: true }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [uniqueIndex('match_records_session_uq').on(table.sessionId)],
);

export const userStats = pgTable(
    'user_stats',
    {
        userId: uuid('user_id')
            .primaryKey()
            .references(() => users.id, { onDelete: 'cascade' }),
        wins: integer('wins').notNull().default(0),
        losses: integer('losses').notNull().default(0),
        rating: integer('rating').notNull().default(1000),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        check('user_stats_wins_non_negative_chk', sql`${table.wins} >= 0`),
        check('user_stats_losses_non_negative_chk', sql`${table.losses} >= 0`),
        check('user_stats_rating_non_negative_chk', sql`${table.rating} >= 0`),
    ],
);

export const usersRelations = relations(users, ({ many, one }) => ({
    oauthAccounts: many(oauthAccounts),
    sentFriendRequests: many(friendRequests, {
        relationName: 'friend_requests_sender',
    }),
    receivedFriendRequests: many(friendRequests, {
        relationName: 'friend_requests_receiver',
    }),
    friendships: many(friendships, { relationName: 'friendships_user' }),
    friendOf: many(friendships, { relationName: 'friendships_friend' }),
    hostedRooms: many(gameRooms, { relationName: 'game_rooms_host' }),
    joinedRooms: many(gameRooms, { relationName: 'game_rooms_guest' }),
    gameSessionsAsPlayer1: many(gameSessions, {
        relationName: 'game_sessions_player1',
    }),
    gameSessionsAsPlayer2: many(gameSessions, {
        relationName: 'game_sessions_player2',
    }),
    wonGameSessions: many(gameSessions, {
        relationName: 'game_sessions_winner',
    }),
    matchRecordsAsPlayer1: many(matchRecords, {
        relationName: 'match_records_player1',
    }),
    matchRecordsAsPlayer2: many(matchRecords, {
        relationName: 'match_records_player2',
    }),
    wonMatchRecords: many(matchRecords, {
        relationName: 'match_records_winner',
    }),
    stats: one(userStats, {
        fields: [users.id],
        references: [userStats.userId],
    }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
    user: one(users, {
        fields: [oauthAccounts.userId],
        references: [users.id],
    }),
}));

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
    sender: one(users, {
        relationName: 'friend_requests_sender',
        fields: [friendRequests.senderId],
        references: [users.id],
    }),
    receiver: one(users, {
        relationName: 'friend_requests_receiver',
        fields: [friendRequests.receiverId],
        references: [users.id],
    }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
    user: one(users, {
        relationName: 'friendships_user',
        fields: [friendships.userId],
        references: [users.id],
    }),
    friend: one(users, {
        relationName: 'friendships_friend',
        fields: [friendships.friendId],
        references: [users.id],
    }),
}));

export const gameRoomsRelations = relations(gameRooms, ({ one }) => ({
    host: one(users, {
        relationName: 'game_rooms_host',
        fields: [gameRooms.hostId],
        references: [users.id],
    }),
    guest: one(users, {
        relationName: 'game_rooms_guest',
        fields: [gameRooms.guestId],
        references: [users.id],
    }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
    room: one(gameRooms, {
        fields: [gameSessions.roomId],
        references: [gameRooms.id],
    }),
    player1: one(users, {
        relationName: 'game_sessions_player1',
        fields: [gameSessions.player1Id],
        references: [users.id],
    }),
    player2: one(users, {
        relationName: 'game_sessions_player2',
        fields: [gameSessions.player2Id],
        references: [users.id],
    }),
    winner: one(users, {
        relationName: 'game_sessions_winner',
        fields: [gameSessions.winnerId],
        references: [users.id],
    }),
}));

export const matchRecordsRelations = relations(matchRecords, ({ one }) => ({
    session: one(gameSessions, {
        fields: [matchRecords.sessionId],
        references: [gameSessions.id],
    }),
    player1: one(users, {
        relationName: 'match_records_player1',
        fields: [matchRecords.player1Id],
        references: [users.id],
    }),
    player2: one(users, {
        relationName: 'match_records_player2',
        fields: [matchRecords.player2Id],
        references: [users.id],
    }),
    winner: one(users, {
        relationName: 'match_records_winner',
        fields: [matchRecords.winnerId],
        references: [users.id],
    }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
    user: one(users, {
        fields: [userStats.userId],
        references: [users.id],
    }),
}));
