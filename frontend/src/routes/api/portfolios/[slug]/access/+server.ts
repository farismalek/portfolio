import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchPortfolioBySlug } from '$lib/services/portfolioService';

export const POST: RequestHandler = async ({ params, request }) => {
  const { slug } = params;

  try {
    // If there's no slug, return 404
    if (!slug) {
      return json({ message: 'Portfolio not found' }, { status: 404 });
    }

    // Get the password from the request body
    const { password } = await request.json();

    if (!password) {
      return json({ message: 'Password is required' }, { status: 400 });
    }

    // Fetch portfolio data by slug (without user ID for privacy check)
    const portfolio = await fetchPortfolioBySlug(slug);

    // Check if the portfolio is password protected and verify password
    if (portfolio.visibility === 'password_protected' && portfolio.password !== password) {
      return json({ message: 'Incorrect password' }, { status: 403 });
    }

    // Password is correct, return portfolio data
    return json(portfolio);
  } catch (error) {
    console.error('Failed to access portfolio:', error);
    return json({ message: 'Portfolio not found or access denied' }, { status: 404 });
  }
};