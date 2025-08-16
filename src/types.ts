/**
 * Data Contracts for Graston Data Aggregation Worker
 */

export interface EventListItem {
  id: number;
  title: string;
  startDate: string; // ISO 8601 format
  location: string;
  capacity: number;
  enrolledCount: number;
  status: 'Go' | 'Watch' | 'Danger' | 'Completed';
  url: string;
}

export interface AttendeeProfile {
  orderId: number;
  name: string;
  email: string;
  orderDate: string; // ISO 8601 format
  // From LearnDash
  courseProgress: number;
  courseStatus: string;
  // From FluentCRM
  licenseType?: string;
  licenseNumber?: string;
  providerType?: string;
  crmTags?: string[];
}

export interface EventDetail extends EventListItem {
  overview: string; // From ACF
  schedule: string; // From ACF
  ceus: number; // From ACF
  attendees: AttendeeProfile[];
}

/**
 * Minimal raw API shapes we consume
 */
export interface WooProduct {
  id: number;
  name: string;
  permalink?: string;
  manage_stock?: boolean;
  stock_quantity?: number | null;
  total_sales?: number | string;
  status?: string;
  date_created?: string;
  type?: string;
  // Optional meta for flexibility
  [key: string]: unknown;
}

export interface WooOrderLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  [key: string]: unknown;
}

export interface WooOrder {
  id: number;
  status: string;
  customer_id: number; // 0 if guest
  date_created: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
  line_items: WooOrderLineItem[];
  [key: string]: unknown;
}

/**
 * ACF Event fields shape - flexible to tolerate different field keys.
 */
export interface ACFEventFields {
  acf?: {
    startDate?: string;
    start_date?: string;
    overview?: string;
    schedule?: string;
    ceus?: number | string;
    courseId?: number | string;
    course_id?: number | string;
    capacity?: number | string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface LearnDashProgress {
  progress: number; // 0..100
  status: string; // e.g., "not-started" | "in-progress" | "completed"
  [key: string]: unknown;
}

export interface FluentCrmContact {
  id?: number;
  email: string;
  first_name?: string;
  last_name?: string;
  tags?: { id: number; title: string }[];
  meta?: Record<string, string | number | boolean | null | undefined>;
  [key: string]: unknown;
}

/**
 * Cloudflare Worker Env bindings
 */
export interface Env {
  // Base URL to your WP site, e.g. https://example.com
  WP_BASE_URL: string;

  // WooCommerce REST API credentials
  WC_CONSUMER_KEY: string;
  WC_CONSUMER_SECRET: string;

  // WordPress Application Password auth to access ACF/LearnDash/FluentCRM endpoints
  WP_APP_USER: string;
  WP_APP_PASSWORD: string;

  // Optional default LearnDash course id
  LEARNDASH_DEFAULT_COURSE_ID?: string;
}