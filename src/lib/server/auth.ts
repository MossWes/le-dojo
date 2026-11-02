import { error } from '@sveltejs/kit';
import { getDb } from './db';
import { users } from './db/schema';

// TEMPORARY (until step 7): every request acts as the first account.
// Step 7 replaces this with the session cookie check.
export function currentUserId(): number {
	const user = getDb().select({ id: users.id }).from(users).orderBy(users.id).get();
	if (!user) error(503, 'Aucun compte. Lance d’abord « npm run seed ».');
	return user.id;
}
