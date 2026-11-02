import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { sessions, users } from '../src/lib/server/db/schema';
import {
	LoginThrottle,
	checkLogin,
	createSession,
	deleteSession,
	setPassword,
	validateSession
} from '../src/lib/server/auth-core';
import { seededDb } from './helpers';

const PASSWORD = 'une phrase de passe longue';
const DAY = 86_400_000;

describe('password', () => {
	it('is stored as an argon2id hash and checked', async () => {
		const { db } = seededDb();
		expect(await checkLogin(db, PASSWORD)).toBeNull(); // no password yet
		await setPassword(db, PASSWORD);
		const hash = db.select().from(users).get()!.passwordHash!;
		expect(hash.startsWith('$argon2id$')).toBe(true);
		expect(hash).not.toContain(PASSWORD);
		expect(await checkLogin(db, PASSWORD)).toBe(1);
		expect(await checkLogin(db, 'autre chose ici')).toBeNull();
	});

	it('refuses short passwords', async () => {
		const { db } = seededDb();
		await expect(setPassword(db, 'court')).rejects.toThrow(/12 caractères/);
	});

	it('changing the password signs out every device', async () => {
		const { db } = seededDb();
		await setPassword(db, PASSWORD);
		const { token } = createSession(db, 1);
		await setPassword(db, 'nouvelle phrase de passe');
		expect(validateSession(db, token)).toBeNull();
	});
});

describe('sessions', () => {
	it('last 90 days, store only a hash of the token, and can be closed', () => {
		const { db } = seededDb();
		const now = new Date('2026-11-02T20:00:00Z');
		const { token, expires } = createSession(db, 1, now);
		expect(expires.getTime() - now.getTime()).toBe(90 * DAY);
		expect(db.select().from(sessions).all().some((s) => s.id === token)).toBe(false);
		expect(validateSession(db, token, now)?.userId).toBe(1);
		expect(validateSession(db, token, new Date(now.getTime() + 91 * DAY))).toBeNull();
		deleteSession(db, token);
		expect(validateSession(db, token, now)).toBeNull();
	});

	it('are extended when used after half their life', () => {
		const { db } = seededDb();
		const now = new Date('2026-11-02T20:00:00Z');
		const { token } = createSession(db, 1, now);
		const later = new Date(now.getTime() + 50 * DAY);
		const v = validateSession(db, token, later)!;
		expect(v.renewed).toBe(true);
		expect(v.expires.getTime() - later.getTime()).toBe(90 * DAY);
		expect(validateSession(db, token, new Date(now.getTime() + 120 * DAY))?.userId).toBe(1);
	});

	it('reject unknown tokens', () => {
		const { db } = seededDb();
		expect(validateSession(db, 'nimporte-quoi')).toBeNull();
		expect(validateSession(db, undefined)).toBeNull();
		expect(db.select().from(sessions).where(eq(sessions.userId, 1)).all()).toHaveLength(0);
	});
});

describe('login throttle', () => {
	it('blocks an address after 5 failures for 15 minutes', () => {
		const t = new LoginThrottle();
		const now = 1_000_000;
		for (let i = 0; i < 5; i++) t.fail('1.2.3.4', now);
		expect(t.isBlocked('1.2.3.4', now)).toBe(true);
		expect(t.isBlocked('5.6.7.8', now)).toBe(false);
		expect(t.isBlocked('1.2.3.4', now + 15 * 60_000 + 1)).toBe(false);
	});

	it('blocks everyone after 20 failures in an hour', () => {
		const t = new LoginThrottle();
		for (let i = 0; i < 20; i++) t.fail(`10.0.0.${i}`, 1000);
		expect(t.isBlocked('9.9.9.9', 1000)).toBe(true);
	});
});
