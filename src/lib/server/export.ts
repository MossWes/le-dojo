// Full export of my data (JSON) and its re-import on a fresh installation.
import { eq, sql } from 'drizzle-orm';
import type { Db } from './db/client';
import {
	eveningReviews,
	fronts,
	missions,
	oathLogs,
	phases,
	questLogs,
	quests,
	readingViews,
	readings,
	seedLog,
	users,
	xpEvents
} from './db/schema';

export const EXPORT_FORMAT = 'le-dojo-export';
export const EXPORT_VERSION = 1;

// In foreign-key order, so the import can insert them as they come.
const SHARED = { phases, readings } as const;
const PERSONAL = {
	fronts,
	missions,
	quests,
	quest_logs: questLogs,
	xp_events: xpEvents,
	reading_views: readingViews,
	evening_reviews: eveningReviews,
	oath_logs: oathLogs
} as const;

export function exportAll(db: Db, userId: number) {
	const user = db.select().from(users).where(eq(users.id, userId)).get();
	if (!user) throw new Error('Compte introuvable.');
	const mine = <T extends (typeof PERSONAL)[keyof typeof PERSONAL]>(table: T) =>
		db.select().from(table).where(eq(table.userId, userId)).orderBy(table.id).all() as T['$inferSelect'][];
	const personal = {
		fronts: mine(fronts),
		missions: mine(missions),
		quests: mine(quests),
		quest_logs: mine(questLogs),
		xp_events: mine(xpEvents),
		reading_views: mine(readingViews),
		evening_reviews: mine(eveningReviews),
		oath_logs: mine(oathLogs)
	};
	return {
		format: EXPORT_FORMAT,
		version: EXPORT_VERSION,
		exported_at: new Date().toISOString(),
		// The password is never exported: after an import, I set it again with create-user.
		user: { id: user.id, name: user.name, settings: user.settings, createdAt: user.createdAt },
		phases: db.select().from(phases).orderBy(phases.id).all(),
		readings: db.select().from(readings).orderBy(readings.id).all(),
		seed_log: db.select().from(seedLog).all(),
		...personal
	};
}

export type DojoExport = ReturnType<typeof exportAll>;

/** Re-imports an export into an EMPTY database, keeping every id. */
export function importAll(db: Db, data: unknown): Record<string, number> {
	const d = data as DojoExport;
	if (!d || d.format !== EXPORT_FORMAT || d.version !== EXPORT_VERSION)
		throw new Error('Ce fichier n’est pas un export du Dojo (format ou version inconnus).');
	const existing = db.select({ n: sql<number>`count(*)` }).from(users).get()?.n ?? 0;
	if (existing > 0) throw new Error('La base n’est pas vide : l’import se fait sur une installation neuve.');

	return db.transaction((tx) => {
		const counts: Record<string, number> = {};
		tx.insert(users)
			.values({ id: d.user.id, name: d.user.name, settings: d.user.settings, passwordHash: null, createdAt: d.user.createdAt })
			.run();
		counts.users = 1;
		// Shared content may already be there (seed): replace it by the exported version.
		tx.delete(readings).run();
		tx.delete(phases).run();
		for (const [name, table] of Object.entries(SHARED)) {
			const rows = (d as unknown as Record<string, object[]>)[name] ?? [];
			for (const row of rows) tx.insert(table).values(row as never).run();
			counts[name] = rows.length;
		}
		tx.delete(seedLog).run();
		for (const row of d.seed_log ?? []) tx.insert(seedLog).values(row).run();
		counts.seed_log = d.seed_log?.length ?? 0;
		for (const [name, table] of Object.entries(PERSONAL)) {
			const rows = (d as unknown as Record<string, object[]>)[name] ?? [];
			for (const row of rows) tx.insert(table).values(row as never).run();
			counts[name] = rows.length;
		}
		return counts;
	});
}
