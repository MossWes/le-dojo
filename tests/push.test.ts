import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const sendNotification = vi.fn(async () => ({ statusCode: 201 }));
vi.mock('web-push', () => ({
	default: { setVapidDetails: vi.fn(), sendNotification, generateVAPIDKeys: () => ({ publicKey: 'p', privateKey: 'k' }) }
}));

const { dueReminders, runReminders, saveSubscription } = await import('../src/lib/server/push');
const { DEFAULT_SETTINGS } = await import('../src/lib/server/seed');
const { updateSettings } = await import('../src/lib/server/services/settings');
const { saveReview } = await import('../src/lib/server/services/reviews');
const { seededDb } = await import('./helpers');

const on = { ...DEFAULT_SETTINGS, notify_morning: true, notify_evening: true };
// Paris is UTC+1 in November.
const at = (hhmm: string) => new Date(`2026-11-02T${String(Number(hhmm.slice(0, 2)) - 1).padStart(2, '0')}:${hhmm.slice(3)}:00Z`);

beforeAll(() => {
	process.env.VAPID_PUBLIC_KEY = 'test-public';
	process.env.VAPID_PRIVATE_KEY = 'test-private';
});
afterAll(() => {
	delete process.env.VAPID_PUBLIC_KEY;
	delete process.env.VAPID_PRIVATE_KEY;
});

describe('which reminders are due', () => {
	it('follows the ritual hours and the switches', () => {
		expect(dueReminders(on, '03:29', new Set(), false)).toEqual([]);
		expect(dueReminders(on, '03:30', new Set(), false)).toEqual(['morning']);
		expect(dueReminders(on, '08:00', new Set(), false)).toEqual([]);
		expect(dueReminders(on, '20:00', new Set(), false)).toEqual(['evening']);
		expect(dueReminders(on, '22:30', new Set(), false)).toEqual([]);
		expect(dueReminders(on, '20:05', new Set(['evening']), false)).toEqual([]);
		expect(dueReminders(on, '20:05', new Set(), true)).toEqual([]);
		expect(dueReminders(DEFAULT_SETTINGS, '03:30', new Set(), false)).toEqual([]);
	});
});

describe('scheduler', () => {
	it('sends at most two reminders a day, once each', async () => {
		const { db, userId } = seededDb();
		updateSettings(db, userId, { notify_morning: true, notify_evening: true });
		saveSubscription(db, userId, { endpoint: 'https://push.example/abc', keys: { p256dh: 'x', auth: 'y' } });
		sendNotification.mockClear();
		for (const t of ['03:30', '03:31', '05:00', '12:00', '20:00', '20:01', '21:00', '22:00']) await runReminders(db, at(t));
		expect(sendNotification).toHaveBeenCalledTimes(2);
		const bodies = sendNotification.mock.calls.map((c) => JSON.parse((c as unknown[])[1] as string).body);
		expect(bodies).toEqual(['Le mantra du jour m’attend.', 'Mon bilan du soir m’attend.']);
	});

	it('skips the evening reminder when the review is already written', async () => {
		const { db, userId } = seededDb();
		updateSettings(db, userId, { notify_evening: true });
		saveSubscription(db, userId, { endpoint: 'https://push.example/def', keys: { p256dh: 'x', auth: 'y' } });
		saveReview(db, userId, '2026-11-02', { didWell: 'Fait', missedPrinciple: '', fixTomorrow: '', keptWord: 'oui', energy: null }, '2026-11-02');
		sendNotification.mockClear();
		await runReminders(db, at('20:30'));
		expect(sendNotification).not.toHaveBeenCalled();
	});

	it('sends nothing without a device', async () => {
		const { db, userId } = seededDb();
		updateSettings(db, userId, { notify_morning: true });
		sendNotification.mockClear();
		await runReminders(db, at('04:00'));
		expect(sendNotification).not.toHaveBeenCalled();
	});
});
