// V2 — Web Push reminders: the morning ritual and the evening review, never more than two a day.
// Keys come from .env (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT); without them, push is off.
import webpush from 'web-push';
import { and, eq } from 'drizzle-orm';
import { timeOfDay, today } from '../dates';
import type { Db } from './db/client';
import { eveningReviews, pushLog, pushSubscriptions, users } from './db/schema';
import { DEFAULT_SETTINGS } from './seed';

export type Reminder = 'morning' | 'evening';

// Neutral texts: no personal data leaves the server.
const MESSAGES: Record<Reminder, { title: string; body: string; url: string }> = {
	morning: { title: 'Le Dojo', body: 'Le mantra du jour m’attend.', url: '/' },
	evening: { title: 'Le Dojo', body: 'Mon bilan du soir m’attend.', url: '/bilan' }
};

export function vapidPublicKey(): string | null {
	return process.env.VAPID_PUBLIC_KEY || null;
}

function configured(): boolean {
	const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
	if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
	webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:dojo@localhost', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
	return true;
}

export type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

export function saveSubscription(db: Db, userId: number, sub: SubscriptionInput): void {
	db.insert(pushSubscriptions)
		.values({ userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
		.onConflictDoUpdate({
			target: pushSubscriptions.endpoint,
			set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth }
		})
		.run();
}

export function removeSubscription(db: Db, userId: number, endpoint: string): void {
	db.delete(pushSubscriptions)
		.where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))
		.run();
}

export function subscriptionCount(db: Db, userId: number): number {
	return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)).all().length;
}

/** Sends to every device of the user. Dead subscriptions are removed. Returns how many got it. */
export async function sendToUser(
	db: Db,
	userId: number,
	message: { title: string; body: string; url: string }
): Promise<number> {
	if (!configured()) return 0;
	const subs = db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)).all();
	let sent = 0;
	for (const s of subs) {
		try {
			await webpush.sendNotification(
				{ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
				JSON.stringify(message),
				{ TTL: 3600, urgency: 'normal' }
			);
			sent++;
		} catch (e) {
			const status = (e as { statusCode?: number }).statusCode;
			if (status === 404 || status === 410) db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, s.id)).run();
			else console.error('Push : envoi impossible', status ?? e);
		}
	}
	return sent;
}

/** Which reminders are due now (pure, testable). */
export function dueReminders(
	settings: typeof DEFAULT_SETTINGS,
	time: string,
	alreadySent: ReadonlySet<Reminder>,
	reviewDone: boolean
): Reminder[] {
	const due: Reminder[] = [];
	const morningUntil = settings.ritual_morning_until ?? '08:00';
	if (
		settings.notify_morning &&
		!alreadySent.has('morning') &&
		time >= settings.ritual_morning_time &&
		time < morningUntil
	)
		due.push('morning');
	if (
		settings.notify_evening &&
		!alreadySent.has('evening') &&
		!reviewDone &&
		time >= settings.ritual_evening_start &&
		time < settings.ritual_evening_end
	)
		due.push('evening');
	return due;
}

/** One pass of the scheduler. The log is written first: a restart never sends twice. */
export async function runReminders(db: Db, now = new Date()): Promise<void> {
	if (!configured()) return;
	const day = today(now);
	const time = timeOfDay(now);
	for (const user of db.select().from(users).all()) {
		const settings = { ...DEFAULT_SETTINGS, ...user.settings };
		if (!settings.notify_morning && !settings.notify_evening) continue;
		if (subscriptionCount(db, user.id) === 0) continue;
		const sent = new Set(
			db
				.select({ kind: pushLog.kind })
				.from(pushLog)
				.where(and(eq(pushLog.userId, user.id), eq(pushLog.day, day)))
				.all()
				.map((r) => r.kind)
		);
		const reviewDone = !!db
			.select({ id: eveningReviews.id })
			.from(eveningReviews)
			.where(and(eq(eveningReviews.userId, user.id), eq(eveningReviews.day, day)))
			.get();
		for (const kind of dueReminders(settings, time, sent, reviewDone)) {
			const claimed = db.insert(pushLog).values({ userId: user.id, day, kind }).onConflictDoNothing().run();
			if (claimed.changes > 0) await sendToUser(db, user.id, MESSAGES[kind]);
		}
	}
}

let started = false;

/** Starts the minute-by-minute scheduler (once per process). */
export function startReminderScheduler(db: Db): void {
	if (started || !configured()) return;
	started = true;
	setInterval(() => {
		runReminders(db).catch((e) => console.error('Rappels :', e));
	}, 60_000).unref();
	console.log('Rappels Web Push actifs.');
}

export function testMessage() {
	return { title: 'Le Dojo', body: 'Les rappels fonctionnent sur cet appareil.', url: '/moi' };
}

export function generateVapidKeys() {
	return webpush.generateVAPIDKeys();
}
