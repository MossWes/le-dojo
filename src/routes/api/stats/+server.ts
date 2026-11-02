import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { statistics } from '$lib/server/services/stats';

export const GET: RequestHandler = () => respond(() => statistics(getDb(), currentUserId(), today()));
