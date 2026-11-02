import type { RequestHandler } from './$types';
import { respond } from '$lib/server/api';
import { currentUserId } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { listReviews } from '$lib/server/services/reviews';

export const GET: RequestHandler = () => respond(() => listReviews(getDb(), currentUserId()));
