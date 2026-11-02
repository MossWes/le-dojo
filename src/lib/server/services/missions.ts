import { and, eq, inArray, isNull, ne } from 'drizzle-orm';
import { isDay, nowIso, type Day } from '../../dates';
import { XP_BY_RANK } from '../../rules';
import type { Db } from '../db/client';
import {
	MISSION_STATUSES,
	RANKS,
	fronts,
	missions,
	xpEvents,
	type MissionStatus,
	type Rank
} from '../db/schema';
import { NotFoundError, SLockError, ValidationError } from './errors';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type Mission = typeof missions.$inferSelect;

export type MissionInput = {
	title: string;
	rank: Rank;
	notes?: string;
	frontId?: number | null;
	status?: MissionStatus;
	dueDate?: Day | null;
	plannedDate?: Day | null;
	startCondition?: string | null;
	isTest?: boolean;
	reviewDate?: Day | null;
	parentId?: number | null;
	source?: 'manual' | 'seed' | 'reading';
	slug?: string | null;
};

export type MissionPatch = Partial<Omit<MissionInput, 'source' | 'slug'>>;

const ACTIVE: readonly MissionStatus[] = ['todo', 'doing'];
const isActiveS = (m: { rank: Rank; status: MissionStatus }) =>
	m.rank === 'S' && ACTIVE.includes(m.status);

function validate(tx: Tx, userId: number, m: MissionInput & { id?: number }): void {
	if (!m.title?.trim()) throw new ValidationError('title', 'Le titre est obligatoire.');
	if (!RANKS.includes(m.rank)) throw new ValidationError('rank', 'Rang inconnu.');
	if (m.status && !MISSION_STATUSES.includes(m.status))
		throw new ValidationError('status', 'Statut inconnu.');
	for (const field of ['dueDate', 'plannedDate', 'reviewDate'] as const) {
		const v = m[field];
		if (v != null && !isDay(v)) throw new ValidationError(field, 'Date invalide.');
	}
	if (m.status === 'reserve' && !m.startCondition?.trim())
		throw new ValidationError(
			'startCondition',
			'Une mission en réserve a besoin de sa condition de départ.'
		);
	if (m.isTest && !m.reviewDate)
		throw new ValidationError('reviewDate', 'Un test a besoin de sa date de bilan.');
	if (m.frontId != null) {
		const front = tx
			.select({ id: fronts.id })
			.from(fronts)
			.where(and(eq(fronts.id, m.frontId), eq(fronts.userId, userId)))
			.get();
		if (!front) throw new ValidationError('frontId', 'Front introuvable.');
	}
	if (m.parentId != null) {
		if (m.parentId === m.id)
			throw new ValidationError('parentId', 'Une mission ne peut pas être sa propre sous-mission.');
		const parent = tx
			.select({ parentId: missions.parentId })
			.from(missions)
			.where(and(eq(missions.id, m.parentId), eq(missions.userId, userId)))
			.get();
		if (!parent) throw new ValidationError('parentId', 'Mission parente introuvable.');
		if (parent.parentId !== null)
			throw new ValidationError('parentId', 'Les sous-missions ne vont que sur un niveau.');
		if (m.id !== undefined) {
			const child = tx.select({ id: missions.id }).from(missions).where(eq(missions.parentId, m.id)).get();
			if (child)
				throw new ValidationError('parentId', 'Cette mission a déjà des sous-missions.');
		}
	}
}

// S lock: checked inside the same transaction as the write (and backed by a unique index).
function assertSLock(tx: Tx, userId: number, m: { rank: Rank; status: MissionStatus }, selfId?: number) {
	if (!isActiveS(m)) return;
	const conditions = [
		eq(missions.userId, userId),
		eq(missions.rank, 'S'),
		inArray(missions.status, [...ACTIVE])
	];
	if (selfId !== undefined) conditions.push(ne(missions.id, selfId));
	const active = tx.select({ title: missions.title }).from(missions).where(and(...conditions)).get();
	if (active) throw new SLockError(active.title);
}

// Keeps the mission's XP event in line with its status: done ⇒ one active event, otherwise none.
function syncMissionXp(tx: Tx, mission: Mission, day: Day): void {
	const active = tx
		.select()
		.from(xpEvents)
		.where(
			and(
				eq(xpEvents.userId, mission.userId),
				eq(xpEvents.kind, 'mission'),
				eq(xpEvents.refType, 'mission'),
				eq(xpEvents.refId, mission.id),
				isNull(xpEvents.revokedAt)
			)
		)
		.get();
	const amount = XP_BY_RANK[mission.rank];
	const shouldHave = mission.status === 'done';

	if (active && (!shouldHave || active.amount !== amount)) {
		tx.update(xpEvents).set({ revokedAt: nowIso() }).where(eq(xpEvents.id, active.id)).run();
	}
	if (shouldHave && (!active || active.amount !== amount)) {
		tx.insert(xpEvents)
			.values({
				userId: mission.userId,
				day: active?.day ?? day,
				kind: 'mission',
				refType: 'mission',
				refId: mission.id,
				amount
			})
			.run();
	}
}

