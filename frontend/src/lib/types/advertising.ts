export enum AdCampaignStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export enum AdCampaignObjective {
  AWARENESS = 'awareness',
  TRAFFIC = 'traffic',
  ENGAGEMENT = 'engagement',
  LEADS = 'leads',
  CONVERSIONS = 'conversions',
  APP_INSTALLS = 'app_installs'
}

export enum AdCreativeType {
  IMAGE = 'image',
  CAROUSEL = 'carousel',
  VIDEO = 'video',
  TEXT = 'text'
}

export enum AdPlacementType {
  FEED = 'feed',
  PROFILE = 'profile',
  SIDEBAR = 'sidebar',
  MARKETPLACE = 'marketplace',
  SEARCH = 'search',
  JOB_LISTINGS = 'job_listings'
}

export interface AdCampaign {
  id: string;
  advertiserId: string;
  name: string;
  objective: AdCampaignObjective;
  status: AdCampaignStatus;
  budget: number;
  dailyBudget?: number;
  totalSpent: number;
  startDate: string;
  endDate?: string;
  targeting?: {
    countries?: string[];
    languages?: string[];
    industries?: string[];
    skills?: string[];
    experienceLevel?: string[];
    interests?: string[];
  };
  audienceId?: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

export interface AdGroup {
  id: string;
  campaignId: string;
  name: string;
  status: 'active' | 'paused';
  budget?: number;
  bidAmount: number;
  bidStrategy: 'auto' | 'manual';
  targetingRefinements?: {
    age?: string[];
    gender?: string[];
    devices?: string[];
  };
  placements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdCreative {
  id: string;
  groupId: string;
  campaignId: string;
  name: string;
  type: AdCreativeType;
  headline: string;
  description?: string;
  callToAction?: string;
  destinationUrl: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  videoUrl?: string;
  videoDuration?: number;
  carouselItems?: Array<{
    imageUrl: string;
    headline?: string;
    description?: string;
    destinationUrl: string;
  }>;
  status: 'active' | 'paused' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdStats {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  cpc: number;
  conversions?: number;
  conversionRate?: number;
  costPerConversion?: number;
  dailyStats: Array<{
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions?: number;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  placementPerformance: Array<{
    placement: string;
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
  }>;
}

export interface AdAudience {
  id: string;
  advertiserId: string;
  name: string;
  description?: string;
  size?: number;
  targeting: {
    countries?: string[];
    languages?: string[];
    age?: string[];
    gender?: string[];
    industries?: string[];
    skills?: string[];
    interests?: string[];
    devices?: string[];
    experienceLevel?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdPlacement {
  id: string;
  name: string;
  type: AdPlacementType;
  description: string;
  dimensions: {
    width: number;
    height: number;
  };
  isAvailable: boolean;
  minBid: number;
  avgCtr?: number;
  requirements?: {
    formats: string[];
    maxFileSize?: number;
    aspectRatio?: string;
  };
}