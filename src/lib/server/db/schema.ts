import { sql } from 'drizzle-orm';
import {
	check,
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex,
	type AnySQLiteColumn
} from 'drizzle-orm/sqlite-core';

// Schema of annexe 1. Days are 'YYYY-MM-DD' strings (Europe/Paris), timestamps ISO 8601 UTC.

const nowSql = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

const timestamps = {
	createdAt: text('created_at').notNull().default(nowSql),
	updatedAt: text('updated_at')
		.notNull()
		.default(nowSql)
		.$onUpdate(() => new Date().toISOString())
};

const id = integer('id').primaryKey({ autoIncrement: true });
const userId = () =>
	integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' });

export const RANKS = ['S', 'A', 'B', 'C', 'D'] as const;
export type Rank = (typeof RANKS)[number];
export const MISSION_STATUSES = ['todo', 'doing', 'done', 'dropped', 'reserve'] as const;
export type MissionStatus = (typeof MISSION_STATUSES)[number];
export const RITUALS = ['reading', 'oath', 'evening_review'] as const;
export type Ritual = (typeof RITUALS)[number];
export const PILLARS = ['musashi', 'tolteques', 'sun-tzu', 'stoicisme', 'bushido'] as const;
export const SITUATIONS = [
	'colere',
	'doute',
	'fatigue',
	'peur-echec',
	'famille',
	'tentation',
	'attente'
] as const;
export type Situation = (typeof SITUATIONS)[number];
export const SYMBOLS = [
	'fawohodie',
	'asase-ye-duru',
	'nkyinkyim',
	'mframadan',
	'hye-won-hye',
	'sankofa-two'
] as const;

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

export type Milestone = { day: number; xp: number };

const inList = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(', '));

export const users = sqliteTable('users', {
	id,
	name: text('name').notNull(),
	// Null until the password is set with the create-user command (step 7).
	passwordHash: text('password_hash'),
	settings: text('settings', { mode: 'json' }).$type<UserSettings>().notNull(),
	...timestamps
});

export const fronts = sqliteTable(
	'fronts',
	{
		id,
		userId: userId(),
		slug: text('slug').notNull(),
		name: text('name').notNull(),
		description: text('description').notNull().default(''),
		status: text('status', { enum: ['active', 'reserve'] }).notNull().default('active'),
		sortOrder: integer('sort_order').notNull().default(0),
		...timestamps
	},
	(t) => [
		uniqueIndex('fronts_user_slug').on(t.userId, t.slug),
		check('fronts_status', sql`${t.status} in ('active', 'reserve')`)
	]
);

export const missions = sqliteTable(
	'missions',
	{
		id,
		userId: userId(),
		slug: text('slug'),
		title: text('title').notNull(),
		notes: text('notes').notNull().default(''),
		rank: text('rank', { enum: RANKS }).notNull(),
		frontId: integer('front_id').references(() => fronts.id, { onDelete: 'set null' }),
		status: text('status', { enum: MISSION_STATUSES }).notNull().default('todo'),
		dueDate: text('due_date'),
		plannedDate: text('planned_date'),
		startCondition: text('start_condition'),
		isTest: integer('is_test', { mode: 'boolean' }).notNull().default(false),
		reviewDate: text('review_date'),
		parentId: integer('parent_id').references((): AnySQLiteColumn => missions.id, {
			onDelete: 'cascade'
		}),
		doneAt: text('done_at'),
		source: text('source', { enum: ['manual', 'seed', 'reading'] }).notNull().default('manual'),
		...timestamps
	},
	(t) => [
		uniqueIndex('missions_user_slug').on(t.userId, t.slug),
		// S lock, enforced by the database itself: at most one active S mission per user.
		uniqueIndex('missions_single_active_s')
			.on(t.userId)
			.where(sql`${t.rank} = 'S' and ${t.status} in ('todo', 'doing')`),
		index('missions_user_status').on(t.userId, t.status),
		check('missions_rank', sql`${t.rank} in (${inList(RANKS)})`),
		check('missions_status', sql`${t.status} in (${inList(MISSION_STATUSES)})`),
		check('missions_source', sql`${t.source} in ('manual', 'seed', 'reading')`),
		check(
			'missions_reserve_condition',
			sql`${t.status} <> 'reserve' or length(trim(coalesce(${t.startCondition}, ''))) > 0`
		),
		check('missions_test_review', sql`${t.isTest} = 0 or ${t.reviewDate} is not null`)
	]
);

export const xpEvents = sqliteTable(
	'xp_events',
	{
		id,
		userId: userId(),
		day: text('day').notNull(),
		kind: text('kind', { enum: ['mission', 'ritual', 'quest_day', 'quest_milestone'] }).notNull(),
		refType: text('ref_type'),
		refId: integer('ref_id'),
		ritual: text('ritual', { enum: RITUALS }),
		amount: integer('amount').notNull(),
		revokedAt: text('revoked_at'),
		...timestamps
	},
	(t) => [
		check('xp_amount_positive', sql`${t.amount} > 0`),
		check(
			'xp_kind',
			sql`${t.kind} in ('mission', 'ritual', 'quest_day', 'quest_milestone')`
		),
		check(
			'xp_ritual',
			sql`(${t.kind} = 'ritual') = (${t.ritual} is not null) and (${t.ritual} is null or ${t.ritual} in (${inList(RITUALS)}))`
		),
		// One active event per ritual per day.
		uniqueIndex('xp_unique_ritual')
			.on(t.userId, t.ritual, t.day)
			.where(sql`${t.kind} = 'ritual' and ${t.revokedAt} is null`),
		// One active event per quest day, and one per milestone.
		uniqueIndex('xp_unique_quest')
			.on(t.userId, t.kind, t.refType, t.refId, t.day)
			.where(sql`${t.kind} in ('quest_day', 'quest_milestone') and ${t.revokedAt} is null`),
		// One active event per mission.
		uniqueIndex('xp_unique_mission')
			.on(t.userId, t.refType, t.refId)
			.where(sql`${t.kind} = 'mission' and ${t.revokedAt} is null`),
		index('xp_user_day').on(t.userId, t.day)
	]
);

