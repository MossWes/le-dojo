import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Shared columns: every table carries id, created_at, updated_at (annexe 1).
const timestamps = {
	createdAt: text('created_at')
		.notNull()
		.default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
};

export type UserSettings = {
	timezone: 'Europe/Paris';
	ritual_morning_time: string;
	ritual_morning_mode: 'mantra_only' | 'full';
	ritual_evening_start: string;
	ritual_evening_end: string;
	voice_name: string | null;
	voice_rate: number;
	steps_goal: number;
};

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	passwordHash: text('password_hash').notNull(),
	settings: text('settings', { mode: 'json' }).$type<UserSettings>().notNull(),
	...timestamps
});
