// Password hashing (argon2id), sessions and login throttling. No SvelteKit import here:
// the command-line tools use it too.
import { hash, verify } from '@node-rs/argon2';
import { and, eq, gt, lt } from 'drizzle-orm';
import { createHmac, randomBytes } from 'node:crypto';
import type { Db } from './db/client';
import { sessions, users } from './db/schema';

export const SESSION_COOKIE = 'dojo_session';
export const SESSION_DAYS = 90;
const DAY_MS = 86_400_000;
const ARGON2 = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;
export const MIN_PASSWORD_LENGTH = 12;

export function hashPassword(password: string): Promise<string> {
	return hash(password, ARGON2);
}

export async function verifyPassword(stored: string | null, password: string): Promise<boolean> {
	if (!stored) return false;
	try {
		return await verify(stored, password);
	} catch {
		return false;
	}
}

function sessionSecret(): string {
	const secret = process.env.SESSION_SECRET;
	if (secret && secret.length >= 32) return secret;
	if (process.env.NODE_ENV === 'production')
		throw new Error('SESSION_SECRET manquant ou trop court (32 caractères minimum) dans .env');
	return 'dev-only-secret-not-for-production-use';
}

const tokenId = (token: string) => createHmac('sha256', sessionSecret()).update(token).digest('hex');

/** HMAC of a secret token (sessions, API tokens): the token itself is never stored. */
export const hashToken = tokenId;

export const newToken = (prefix = '') => prefix + randomBytes(32).toString('base64url');

export function createSession(db: Db, userId: number, now = new Date()): { token: string; expires: Date } {
	const token = randomBytes(32).toString('base64url');
	const expires = new Date(now.getTime() + SESSION_DAYS * DAY_MS);
	db.insert(sessions).values({ id: tokenId(token), userId, expiresAt: expires.toISOString() }).run();
	return { token, expires };
}

/** Returns the user of a valid session. Sessions used after half their life are extended. */
export function validateSession(
	db: Db,
	token: string | undefined,
	now = new Date()
): { userId: number; expires: Date; renewed: boolean } | null {
	if (!token || token.length > 100) return null;
	const id = tokenId(token);
	const row = db
		.select()
		.from(sessions)
		.where(and(eq(sessions.id, id), gt(sessions.expiresAt, now.toISOString())))
		.get();
	if (!row) return null;
	let expires = new Date(row.expiresAt);
	let renewed = false;
	if (expires.getTime() - now.getTime() < (SESSION_DAYS / 2) * DAY_MS) {
		expires = new Date(now.getTime() + SESSION_DAYS * DAY_MS);
		db.update(sessions).set({ expiresAt: expires.toISOString() }).where(eq(sessions.id, id)).run();
		renewed = true;
	}
	return { userId: row.userId, expires, renewed };
}

export function deleteSession(db: Db, token: string | undefined): void {
	if (token) db.delete(sessions).where(eq(sessions.id, tokenId(token))).run();
}

export function deleteExpiredSessions(db: Db, now = new Date()): void {
	db.delete(sessions).where(lt(sessions.expiresAt, now.toISOString())).run();
}

/** Sets (or changes) the password of the first account, creating it if needed. Ends every session. */
export async function setPassword(db: Db, password: string, name = 'Wesley'): Promise<number> {
	if (password.length < MIN_PASSWORD_LENGTH)
		throw new Error(`Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`);
	const passwordHash = await hashPassword(password);
	const existing = db.select({ id: users.id }).from(users).orderBy(users.id).get();
	if (existing) {
		db.update(users).set({ passwordHash }).where(eq(users.id, existing.id)).run();
		db.delete(sessions).where(eq(sessions.userId, existing.id)).run();
		return existing.id;
	}
	const { DEFAULT_SETTINGS } = await import('./seed');
	return db.insert(users).values({ name, passwordHash, settings: DEFAULT_SETTINGS }).returning().get().id;
}

/** Single account in V1: login = the password of the first account. */
export async function checkLogin(db: Db, password: string): Promise<number | null> {
	const user = db.select().from(users).orderBy(users.id).get();
	if (!user) return null;
	return (await verifyPassword(user.passwordHash, password)) ? user.id : null;
}

/**
 * Login throttling: 5 failed attempts per address per 15 minutes,
 * and 20 failed attempts in total per hour (in case addresses rotate).
 */
export class LoginThrottle {
	private byKey = new Map<string, number[]>();
	private all: number[] = [];

	constructor(
		private perKey = 5,
		private perKeyWindowMs = 15 * 60_000,
		private global = 20,
		private globalWindowMs = 60 * 60_000
	) {}

	private prune(now: number) {
		this.all = this.all.filter((t) => now - t < this.globalWindowMs);
		for (const [k, list] of this.byKey) {
			const kept = list.filter((t) => now - t < this.perKeyWindowMs);
			if (kept.length) this.byKey.set(k, kept);
			else this.byKey.delete(k);
		}
	}

	isBlocked(key: string, now = Date.now()): boolean {
		this.prune(now);
		return (this.byKey.get(key)?.length ?? 0) >= this.perKey || this.all.length >= this.global;
	}

	fail(key: string, now = Date.now()): void {
		this.byKey.set(key, [...(this.byKey.get(key) ?? []), now]);
		this.all.push(now);
	}

	succeed(key: string): void {
		this.byKey.delete(key);
	}
}
