// Adinkra symbols, bundled from assets/icons (Apache 2.0, see assets/icons/LICENSE-adinkra-icons).
const files = import.meta.glob('/assets/icons/*.svg', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

export type AdinkraName =
	| 'fawohodie'
	| 'asase-ye-duru'
	| 'nkyinkyim'
	| 'mframadan'
	| 'hye-won-hye'
	| 'sankofa-two';

export function adinkraSvg(name: AdinkraName): string {
	const svg = files[`/assets/icons/${name}.svg`];
	if (!svg) throw new Error(`Unknown Adinkra icon: ${name}`);
	return svg;
}
