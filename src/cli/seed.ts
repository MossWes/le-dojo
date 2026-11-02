// `npm run seed` (or in Docker: `node build/cli/seed.js`). Safe to run again.
import { openDatabase } from '../lib/server/db/client';
import { runSeed } from '../lib/server/seed';

const { db, sqlite } = openDatabase(process.env.DATABASE_PATH ?? './data/dojo.sqlite');
try {
	const report = runSeed(db, process.env.SEED_DIR ?? './seed');
	for (const [name, r] of Object.entries(report))
		console.log(`${name.padEnd(9)} créés : ${r.created}  mis à jour : ${r.updated}  conservés : ${r.kept}`);
	console.log('Seed terminé.');
} finally {
	sqlite.close();
}
