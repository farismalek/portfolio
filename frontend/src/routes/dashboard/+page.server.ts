import { requireAuth } from '$lib/guards/AuthGuard';

export const load = async (event) => {
  return requireAuth();
};