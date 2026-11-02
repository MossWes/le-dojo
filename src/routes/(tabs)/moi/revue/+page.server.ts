import { today } from '$lib/dates';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { weeklyReview } from '$lib/server/services/week';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ week: weeklyReview(getDb(), currentUserId(), today()), today: today() });
