import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { recordOath } from '$lib/server/services/rituals';

export const POST: RequestHandler = () => respond(() => ({ xpGranted: recordOath(getDb(), currentUserId(), today()) }));
