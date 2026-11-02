import type { RequestHandler } from './$types';
import { respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { listFronts } from '$lib/server/services/fronts';

export const GET: RequestHandler = () => respond(() => listFronts(getDb(), currentUserId()));
