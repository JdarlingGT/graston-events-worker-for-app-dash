import {
  Env,
  WooProduct,
  ACFEventFields,
  WooOrder,
  LearnDashProgress,
  FluentCrmContact,
} from './types';

const USER_AGENT = 'Graston-Data-Worker/0.1';

/**
 * Build Basic auth header value for endpoints requiring WP Application Password auth
 */
function basicAuth(user: string, pass: string): string {
  // btoa is available in Workers runtime
  return 'Basic ' + btoa(`${user}:${pass}`);
}

async function readJsonOrThrow<T>(res: Response, url: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url} :: ${text}`);
  }
  return (await res.json()) as T;
}

function buildUrl(base: string, path: string, query?: Record<string, string | number | undefined | null>): string {
  const u = new URL(path.replace(/^\/+/, ''), base.endsWith('/') ? base : base + '/');
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
}

function defaultHeaders(): HeadersInit {
  return {
    'Accept': 'application/json',
    'User-Agent': USER_AGENT,
  };
}

function wpAuthHeaders(env: Env): HeadersInit {
  return {
    ...defaultHeaders(),
    'Authorization': basicAuth(env.WP_APP_USER, env.WP_APP_PASSWORD),
  };
}

/**
 * Fetch WooCommerce products (paginated) using Woo REST auth (CK/CS).
 * Returns all published products. Adjust filters if needed.
 */
export async function fetchWooCommerceProducts(env: Env): Promise<WooProduct[]> {
  const perPage = 100;
  let page = 1;
  const all: WooProduct[] = [];

  // We will loop until fewer than perPage results are returned
  // Auth via query params as recommended by Woo in server-to-server contexts
  while (true) {
    const url = buildUrl(env.WP_BASE_URL, '/wp-json/wc/v3/products', {
      per_page: perPage,
      page,
      status: 'publish',
      consumer_key: env.WC_CONSUMER_KEY,
      consumer_secret: env.WC_CONSUMER_SECRET,
    });

    const res = await fetch(url, { headers: defaultHeaders() });
    if (res.status === 401 || res.status === 403) {
      const body = await res.text().catch(() => '');
      throw new Error(`WooCommerce auth failed for products (page ${page}). Response: ${res.status} ${res.statusText}. ${body}`);
    }

    const items = (await readJsonOrThrow<unknown[]>(res, url)) as WooProduct[];
    all.push(...items);

    if (items.length < perPage) break;
    page += 1;
  }

  return all;
}

/**
 * Fetch ACF fields for a Woo product.
 * Tries ACF endpoint first, falls back to WP core endpoint if necessary.
 */
export async function fetchEventACF(env: Env, productId: number): Promise<ACFEventFields> {
  // Attempt ACF REST: /wp-json/acf/v3/product/{id}
  const acfUrl = buildUrl(env.WP_BASE_URL, `/wp-json/acf/v3/product/${productId}`);
  const res1 = await fetch(acfUrl, { headers: wpAuthHeaders(env) });

  if (res1.ok) {
    const data = (await readJsonOrThrow<any>(res1, acfUrl)) as ACFEventFields;
    // Some ACF responses wrap data as { acf: {...} }, keep shape consistent
    if (data && typeof data === 'object' && 'acf' in data) {
      return data as ACFEventFields;
    }
    return { acf: data as Record<string, unknown> };
  }

  // Fallback: WP core product post type (requires context=edit to expose ACF if integrated)
  const wpUrl = buildUrl(env.WP_BASE_URL, `/wp-json/wp/v2/product/${productId}`, { context: 'edit' });
  const res2 = await fetch(wpUrl, { headers: wpAuthHeaders(env) });
  if (!res2.ok) {
    const text = await res2.text().catch(() => '');
    throw new Error(`Failed to fetch ACF for product ${productId}. Tried ${acfUrl} then ${wpUrl}. Last: ${res2.status} ${res2.statusText}. ${text}`);
  }
  const wpJson = (await res2.json()) as any;
  if (wpJson && typeof wpJson === 'object' && 'acf' in wpJson) {
    return { acf: wpJson.acf };
  }
  // As a last resort, return empty acf struct
  return { acf: {} };
}

/**
 * Fetch WooCommerce orders that include a specific product.
 * We collect orders across target statuses and paginate results.
 */
export async function fetchWooCommerceOrdersForProduct(env: Env, productId: number): Promise<WooOrder[]> {
  const perPage = 100;
  const targetStatuses = ['processing', 'completed'] as const;
  const all: WooOrder[] = [];

  for (const status of targetStatuses) {
    let page = 1;
    // Loop through pages for this status
    while (true) {
      const url = buildUrl(env.WP_BASE_URL, '/wp-json/wc/v3/orders', {
        per_page: perPage,
        page,
        status,
        product: productId,
        consumer_key: env.WC_CONSUMER_KEY,
        consumer_secret: env.WC_CONSUMER_SECRET,
      });

      const res = await fetch(url, { headers: defaultHeaders() });
      if (res.status === 401 || res.status === 403) {
        const body = await res.text().catch(() => '');
        throw new Error(`WooCommerce auth failed for orders (product ${productId}, status ${status}, page ${page}). Response: ${res.status} ${res.statusText}. ${body}`);
      }

      const items = (await readJsonOrThrow<unknown[]>(res, url)) as WooOrder[];
      all.push(...items);

      if (items.length < perPage) break;
      page += 1;
    }
  }

  // Deduplicate by order id in case of any overlap
  const dedup = new Map<number, WooOrder>();
  for (const o of all) dedup.set(o.id, o);
  return Array.from(dedup.values());
}

/**
 * Fetch LearnDash progress for a user in a course.
 * Endpoint paths can vary by LearnDash version; this uses a commonly available v2 shape.
 * Fallback returns a conservative default if not found.
 */
export async function fetchLearnDashProgress(env: Env, userId: number, courseId: number): Promise<LearnDashProgress> {
  const url = buildUrl(env.WP_BASE_URL, `/wp-json/ldlms/v2/users/${userId}/courses/${courseId}`);
  const res = await fetch(url, { headers: wpAuthHeaders(env) });

  if (!res.ok) {
    // Some installs expose alternative endpoints, or restrict access; return default
    return { progress: 0, status: 'unknown' };
  }

  const data = (await readJsonOrThrow<any>(res, url)) as any;

  // Normalize a few common response shapes to LearnDashProgress
  const progress =
    typeof data?.progress === 'number'
      ? Math.max(0, Math.min(100, data.progress))
      : typeof data?.percentage === 'number'
        ? Math.max(0, Math.min(100, data.percentage))
        : 0;

  const status: string =
    typeof data?.status === 'string'
      ? data.status
      : progress === 100
        ? 'completed'
        : progress > 0
          ? 'in-progress'
          : 'not-started';

  return { progress, status };
}

/**
 * Fetch a FluentCRM contact by email.
 * Uses search query; returns the first matching contact if present, else null.
 */
export async function fetchFluentCRMContactByEmail(env: Env, email: string): Promise<FluentCrmContact | null> {
  const url = buildUrl(env.WP_BASE_URL, '/wp-json/fluent-crm/v2/contacts', {
    search: email,
    per_page: 1,
    page: 1,
  });

  const res = await fetch(url, { headers: wpAuthHeaders(env) });

  if (!res.ok) {
    // Some setups require different capability scopes; treat as not found
    return null;
  }

  const payload = (await readJsonOrThrow<any>(res, url)) as any;
  // Known shapes:
  // - { data: { total, per_page, current_page, data: [ ...contacts ] } }
  // - Or directly [ ...contacts ]
  let list: any[] = [];
  if (Array.isArray(payload)) {
    list = payload;
  } else if (payload?.data?.data && Array.isArray(payload.data.data)) {
    list = payload.data.data;
  } else if (payload?.data && Array.isArray(payload.data)) {
    list = payload.data;
  }

  if (!list.length) return null;

  const c = list[0];
  const tags = Array.isArray(c?.tags) ? c.tags : Array.isArray(c?.taxonomy?.tags) ? c.taxonomy.tags : [];

  const contact: FluentCrmContact = {
    id: typeof c?.id === 'number' ? c.id : undefined,
    email: String(c?.email ?? email),
    first_name: typeof c?.first_name === 'string' ? c.first_name : c?.firstName,
    last_name: typeof c?.last_name === 'string' ? c.last_name : c?.lastName,
    tags: Array.isArray(tags) ? tags.map((t: any) => ({ id: Number(t.id ?? 0), title: String(t.title ?? t.name ?? '') })) : [],
    meta: typeof c?.meta === 'object' && c?.meta ? c.meta : undefined,
  };

  return contact;
}