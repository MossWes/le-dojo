import { and, eq, inArray } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './db/client';
import { ContentFormatError, parseContentFile } from './content-format';
import {
	fronts,
	missions,
	phases,
	quests,
	readings,
	seedLog,
	users,
	type Milestone,
	type MissionStatus,
	type Rank,
	type UserSettings
} from './db/schema';

export const DEFAULT_SETTINGS: UserSettings = {
	timezone: 'Europe/Paris',
	ritual_morning_time: '03:30',
	ritual_morning_mode: 'mantra_only',
	ritual_morning_until: '08:00',
	ritual_evening_start: '20:00',
	ritual_evening_end: '22:30',
	voice_name: null,
	voice_rate: 0.95,
	steps_goal: 8000,
	notify_morning: false,
	notify_evening: false
};

export type SeedReport = Record<string, { created: number; updated: number; kept: number }>;

type SeedFront = { slug: string; name: string; description?: string; status: 'active' | 'reserve'; sort_order: number };
type SeedMission = {
	slug: string;
	title: string;
	rank: Rank;
	front: string | null;
	status: MissionStatus;
	due_date: string | null;
	planned_date: string | null;
	notes?: string;
	start_condition?: string;
};
type SeedQuest = {
	slug: string;
	title: string;
	kind: 'daily_hold' | 'daily_steps';
	start_date: string;
	length_days: number | null;
	xp_per_day: number;
	milestones: Milestone[];
	status: 'active' | 'done' | 'archived';
};

const readJson = (dir: string, file: string): unknown =>
	JSON.parse(readFileSync(join(dir, file), 'utf8'));

/** First user, created without password if missing (the password comes from create-user). */
export function ensureUser(db: Db): number {
	const existing = db.select({ id: users.id }).from(users).orderBy(users.id).get();
	if (existing) return existing.id;
	return db
		.insert(users)
		.values({ name: 'Wesley', passwordHash: null, settings: DEFAULT_SETTINGS })
		.returning({ id: users.id })
		.get().id;
}

/**
 * Upserts phases and readings by slug. Library content is managed through files,
 * so a new version of a file replaces the text. Nothing else is touched.
 */
export function importContent(db: Db, data: unknown) {
	const content = parseContentFile(data);
	return db.transaction((tx) => {
		const known = new Set(tx.select({ slug: phases.slug }).from(phases).all().map((p) => p.slug));
		content.phases.forEach((p) => known.add(p.slug));
		const missing = content.readings.filter((r) => r.phaseSlug && !known.has(r.phaseSlug));
		if (missing.length)
			throw new ContentFormatError(
				missing.map((r) => `lecture « ${r.slug} » : phase « ${r.phaseSlug} » inconnue`)
			);

		const report = { phases: { created: 0, updated: 0, kept: 0 }, readings: { created: 0, updated: 0, kept: 0 } };
		const existingPhases = new Set(tx.select({ slug: phases.slug }).from(phases).all().map((p) => p.slug));
		for (const p of content.phases) {
			const { slug, ...rest } = p;
			tx.insert(phases).values(p).onConflictDoUpdate({ target: phases.slug, set: rest }).run();
			report.phases[existingPhases.has(slug) ? 'updated' : 'created']++;
		}
		const existingReadings = new Set(
			tx.select({ slug: readings.slug }).from(readings).all().map((r) => r.slug)
		);
		for (const r of content.readings) {
			const { slug, ...rest } = r;
			tx.insert(readings).values(r).onConflictDoUpdate({ target: readings.slug, set: rest }).run();
			report.readings[existingReadings.has(slug) ? 'updated' : 'created']++;
		}
		return report;
	});
}

/**
 * Idempotent seed. Fronts, missions and quests are created once: if I change or delete
 * them in the app, a new run leaves them alone (tracked in seed_log).
 */
export function runSeed(db: Db, seedDir: string): SeedReport {
	const userId = ensureUser(db);
	const frontsFile = readJson(seedDir, 'fronts.json') as { fronts: SeedFront[] };
	const missionsFile = readJson(seedDir, 'missions.json') as { missions: SeedMission[] };
	const questsFile = readJson(seedDir, 'quests.json') as { quests: SeedQuest[] };
	const phasesFile = readJson(seedDir, 'phases.json') as { phases: unknown[] };
	const readingsFile = readJson(seedDir, 'readings.json') as { format_version: number; readings: unknown[] };

	const content = importContent(db, {
		format_version: 1,
		phases: phasesFile.phases,
		readings: readingsFile.readings
	});

	return db.transaction((tx) => {
		const report: SeedReport = { ...content };

		const alreadySeeded = (entity: string, slugs: string[]) =>
			new Set(
				tx
					.select({ slug: seedLog.slug })
					.from(seedLog)
					.where(and(eq(seedLog.entity, entity), inArray(seedLog.slug, slugs)))
					.all()
					.map((r) => r.slug)
			);
		const once = <T extends { slug: string }>(entity: string, items: T[], insert: (item: T) => void) => {
			const done = alreadySeeded(entity, items.map((i) => i.slug));
			const r = { created: 0, updated: 0, kept: 0 };
			for (const item of items) {
				if (done.has(item.slug)) {
					r.kept++;
					continue;
				}
				insert(item);
				tx.insert(seedLog).values({ entity, slug: item.slug }).run();
				r.created++;
			}
			report[entity] = r;
		};

		once('fronts', frontsFile.fronts, (f) =>
			tx
				.insert(fronts)
				.values({
					userId,
					slug: f.slug,
					name: f.name,
					description: f.description ?? '',
					status: f.status,
					sortOrder: f.sort_order
				})
				.onConflictDoNothing()
				.run()
		);

		const frontIds = new Map(
			tx
				.select({ id: fronts.id, slug: fronts.slug })
				.from(fronts)
				.where(eq(fronts.userId, userId))
				.all()
				.map((f) => [f.slug, f.id])
		);

		once('missions', missionsFile.missions, (m) =>
			tx
				.insert(missions)
				.values({
					userId,
					slug: m.slug,
					title: m.title,
					rank: m.rank,
					notes: m.notes ?? '',
					frontId: m.front ? (frontIds.get(m.front) ?? null) : null,
					status: m.status,
					dueDate: m.due_date,
					plannedDate: m.planned_date,
					startCondition: m.start_condition ?? null,
					source: 'seed'
				})
				.onConflictDoNothing()
				.run()
		);

		once('quests', questsFile.quests, (q) =>
			tx
				.insert(quests)
				.values({
					userId,
					slug: q.slug,
					title: q.title,
					kind: q.kind,
					startDate: q.start_date,
					lengthDays: q.length_days,
					milestones: q.milestones,
					xpPerDay: q.xp_per_day,
					status: q.status
				})
				.onConflictDoNothing()
				.run()
		);

		return report;
	});
}
