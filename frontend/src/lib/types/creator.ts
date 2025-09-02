export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  expertise: string[];
  avatarUrl?: string;
  coverImageUrl?: string;
  websiteUrl?: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
    dribbble?: string;
    behance?: string;
  };
  bankingInfo: {
    paypalEmail?: string;
    bankAccount?: {
      accountNumber: string;
      routingNumber: string;
      accountName: string;
      bankName: string;
      swiftCode?: string;
    };
  };
  taxInfo: {
    country: string;
    taxId?: string;
    vatNumber?: string;
    companyName?: string;
  };
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  followerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorStats {
  revenue: {
    totalLifetime: number;
    currentMonth: number;
    previousMonth: number;
    monthlyChange: number;
  };
  products: {
    total: number;
    active: number;
  };
  sales: {
    totalCount: number;
    currentMonth: number;
    previousMonth: number;
    monthlySalesChange: number;
  };
  customers: {
    totalCount: number;
    newThisMonth: number;
    returningRate: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  revenueByDay: Array<{
    date: string;
    amount: number;
  }>;
}

export interface CreatorProduct {
  id: string;
  creatorId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  currency: string;
  discountPrice?: number;
  discountPercentage?: number;
  saleEndDate?: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  tags: string[];
  previewImages: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
  }>;
  fileUrl?: string;
  fileSize?: number;
  features: string[];
  specifications?: Record<string, string>;
  isPublished: boolean;
  isApproved: boolean;
  isDraft: boolean;
  isFeatured: boolean;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  salesCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorEarning {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  source: 'product_sale' | 'tip' | 'subscription' | 'sponsorship' | 'affiliate';
  sourceId?: string;
  sourceName?: string;
  status: 'pending' | 'available' | 'processing' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  metadata?: Record<string, any>;
}

export interface CreatorPayout {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  paymentDetails: Record<string, any>;
  requestedAt: string;
  processedAt?: string;
  reference?: string;
}

export interface CreatorSponsor {
  id: string;
  creatorId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  amount: number;
  currency: string;
  message?: string;
  isRecurring: boolean;
  frequency?: 'monthly' | 'yearly';
  firstSponsoredAt: string;
  lastSponsoredAt: string;
  nextBillingDate?: string;
  totalContribution: number;
}

export interface AffiliateLink {
  id: string;
  creatorId: string;
  type: 'product' | 'profile';
  targetId: string;
  targetName: string;
  slug: string;
  fullUrl: string;
  clickCount: number;
  conversionCount: number;
  conversionRate: number;
  earnings: number;
  createdAt: string;
}