// Bundles the command-line tools (src/cli/*.ts) into build/cli/*.js for production use.
import { build } from 'esbuild';

await build({
	entryPoints: ['src/cli/seed.ts', 'src/cli/import-readings.ts'],
	outdir: 'build/cli',
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node22',
	packages: 'external',
	logLevel: 'warning'
});
console.log('Commandes construites dans build/cli/');
