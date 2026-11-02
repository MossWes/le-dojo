import { env } from '$env/dynamic/private';
import { openDatabase, type Db } from './client';

let instance: Db | undefined;

// Single shared connection, opened lazily on first use.
export function getDb(): Db {
	if (!instance) {
		instance = openDatabase(env.DATABASE_PATH ?? './data/dojo.sqlite').db;
	}
	return instance;
}
