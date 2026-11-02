import { describe, expect, it } from 'vitest';
import { livretCatalogue, livretPath } from '../src/lib/server/livrets';

describe('booklets', () => {
	it('lists the five rings, with the bundled Livret 1 part 1', () => {
		const cat = livretCatalogue();
		expect(cat.map((r) => r.name)).toEqual(['Terre', 'Eau', 'Vent', 'Feu', 'Vide']);
		expect(cat[0]!.parts).toEqual([
			expect.objectContaining({ id: 'Le_Dojo_Livret1_Terre_P1_La_Voie.pdf', ring: 1, part: 1, title: 'La Voie' })
		]);
		expect(cat.slice(1).every((r) => r.parts.length === 0)).toBe(true);
	});

	it('only serves catalogued files (no path tricks)', () => {
		expect(livretPath('Le_Dojo_Livret1_Terre_P1_La_Voie.pdf')).toMatch(/assets\/reference/);
		expect(livretPath('../../.env')).toBeNull();
		expect(livretPath('package.json')).toBeNull();
	});
});
