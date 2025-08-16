import {
  EventListItem,
  AttendeeProfile,
  EventDetail,
  WooProduct,
  ACFEventFields,
  WooOrder,
  LearnDashProgress,
  FluentCrmContact,
} from './types';

/**
 * Utility: coerce unknown value to number if possible.
 */
function toNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
  if (typeof val === 'string') {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/**
 * Utility: parse and normalize date string into ISO8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
function toISODate(input?: string | null): string {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

/**
 * Extract useful fields from ACF payload. Fields are not guaranteed to exist consistently.
 */
function getAcfField(acf: ACFEventFields | null | undefined, ...keys: string[]): unknown {
  const root = acf?.acf && typeof acf.acf === 'object' ? (acf.acf as Record<string, unknown>) : undefined;
  if (!root) return undefined;
  for (const k of keys) {
    if (k in root) return root[k];
  }
  return undefined;
}

/**
 * Heuristic name parsing:
 * - If product.name contains " - ", treat as "Title - Location"
 * - Else if contains " @ ", treat as "Title @ Location"
 * - Else: title=name, location="TBD"
 */
function parseTitleAndLocation(name: string): { title: string; location: string } {
  if (name.includes(' - ')) {
    const [title, location, ...rest] = name.split(' - ');
    return { title: title?.trim() || name, location: location?.trim() || 'TBD' };
  }
  if (name.includes(' @ ')) {
    const [title, location, ...rest] = name.split(' @ ');
    return { title: title?.trim() || name, location: location?.trim() || 'TBD' };
  }
  return { title: name, location: 'TBD' };
}

/**
 * Compute event status based on time-to-start and enrollment vs capacity.
 * Rules:
 * - If startDate is in the past: 'Completed'
 * - Else if capacity > 0
 *    - daysUntil <= 7 and fill < 0.5: 'Danger'
 *    - else if daysUntil <= 21 and fill < 0.3: 'Watch'
 *    - else: 'Go'
 * - Else (unknown capacity):
 *    - daysUntil <= 7 and enrolledCount == 0: 'Danger'
 *    - else if daysUntil <= 21 and enrolledCount <= 2: 'Watch'
 *    - else: 'Go'
 */
function computeStatus(startDateISO: string, capacity: number, enrolledCount: number): EventListItem['status'] {
  if (!startDateISO) return 'Watch';
  const now = new Date();
  const start = new Date(startDateISO);
  const ms = start.getTime() - now.getTime();
  const daysUntil = Math.floor(ms / (1000 * 60 * 60 * 24));

  if (ms < 0) return 'Completed';

  if (capacity > 0) {
    const ratio = enrolledCount / capacity;
    if (daysUntil <= 7 && ratio < 0.5) return 'Danger';
    if (daysUntil <= 21 && ratio < 0.3) return 'Watch';
    return 'Go';
  }

  if (daysUntil <= 7 && enrolledCount === 0) return 'Danger';
  if (daysUntil <= 21 && enrolledCount <= 2) return 'Watch';
  return 'Go';
}

/**
 * Transform a Woo product and its ACF data into an EventListItem
 */
export function transformProductToEventListItem(product: WooProduct, acfData: ACFEventFields): EventListItem {
  const { title, location } = parseTitleAndLocation(product.name || 'Event');
  const startDateRaw = (getAcfField(acfData, 'startDate', 'start_date') as string | undefined) ?? '';
  const startDate = toISODate(startDateRaw);

  // capacity: prefer product stock if managed, else ACF capacity
  const stock = (product.manage_stock ? toNumber(product.stock_quantity, 0) : undefined);
  const acfCapacity = toNumber(getAcfField(acfData, 'capacity'), 0);
  const capacity = typeof stock === 'number' ? stock : acfCapacity;

  // enrolled: Woo total_sales is cumulative sales for product
  const enrolledCount = toNumber(product.total_sales, 0);

  // status with danger/watch/go logic
  const status = computeStatus(startDate, capacity, enrolledCount);

  const url = typeof product.permalink === 'string' ? product.permalink : '';

  const item: EventListItem = {
    id: product.id,
    title,
    startDate,
    location,
    capacity,
    enrolledCount,
    status,
    url,
  };

  return item;
}

/**
 * Transform a Woo order + LearnDash + FluentCRM into AttendeeProfile
 */
export function transformOrderToAttendeeProfile(
  order: WooOrder,
  learnDashData: LearnDashProgress | null | undefined,
  fluentCrmData: FluentCrmContact | null | undefined
): AttendeeProfile {
  const name = `${order.billing?.first_name ?? ''} ${order.billing?.last_name ?? ''}`.trim() || 'Unknown';
  const email = order.billing?.email || '';

  const courseProgress = learnDashData?.progress ?? 0;
  const courseStatus = learnDashData?.status ?? 'unknown';

  // Extract common license/provider info from contact.meta or tags
  const meta = fluentCrmData?.meta ?? undefined;
  const licenseType =
    (typeof meta?.['license_type'] === 'string' ? (meta['license_type'] as string) : undefined) ??
    (typeof meta?.['licenseType'] === 'string' ? (meta['licenseType'] as string) : undefined);
  const licenseNumber =
    (typeof meta?.['license_number'] === 'string' ? (meta['license_number'] as string) : undefined) ??
    (typeof meta?.['licenseNumber'] === 'string' ? (meta['licenseNumber'] as string) : undefined);
  const providerType =
    (typeof meta?.['provider_type'] === 'string' ? (meta['provider_type'] as string) : undefined) ??
    (typeof meta?.['providerType'] === 'string' ? (meta['providerType'] as string) : undefined);

  const crmTags = Array.isArray(fluentCrmData?.tags)
    ? fluentCrmData!.tags!.map((t) => t.title).filter(Boolean)
    : undefined;

  const profile: AttendeeProfile = {
    orderId: order.id,
    name,
    email,
    orderDate: toISODate(order.date_created),
    courseProgress,
    courseStatus,
    licenseType,
    licenseNumber,
    providerType,
    crmTags,
  };

  return profile;
}

/**
 * Combine EventListItem with ACF details and attendees to form EventDetail
 */
export function buildEventDetail(
  listItem: EventListItem,
  acfData: ACFEventFields,
  attendees: AttendeeProfile[]
): EventDetail {
  const overview = String(getAcfField(acfData, 'overview') ?? '') || '';
  const schedule = String(getAcfField(acfData, 'schedule') ?? '') || '';
  const ceus = toNumber(getAcfField(acfData, 'ceus'), 0);

  return {
    ...listItem,
    overview,
    schedule,
    ceus,
    attendees,
  };
}

/**
 * Extract courseId from ACF or fallback. Returns number or 0.
 */
export function resolveCourseId(acfData: ACFEventFields, fallback?: string): number {
  const v = getAcfField(acfData, 'courseId', 'course_id');
  const n = toNumber(v, toNumber(fallback, 0));
  return n > 0 ? n : 0;
}