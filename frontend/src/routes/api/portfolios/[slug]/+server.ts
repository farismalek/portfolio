import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchPortfolioBySlug } from '$lib/services/portfolioService';

export const GET: RequestHandler = async ({ params, request, locals }) => {
  const { slug } = params;

  try {
    // If there's no slug, return 404
    if (!slug) {
      return json({ message: 'Portfolio not found' }, { status: 404 });
    }

    // Fetch portfolio data by slug
    // We need to get the current user's ID if they're logged in
    const userId = locals.user?.id;
    const portfolio = await fetchPortfolioBySlug(slug, userId);

    // Check if the portfolio is password protected and no user is logged in
    if (portfolio.visibility === 'password_protected' && !userId) {
      return json({ message: 'This portfolio is password protected' }, { status: 401 });
    }

    // Check if the portfolio is private and the viewer is not the owner
    if (portfolio.visibility === 'private' && portfolio.userId !== userId) {
      return json({ message: 'This portfolio is private' }, { status: 403 });
    }

    // Portfolio is public or user is authorized, return data
    return json(portfolio);
  } catch (error) {
    console.error('Failed to fetch portfolio:', error);
    return json({ message: 'Portfolio not found' }, { status: 404 });
  }
};