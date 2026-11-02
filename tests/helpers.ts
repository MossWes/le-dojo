import { openDatabase } from '../src/lib/server/db/client';
import { runSeed } from '../src/lib/server/seed';

export function freshDb() {
	return openDatabase(':memory:');
}

export function seededDb() {
	const handle = freshDb();
	runSeed(handle.db, './seed');
	return { ...handle, userId: 1 };
}
