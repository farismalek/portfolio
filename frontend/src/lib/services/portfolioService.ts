// Add this function to the existing portfolioService.ts file

// Fetch a portfolio by slug
export async function fetchPortfolioBySlug(slug: string, userId?: string): Promise<Portfolio> {
  let token: string | null = null;

  // Try to get auth token if available
  try {
    token = await get(authToken);
  } catch (err) {
    // User is not authenticated, continue without token
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const query = `
    query GetPortfolioBySlug($slug: String!, $userId: ID) {
      portfolioBySlug(slug: $slug, userId: $userId) {
        id
        title
        description
        status
        visibility
        password
        slug
        customDomain
        thumbnailUrl
        templateId
        customizations
        settings
        analytics
        featured
        userId
        viewCount
        createdAt
        updatedAt
        publishedAt
        lastViewedAt
        pages {
          id
          title
          slug
          order
          content
          metadata
          isHomePage
          portfolioId
          createdAt
          updatedAt
        }
        user {
          id
          username
          fullName
        }
      }
    }
  `;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables: { slug, userId }
    })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data.portfolioBySlug;
}