import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { API_URL } from '$lib/config';
import { authToken } from '$lib/stores/authStore';

// Event categories
export enum EventCategory {
  PORTFOLIO = 'portfolio',
  PROFILE = 'profile',
  JOB = 'job',
  PROJECT = 'project',
  SOCIAL = 'social',
  MESSAGING = 'messaging',
  MONETIZATION = 'monetization',
  SYSTEM = 'system'
}

// Event types
export enum EventType {
  // Portfolio events
  PORTFOLIO_VIEW = 'portfolio_view',
  PORTFOLIO_EDIT = 'portfolio_edit',
  PORTFOLIO_SHARE = 'portfolio_share',
  PORTFOLIO_DOWNLOAD = 'portfolio_download',

  // Profile events
  PROFILE_VIEW = 'profile_view',
  PROFILE_EDIT = 'profile_edit',
  PROFILE_CONNECT = 'profile_connect',

  // Job events
  JOB_VIEW = 'job_view',
  JOB_APPLY = 'job_apply',
  JOB_SAVE = 'job_save',
  JOB_SHARE = 'job_share',

  // Project events
  PROJECT_VIEW = 'project_view',
  PROJECT_PROPOSAL = 'project_proposal',
  PROJECT_HIRE = 'project_hire',

  // Social events
  POST_VIEW = 'post_view',
  POST_CREATE = 'post_create',
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  POST_SHARE = 'post_share',

  // Messaging events
  MESSAGE_SEND = 'message_send',
  CONVERSATION_START = 'conversation_start',

  // Monetization events
  SUBSCRIPTION_VIEW = 'subscription_view',
  SUBSCRIPTION_PURCHASE = 'subscription_purchase',
  PRODUCT_VIEW = 'product_view',
  PRODUCT_PURCHASE = 'product_purchase',

  // System events
  PAGE_VIEW = 'page_view',
  ERROR = 'error',
  FEATURE_USE = 'feature_use'
}

// Analytics event interface
export interface AnalyticsEvent {
  category: EventCategory;
  type: EventType;
  timestamp?: number;
  properties?: Record<string, any>;
  userAgent?: string;
}

// Queue for batching events
let eventQueue: AnalyticsEvent[] = [];
let isProcessingQueue = false;
const QUEUE_PROCESS_INTERVAL = 10000; // 10 seconds
const MAX_QUEUE_SIZE = 20;

// Initialize analytics and set up queue processing
export function initAnalytics() {
  if (browser) {
    // Process queue periodically
    setInterval(() => {
      processEventQueue();
    }, QUEUE_PROCESS_INTERVAL);

    // Process queue on page unload
    window.addEventListener('beforeunload', () => {
      processEventQueue(true);
    });

    // Track page views
    trackEvent(EventCategory.SYSTEM, EventType.PAGE_VIEW, {
      path: window.location.pathname,
      referrer: document.referrer
    });
  }
}

// Track an event
export function trackEvent(
  category: EventCategory,
  type: EventType,
  properties?: Record<string, any>
) {
  if (!browser) return;

  const event: AnalyticsEvent = {
    category,
    type,
    timestamp: Date.now(),
    properties,
    userAgent: navigator.userAgent
  };

  // Add to queue
  eventQueue.push(event);

  // Process queue if it reaches max size
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    processEventQueue();
  }
}

// Process the event queue
async function processEventQueue(isSync = false) {
  if (!browser || isProcessingQueue || eventQueue.length === 0) return;

  isProcessingQueue = true;

  const eventsToProcess = [...eventQueue];
  eventQueue = [];

  try {
    const token = get(authToken);
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const sendMethod = isSync
      ? sendEventsSync
      : sendEventsAsync;

    await sendMethod(`${API_URL}/analytics/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ events: eventsToProcess })
    });
  } catch (error) {
    console.error('Failed to send analytics events:', error);
    // Put events back in the queue to retry later
    eventQueue = [...eventsToProcess, ...eventQueue];
  } finally {
    isProcessingQueue = false;
  }
}

// Async send events
async function sendEventsAsync(url: string, options: RequestInit) {
  return fetch(url, options);
}

// Sync send events using navigator.sendBeacon (for beforeunload)
function sendEventsSync(url: string, options: RequestInit) {
  if (!navigator.sendBeacon) {
    return fetch(url, options);
  }

  const blob = new Blob(
    [options.body as string],
    { type: 'application/json' }
  );

  return navigator.sendBeacon(url, blob);
}

// Track specific portfolio events
export function trackPortfolioView(portfolioId: string, viewerId?: string) {
  trackEvent(EventCategory.PORTFOLIO, EventType.PORTFOLIO_VIEW, {
    portfolioId,
    viewerId
  });
}

export function trackPortfolioShare(portfolioId: string, platform: string) {
  trackEvent(EventCategory.PORTFOLIO, EventType.PORTFOLIO_SHARE, {
    portfolioId,
    platform
  });
}

// Track job application events
export function trackJobApplication(jobId: string, companyId: string) {
  trackEvent(EventCategory.JOB, EventType.JOB_APPLY, {
    jobId,
    companyId
  });
}

// Track social engagement
export function trackPostEngagement(postId: string, type: EventType) {
  trackEvent(EventCategory.SOCIAL, type, {
    postId
  });
}

// Track feature usage
export function trackFeatureUse(featureName: string, properties?: Record<string, any>) {
  trackEvent(EventCategory.SYSTEM, EventType.FEATURE_USE, {
    featureName,
    ...properties
  });
}

// Track errors
export function trackError(errorType: string, message: string, stackTrace?: string) {
  trackEvent(EventCategory.SYSTEM, EventType.ERROR, {
    errorType,
    message,
    stackTrace
  });
}