import { describe, expect, it } from 'vitest';
import { openDatabase } from '../src/lib/server/db/client';

describe('database', () => {
	it('applies migrations on a fresh database', () => {
		const { sqlite } = openDatabase(':memory:');
		const tables = sqlite
			.prepare("select name from sqlite_master where type = 'table' and name = 'users'")
			.all();
		expect(tables).toHaveLength(1);
		sqlite.close();
	});

	it('enables foreign keys', () => {
		const { sqlite } = openDatabase(':memory:');
		expect(sqlite.pragma('foreign_keys', { simple: true })).toBe(1);
		sqlite.close();
	});
});
