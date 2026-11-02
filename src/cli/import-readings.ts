// Imports a readings or phases file (same format as seed/readings.json or seed/phases.json).
//   npm run import-readings -- chemin/vers/fichier.json
//   docker compose exec -T app node build/cli/import-readings.js - < fichier.json
import { readFileSync } from 'node:fs';
import { openDatabase } from '../lib/server/db/client';
import { ContentFormatError } from '../lib/server/content-format';
import { importContent } from '../lib/server/seed';

const path = process.argv[2];
if (!path) {
	console.error('Usage : import-readings <fichier.json>   (ou « - » pour lire l’entrée standard)');
	process.exit(1);
}

let data: unknown;
try {
	data = JSON.parse(readFileSync(path === '-' ? 0 : path, 'utf8'));
} catch (e) {
	console.error(`Lecture impossible : ${(e as Error).message}`);
	process.exit(1);
}

const { db, sqlite } = openDatabase(process.env.DATABASE_PATH ?? './data/dojo.sqlite');
try {
	const r = importContent(db, data);
	console.log(`Phases   créées : ${r.phases.created}  mises à jour : ${r.phases.updated}`);
	console.log(`Lectures créées : ${r.readings.created}  mises à jour : ${r.readings.updated}`);
} catch (e) {
	console.error(e instanceof ContentFormatError ? e.message : e);
	process.exitCode = 1;
} finally {
	sqlite.close();
}
