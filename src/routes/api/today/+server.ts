import type { RequestHandler } from './$types';
import { respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { buildToday } from '$lib/server/today';

export const GET: RequestHandler = () => respond(() => buildToday(getDb(), currentUserId()));
