// V2 — offline queue: boxes ticked without network wait on this device and are sent
// as soon as the network is back. Kept in localStorage (this device only).
import { invalidateAll } from '$app/navigation';
import { labels } from '$lib/labels';

export type QueuedAction = {
	key: string; // the same key replaces the previous pending action (last tick wins)
	method: string;
	url: string;
	body: unknown;
	at: string;
};

const STORAGE = 'dojo-queue-v1';

function load(): QueuedAction[] {
	try {
		const raw = localStorage.getItem(STORAGE);
		return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
	} catch {
		return [];
	}
}

class OfflineQueue {
	items = $state<QueuedAction[]>([]);
	problems = $state<string[]>([]);
	private flushing = false;

	init(): void {
		this.items = load();
		window.addEventListener('online', () => this.flush());
		if (navigator.onLine) this.flush();
	}

	private save(): void {
		try {
			localStorage.setItem(STORAGE, JSON.stringify(this.items));
		} catch {
			/* storage unavailable: the queue lives in memory only */
		}
	}

	add(action: Omit<QueuedAction, 'at'>): void {
		this.items = [...this.items.filter((i) => i.key !== action.key), { ...action, at: new Date().toISOString() }];
		this.save();
	}

	pending(key: string): QueuedAction | undefined {
		return this.items.find((i) => i.key === key);
	}

	/** Sends the waiting actions in order. Network errors keep them; refusals are reported. */
	async flush(): Promise<void> {
		if (this.flushing || this.items.length === 0) return;
		this.flushing = true;
		let changed = false;
		try {
			while (this.items.length) {
				const item = this.items[0]!;
				let res: Response;
				try {
					res = await fetch(item.url, {
						method: item.method,
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify(item.body)
					});
				} catch {
					break; // still offline
				}
				if (res.status === 401) break; // signed out: keep until I sign in again
				if (!res.ok) {
					const data = await res.json().catch(() => null);
					this.problems = [...this.problems, data?.message ?? labels.errors.generic];
				}
				this.items = this.items.slice(1);
				this.save();
				changed = true;
			}
		} finally {
			this.flushing = false;
		}
		if (changed) await invalidateAll();
	}

	dismissProblems(): void {
		this.problems = [];
	}
}

export const queue = new OfflineQueue();
