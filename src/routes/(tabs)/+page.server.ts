import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { buildToday } from '$lib/server/today';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ today: buildToday(getDb(), currentUserId()) });