export function createMission(db: Db, userId: number, input: MissionInput, day: Day): Mission {
	return db.transaction((tx) => {
		const status = input.status ?? 'todo';
		validate(tx, userId, { ...input, status });
		assertSLock(tx, userId, { rank: input.rank, status });
		const mission = tx
			.insert(missions)
			.values({
				userId,
				title: input.title.trim(),
				rank: input.rank,
				notes: input.notes ?? '',
				frontId: input.frontId ?? null,
				status,
				dueDate: input.dueDate ?? null,
				plannedDate: input.plannedDate ?? null,
				startCondition: input.startCondition?.trim() || null,
				isTest: input.isTest ?? false,
				reviewDate: input.reviewDate ?? null,
				parentId: input.parentId ?? null,
				source: input.source ?? 'manual',
				slug: input.slug ?? null,
				doneAt: status === 'done' ? nowIso() : null
			})
			.returning()
			.get();
		syncMissionXp(tx, mission, day);
		return mission;
	});
}

export function updateMission(
	db: Db,
	userId: number,
	id: number,
	patch: MissionPatch,
	day: Day
): Mission {
	return db.transaction((tx) => {
		const current = tx
			.select()
			.from(missions)
			.where(and(eq(missions.id, id), eq(missions.userId, userId)))
			.get();
		if (!current) throw new NotFoundError('Mission');

		const next = { ...current, ...patch };
		validate(tx, userId, { ...next, id });
		assertSLock(tx, userId, next, id);

		const becameDone = next.status === 'done' && current.status !== 'done';
		const leftDone = next.status !== 'done' && current.status === 'done';
		const mission = tx
			.update(missions)
			.set({
				...patch,
				title: next.title.trim(),
				startCondition: next.startCondition?.trim() || null,
				doneAt: becameDone ? nowIso() : leftDone ? null : current.doneAt
			})
			.where(eq(missions.id, id))
			.returning()
			.get();
		syncMissionXp(tx, mission, day);
		return mission;
	});
}

// Deleting keeps the XP already earned: only unticking corrects it.
export function deleteMission(db: Db, userId: number, id: number): void {
	const result = db
		.delete(missions)
		.where(and(eq(missions.id, id), eq(missions.userId, userId)))
		.run();
	if (result.changes === 0) throw new NotFoundError('Mission');
}

export const MISSION_VIEWS = ['todo', 'reserve', 'tests', 'done'] as const;
export type MissionView = (typeof MISSION_VIEWS)[number];

export type MissionFilters = {
	view?: MissionView;
	rank?: Rank;
	frontId?: number;
};

/** Missions for the Missions screen, sorted by rank (S first), then due date. */
export function listMissions(db: Db, userId: number, filters: MissionFilters = {}): Mission[] {
	const view = filters.view ?? 'todo';
	const all = db.select().from(missions).where(eq(missions.userId, userId)).all();
	const inView = (m: Mission) => {
		switch (view) {
			case 'todo':
				return m.status === 'todo' || m.status === 'doing';
			case 'reserve':
				return m.status === 'reserve';
			case 'tests':
				return m.isTest && m.status !== 'done' && m.status !== 'dropped';
			case 'done':
				return m.status === 'done' || m.status === 'dropped';
		}
	};
	return all
		.filter(inView)
		.filter((m) => !filters.rank || m.rank === filters.rank)
		.filter((m) => !filters.frontId || m.frontId === filters.frontId)
		.sort(
			(a, b) =>
				RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank) ||
				(view === 'done'
					? (b.doneAt ?? '').localeCompare(a.doneAt ?? '')
					: (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')) ||
				a.id - b.id
		);
}

export function getMission(db: Db, userId: number, id: number): Mission {
	const m = db
		.select()
		.from(missions)
		.where(and(eq(missions.id, id), eq(missions.userId, userId)))
		.get();
	if (!m) throw new NotFoundError('Mission');
	return m;
}

export function subMissions(db: Db, userId: number, parentId: number): Mission[] {
	return db
		.select()
		.from(missions)
		.where(and(eq(missions.userId, userId), eq(missions.parentId, parentId)))
		.all()
		.sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank) || a.id - b.id);
}
