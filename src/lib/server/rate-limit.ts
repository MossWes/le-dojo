/** Sliding-window counter: at most `max` calls per `windowMs` for each key. */
export class RateLimit {
	private hits = new Map<string, number[]>();
	constructor(
		private max: number,
		private windowMs: number
	) {}

	/** Records a call; returns false if the limit is already reached. */
	take(key: string, now = Date.now()): boolean {
		const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
		if (recent.length >= this.max) {
			this.hits.set(key, recent);
			return false;
		}
		recent.push(now);
		this.hits.set(key, recent);
		return true;
	}
}
