// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			reading?: string;
			situation?: string;
		}
		// interface Platform {}
	}
}

export {};
