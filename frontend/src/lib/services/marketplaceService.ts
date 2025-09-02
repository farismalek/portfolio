import { API_URL } from '$lib/config';
import { get } from 'svelte/store';
import { authToken } from '$lib/stores/authStore';
import type {
  Product,
  ProductCategory,
  ProductReview,
  ProductPurchase,
  ProductCreator
} from '$lib/types/marketplace';

/**
 * Fetch featured products for the marketplace
 */
export async function fetchFeaturedProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/marketplace/products/featured`);

  if (!response.ok) {
    throw new Error('Failed to fetch featured products');
  }

  return await response.json();
}

/**
 * Fetch products by category
 */
export async function fetchProductsByCategory(
  categoryId: string,
  page: number = 1,
  limit: number = 20,
  sort: string = 'popular'
): Promise<{ products: Product[], total: number, pages: number }> {
  const url = new URL(`${API_URL}/marketplace/categories/${categoryId}/products`);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('sort', sort);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return await response.json();
}

/**
 * Search products
 */
export async function searchProducts(
  query: string,
  filters: Record<string, any> = {},
  page: number = 1,
  limit: number = 20,
  sort: string = 'relevant'
): Promise<{ products: Product[], total: number, pages: number }> {
  const url = new URL(`${API_URL}/marketplace/products/search`);
  url.searchParams.append('query', query);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('sort', sort);

  // Add filters to query
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(val => url.searchParams.append(`filter[${key}]`, val));
    } else {
      url.searchParams.append(`filter[${key}]`, value);
    }
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Failed to search products');
  }

  return await response.json();
}

/**
 * Fetch product details
 */
export async function fetchProduct(productId: string): Promise<Product> {
  const response = await fetch(`${API_URL}/marketplace/products/${productId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch product details');
  }

  return await response.json();
}

/**
 * Fetch product reviews
 */
export async function fetchProductReviews(
  productId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: ProductReview[], total: number, pages: number }> {
  const url = new URL(`${API_URL}/marketplace/products/${productId}/reviews`);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Failed to fetch product reviews');
  }

  return await response.json();
}

/**
 * Submit a product review
 */
export async function submitProductReview(
  productId: string,
  rating: number,
  comment: string
): Promise<ProductReview> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/marketplace/products/${productId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      rating,
      comment
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit review');
  }

  return await response.json();
}

/**
 * Purchase a product
 */
export async function purchaseProduct(
  productId: string,
  paymentMethodId: string,
  couponCode?: string
): Promise<ProductPurchase> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/marketplace/purchases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productId,
      paymentMethodId,
      couponCode
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to purchase product');
  }

  return await response.json();
}

/**
 * Fetch user's purchased products
 */
export async function fetchPurchasedProducts(): Promise<ProductPurchase[]> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/marketplace/purchases`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch purchased products');
  }

  return await response.json();
}

/**
 * Download purchased product
 */
export async function downloadProduct(purchaseId: string): Promise<Blob> {
  const token = get(authToken);
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_URL}/marketplace/purchases/${purchaseId}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to download product');
  }

  return await response.blob();
}

/**
 * Fetch product categories
 */
export async function fetchProductCategories(): Promise<ProductCategory[]> {
  const response = await fetch(`${API_URL}/marketplace/categories`);

  if (!response.ok) {
    throw new Error('Failed to fetch product categories');
  }

  return await response.json();
}

/**
 * Fetch creator profile
 */
export async function fetchCreatorProfile(creatorId: string): Promise<ProductCreator> {
  const response = await fetch(`${API_URL}/marketplace/creators/${creatorId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch creator profile');
  }

  return await response.json();
}

/**
 * Fetch products by creator
 */
export async function fetchCreatorProducts(
  creatorId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ products: Product[], total: number, pages: number }> {
  const url = new URL(`${API_URL}/marketplace/creators/${creatorId}/products`);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Failed to fetch creator products');
  }

  return await response.json();
}