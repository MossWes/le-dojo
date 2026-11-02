import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { questOverviews } from '$lib/server/services/quests';

export const GET: RequestHandler = () => respond(() => questOverviews(getDb(), currentUserId(), today()));
