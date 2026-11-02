// The five booklets (Musashi's rings). PDFs are found by name in the bundled reference
// folder and in LIVRETS_DIR (data/livrets on the server), e.g.
// Le_Dojo_Livret2_Eau_P1_Le_Chemin.pdf → ring 2, part 1, "Le Chemin".
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { AdinkraName } from '../icons';

export const RINGS: readonly { ring: number; name: string; symbol: AdinkraName }[] = [
	{ ring: 1, name: 'Terre', symbol: 'asase-ye-duru' },
	{ ring: 2, name: 'Eau', symbol: 'nkyinkyim' },
	{ ring: 3, name: 'Vent', symbol: 'mframadan' },
	{ ring: 4, name: 'Feu', symbol: 'hye-won-hye' },
	{ ring: 5, name: 'Vide', symbol: 'sankofa-two' }
];

const PATTERN = /^Le_Dojo_Livret(\d)_[^_]+_P(\d+)_(.+)\.pdf$/i;

export type LivretPart = { id: string; ring: number; part: number; title: string; size: number };

function folders(): string[] {
	return [process.env.LIVRETS_DIR ?? './data/livrets', './assets/reference'].map((d) => resolve(d));
}

/** Every available PDF, keyed by file name (a later folder never overrides an earlier one). */
function scan(): Map<string, { path: string; part: LivretPart }> {
	const found = new Map<string, { path: string; part: LivretPart }>();
	for (const dir of folders()) {
		if (!existsSync(dir)) continue;
		for (const file of readdirSync(dir)) {
			const m = PATTERN.exec(file);
			if (!m || found.has(file)) continue;
			const path = join(dir, file);
			found.set(file, {
				path,
				part: {
					id: file,
					ring: Number(m[1]),
					part: Number(m[2]),
					title: m[3]!.replace(/_/g, ' '),
					size: statSync(path).size
				}
			});
		}
	}
	return found;
}

export function livretCatalogue() {
	const parts = [...scan().values()].map((v) => v.part);
	return RINGS.map((r) => ({
		...r,
		parts: parts.filter((p) => p.ring === r.ring).sort((a, b) => a.part - b.part)
	}));
}

/** Absolute path of a catalogued PDF, or null (never a free path: no traversal possible). */
export function livretPath(id: string): string | null {
	return scan().get(id)?.path ?? null;
}
