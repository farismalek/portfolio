export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  PAUSED = 'paused',
  ENDED = 'ended'
}

export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  QUARTERLY = 'quarterly'
}

export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer'
}

export interface SubscriptionFeature {
  key: string;
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  features: SubscriptionFeature[];
  price: {
    monthly: number;
    yearly: number;
    quarterly?: number;
  };
  yearlyDiscount?: number;
  trialDays?: number;
  mostPopular?: boolean;
  recommended?: boolean;
  isEnterprise?: boolean;
  isCustom?: boolean;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  planId: string;
  userId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  endedAt?: string;
  trialStart?: string;
  trialEnd?: string;
  interval: BillingInterval;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
  paymentMethodId?: string;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  isDefault: boolean;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  holderName?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  userId: string;
  amount: number;
  status: 'paid' | 'open' | 'uncollectible' | 'void';
  currency: string;
  date: string;
  dueDate?: string;
  pdfUrl?: string;
  lines: Array<{
    description: string;
    amount: number;
    period?: {
      start: string;
      end: string;
    };
  }>;
  metadata?: Record<string, any>;
}