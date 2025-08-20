// Event list item interface
export interface EventListItem {
  id: string;
  title: string;
  startDate: string; // ISO date string
  location: string;
  capacity: number;
  enrolledCount: number;
  status: string;
  url: string;
}

// Attendee profile interface
export interface AttendeeProfile {
  orderId: string;
  name: string;
  email: string;
  orderDate: string; // ISO date string
  // LearnDash fields (optional)
  courseProgress?: number;
  courseStatus?: string;
  // FluentCRM fields (optional)
  licenseType?: string;
  crmTags?: string[];
}

// Event detail interface
export interface EventDetail extends EventListItem {
  overview: string;
  schedule: string;
  ceus: string;
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

export interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

export interface Instructor {
  id: string;
  name: string;
  expertise: string;
  experience: number;
}