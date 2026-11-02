// Business errors, turned into HTTP responses by the API (step 3+).

export class SLockError extends Error {
	readonly code = 'S_LOCK';
	readonly status = 409;
	constructor(readonly activeTitle: string) {
		super(`Une seule mission S à la fois. Je termine ou je mets en réserve « ${activeTitle} » avant d’en ouvrir une autre.`);
	}
}

export class ValidationError extends Error {
	readonly code = 'INVALID';
	readonly status = 400;
	constructor(
		readonly field: string,
		message: string
	) {
		super(message);
	}
}

export class NotFoundError extends Error {
	readonly code = 'NOT_FOUND';
	readonly status = 404;
	constructor(what: string) {
		super(`${what} introuvable.`);
	}
}
