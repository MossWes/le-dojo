// Restores a JSON export on a fresh installation:
//   docker compose exec -T app node build/cli/import-data.js - < le-dojo-export.json
// then: docker compose exec app node build/cli/create-user.js
import { readFileSync } from 'node:fs';
import { openDatabase } from '../lib/server/db/client';
import { importAll } from '../lib/server/export';

const path = process.argv[2];
if (!path) {
	console.error('Usage : import-data <export.json>   (ou « - » pour lire l’entrée standard)');
	process.exit(1);
}
const { db, sqlite } = openDatabase(process.env.DATABASE_PATH ?? './data/dojo.sqlite');
try {
	const counts = importAll(db, JSON.parse(readFileSync(path === '-' ? 0 : path, 'utf8')));
	for (const [name, n] of Object.entries(counts)) console.log(`${name.padEnd(16)} ${n}`);
	console.log('Import terminé. Je définis maintenant mon mot de passe avec create-user.');
} catch (e) {
	console.error((e as Error).message);
	process.exitCode = 1;
} finally {
	sqlite.close();
}
