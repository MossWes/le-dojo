import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Colors may only be defined in src/lib/styles/tokens.css (annexe 3).
const TOKENS_FILE = join('src', 'lib', 'styles', 'tokens.css');
// The service worker's offline page cannot load the app's CSS: its colors copy the tokens.
const EXCEPTIONS = [join('src', 'service-worker.ts')];
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;

function files(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry);
		return statSync(path).isDirectory() ? files(path) : [path];
	});
}

describe('design tokens', () => {
	it('has no hard-coded color outside tokens.css', () => {
		const offenders = files('src')
			.filter((f) => /\.(svelte|css|ts)$/.test(f) && f !== TOKENS_FILE && !EXCEPTIONS.includes(f) && !f.endsWith('.test.ts'))
			.filter((f) => COLOR.test(readFileSync(f, 'utf8')));
		expect(offenders).toEqual([]);
	});
});