export const quests = sqliteTable(
	'quests',
	{
		id,
		userId: userId(),
		slug: text('slug').notNull(),
		title: text('title').notNull(),
		kind: text('kind', { enum: ['daily_hold', 'daily_steps'] }).notNull(),
		startDate: text('start_date').notNull(),
		lengthDays: integer('length_days'),
		milestones: text('milestones', { mode: 'json' }).$type<Milestone[]>().notNull(),
		xpPerDay: integer('xp_per_day').notNull(),
		status: text('status', { enum: ['active', 'done', 'archived'] }).notNull().default('active'),
		...timestamps
	},
	(t) => [
		uniqueIndex('quests_user_slug').on(t.userId, t.slug),
		check('quests_kind', sql`${t.kind} in ('daily_hold', 'daily_steps')`),
		check('quests_status', sql`${t.status} in ('active', 'done', 'archived')`),
		check('quests_length', sql`${t.lengthDays} is null or ${t.lengthDays} > 0`)
	]
);

export const questLogs = sqliteTable(
	'quest_logs',
	{
		id,
		userId: userId(),
		questId: integer('quest_id')
			.notNull()
			.references(() => quests.id, { onDelete: 'cascade' }),
		day: text('day').notNull(),
		status: text('status', { enum: ['held', 'slip', 'logged'] }).notNull(),
		value: integer('value'),
		note: text('note'),
		...timestamps
	},
	(t) => [
		uniqueIndex('quest_logs_quest_day').on(t.questId, t.day),
		check('quest_logs_status', sql`${t.status} in ('held', 'slip', 'logged')`)
	]
);

// Phases and readings are library content, shared by every profile.
export const phases = sqliteTable(
	'phases',
	{
		id,
		slug: text('slug').notNull().unique(),
		name: text('name').notNull(),
		startDate: text('start_date').notNull(),
		endDate: text('end_date').notNull(),
		description: text('description').notNull().default(''),
		...timestamps
	},
	(t) => [check('phases_dates', sql`${t.startDate} <= ${t.endDate}`)]
);

export const readings = sqliteTable(
	'readings',
	{
		id,
		slug: text('slug').notNull().unique(),
		group: text('group', { enum: ['phase', 'secours'] }).notNull(),
		phaseSlug: text('phase_slug').references(() => phases.slug, { onUpdate: 'cascade' }),
		situations: text('situations', { mode: 'json' }).$type<Situation[]>().notNull(),
		order: integer('order'),
		pillar: text('pillar', { enum: PILLARS }).notNull(),
		source: text('source').notNull(),
		quote: text('quote'),
		quoteKind: text('quote_kind', { enum: ['citation', 'reformulation'] }).notNull(),
		title: text('title').notNull(),
		body: text('body').notNull(),
		mantra: text('mantra').notNull(),
		action: text('action').notNull(),
		eveningQuestion: text('evening_question').notNull(),
		symbol: text('symbol', { enum: SYMBOLS }).notNull(),
		...timestamps
	},
	(t) => [
		check('readings_group', sql`${t.group} in ('phase', 'secours')`),
		check(
			'readings_phase',
			sql`(${t.group} = 'phase') = (${t.phaseSlug} is not null and ${t.order} is not null)`
		),
		index('readings_phase_order').on(t.phaseSlug, t.order)
	]
);

export const readingViews = sqliteTable(
	'reading_views',
	{
		id,
		userId: userId(),
		day: text('day').notNull(),
		readingId: integer('reading_id')
			.notNull()
			.references(() => readings.id, { onDelete: 'cascade' }),
		listened: integer('listened', { mode: 'boolean' }).notNull().default(false),
		...timestamps
	},
	(t) => [uniqueIndex('reading_views_user_day_reading').on(t.userId, t.day, t.readingId)]
);

export const eveningReviews = sqliteTable(
	'evening_reviews',
	{
		id,
		userId: userId(),
		day: text('day').notNull(),
		didWell: text('did_well').notNull().default(''),
		missedPrinciple: text('missed_principle').notNull().default(''),
		fixTomorrow: text('fix_tomorrow').notNull().default(''),
		keptWord: text('kept_word', { enum: ['oui', 'en_partie', 'non'] }),
		energy: integer('energy'),
		...timestamps
	},
	(t) => [
		uniqueIndex('evening_reviews_user_day').on(t.userId, t.day),
		check(
			'evening_reviews_kept_word',
			sql`${t.keptWord} is null or ${t.keptWord} in ('oui', 'en_partie', 'non')`
		),
		check('evening_reviews_energy', sql`${t.energy} is null or ${t.energy} between 1 and 5`)
	]
);

export const oathLogs = sqliteTable(
	'oath_logs',
	{
		id,
		userId: userId(),
		day: text('day').notNull(),
		...timestamps
	},
	(t) => [uniqueIndex('oath_logs_user_day').on(t.userId, t.day)]
);

// Remembers what the seed already created, so a re-run never recreates
// something I deleted or changed in the app.
export const seedLog = sqliteTable(
	'seed_log',
	{
		entity: text('entity').notNull(),
		slug: text('slug').notNull(),
		appliedAt: text('applied_at').notNull().default(nowSql)
	},
	(t) => [primaryKey({ columns: [t.entity, t.slug] })]
);
