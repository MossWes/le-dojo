import { and, desc, eq } from 'drizzle-orm';
import { dailyRotation } from '../../daily-reading';
import { nowIso, type Day } from '../../dates';
import type { Db } from '../db/client';
import { phases, readingViews, readings } from '../db/schema';
import { NotFoundError } from './errors';
import { createMission, type Mission } from './missions';
import { recordRitual } from './rituals';

export type Reading = typeof readings.$inferSelect;

export type ReadingOfDay = {
	reading: Reading;
	phaseNeedsUpdate: boolean;
	position: number;
	count: number;
};

function rotation(db: Db, day: Day) {
	return dailyRotation(day, db.select().from(phases).all(), db.select().from(readings).all());
}

function lastViewed(db: Db, userId: number, day: Day): number | null {
	const view = db
		.select({ readingId: readingViews.readingId })
		.from(readingViews)
		.where(and(eq(readingViews.userId, userId), eq(readingViews.day, day)))
		.orderBy(desc(readingViews.updatedAt), desc(readingViews.id))
		.get();
	return view?.readingId ?? null;
}

/** The reading shown today: the day's one, or the last one I moved to with "Lecture suivante". */
export function readingOfDay(db: Db, userId: number, day: Day): ReadingOfDay | null {
	const rot = rotation(db, day);
	if (!rot) return null;
	const viewedId = lastViewed(db, userId, day);
	const viewedIndex = rot.list.findIndex((r) => r.id === viewedId);
	const index = viewedIndex >= 0 ? viewedIndex : rot.baseIndex;
	return {
		reading: rot.list[index]!,
		phaseNeedsUpdate: rot.phaseNeedsUpdate,
		position: index + 1,
		count: rot.list.length
	};
}

function touchView(db: Db, userId: number, readingId: number, day: Day, listened: boolean) {
	db.insert(readingViews)
		.values({ userId, readingId, day, listened })
		.onConflictDoUpdate({
			target: [readingViews.userId, readingViews.day, readingViews.readingId],
			set: listened ? { listened: true, updatedAt: nowIso() } : { updatedAt: nowIso() }
		})
		.run();
}

/** "Lecture suivante": moves to the next reading of the phase. Earns no XP. */
export function nextReading(db: Db, userId: number, day: Day): ReadingOfDay | null {
	const current = readingOfDay(db, userId, day);
	const rot = rotation(db, day);
	if (!current || !rot) return null;
	const next = rot.list[current.position % rot.list.length]!;
	db.transaction(() => touchView(db, userId, next.id, day, false));
	return readingOfDay(db, userId, day);
}

/** The reading was read (10 seconds open) or listened to: validates the daily ritual once. */
export function markReadingSeen(
	db: Db,
	userId: number,
	readingId: number,
	day: Day,
	listened: boolean
): { xpGranted: boolean } {
	return db.transaction(() => {
		const exists = db.select({ id: readings.id }).from(readings).where(eq(readings.id, readingId)).get();
		if (!exists) throw new NotFoundError('Lecture');
		touchView(db, userId, readingId, day, listened);
		return { xpGranted: recordRitual(db, userId, 'reading', day) };
	});
}

/** The reading's action of the day becomes a rank D mission planned today. */
export function readingToMission(db: Db, userId: number, readingId: number, day: Day): Mission {
	const reading = db.select().from(readings).where(eq(readings.id, readingId)).get();
	if (!reading) throw new NotFoundError('Lecture');
	return createMission(
		db,
		userId,
		{
			title: reading.action,
			rank: 'D',
			plannedDate: day,
			source: 'reading',
			notes: `Lecture : ${reading.title}`
		},
		day
	);
}
