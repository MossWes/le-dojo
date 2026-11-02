import { and, desc, eq, isNull } from 'drizzle-orm';
import { hashToken, newToken } from '../auth-core';
import type { Db } from '../db/client';
import { apiTokens } from '../db/schema';

/** Creates the shortcut token (shown once). Any previous one stops working. */
export function createStepsToken(db: Db, userId: number): string {
	const token = newToken('dojo_');
	db.transaction(() => {
		revokeStepsToken(db, userId);
		db.insert(apiTokens).values({ userId, scope: 'steps', tokenHash: hashToken(token) }).run();
	});
	return token;
}

export function revokeStepsToken(db: Db, userId: number): void {
	db.update(apiTokens)
		.set({ revokedAt: new Date().toISOString() })
		.where(and(eq(apiTokens.userId, userId), eq(apiTokens.scope, 'steps'), isNull(apiTokens.revokedAt)))
		.run();
}

export function stepsTokenStatus(db: Db, userId: number) {
	const t = db
		.select()
		.from(apiTokens)
		.where(and(eq(apiTokens.userId, userId), eq(apiTokens.scope, 'steps'), isNull(apiTokens.revokedAt)))
		.orderBy(desc(apiTokens.id))
		.get();
	return t ? { active: true, createdAt: t.createdAt, lastUsedAt: t.lastUsedAt } : { active: false, createdAt: null, lastUsedAt: null };
}

/** The user a "Bearer" token belongs to, or null. */
export function userForStepsToken(db: Db, token: string | null): { userId: number; tokenId: number } | null {
	if (!token || token.length > 200) return null;
	const t = db
		.select()
		.from(apiTokens)
		.where(and(eq(apiTokens.tokenHash, hashToken(token)), eq(apiTokens.scope, 'steps'), isNull(apiTokens.revokedAt)))
		.get();
	if (!t) return null;
	db.update(apiTokens).set({ lastUsedAt: new Date().toISOString() }).where(eq(apiTokens.id, t.id)).run();
	return { userId: t.userId, tokenId: t.id };
}
