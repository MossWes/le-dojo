import { today } from '$lib/dates';
import { GRADES } from '$lib/rules';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { statistics } from '$lib/server/services/stats';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ stats: statistics(getDb(), currentUserId(), today()), grades: GRADES });
