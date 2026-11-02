import type { RequestHandler } from './$types';
import { today } from '$lib/dates';
import { respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { nextReading } from '$lib/server/services/readings';

export const POST: RequestHandler = () => respond(() => nextReading(getDb(), currentUserId(), today()));
