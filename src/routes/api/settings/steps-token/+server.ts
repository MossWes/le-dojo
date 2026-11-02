import type { RequestHandler } from './$types';
import { respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { createStepsToken, revokeStepsToken, stepsTokenStatus } from '$lib/server/services/steps-token';

export const GET: RequestHandler = () => respond(() => stepsTokenStatus(getDb(), currentUserId()));
// The token is returned once, here, and never again.
export const POST: RequestHandler = () => respond(() => ({ token: createStepsToken(getDb(), currentUserId()) }));
export const DELETE: RequestHandler = () => respond(() => revokeStepsToken(getDb(), currentUserId()));
