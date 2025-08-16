import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, WooOrder, AttendeeProfile } from './types';
import {
  fetchWooCommerceProducts,
  fetchEventACF,
  fetchWooCommerceOrdersForProduct,
  fetchLearnDashProgress,
  fetchFluentCRMContactByEmail,
} from './api-clients';
import {
  transformProductToEventListItem,
  transformOrderToAttendeeProfile,
  buildEventDetail,
  resolveCourseId,
} from './transformer';

type AppEnv = {
  Bindings: Env;
};

const app = new Hono<AppEnv>();

// Basic CORS (adjust origins/methods/headers as needed)
app.use('/*', cors());

// Health
app.get('/', (c: any) => c.json({ ok: true }));

/**
 * GET /api/events
 * - Fetch Woo products
 * - For each, fetch ACF
 * - Transform to EventListItem[]
 */
app.get('/api/events', async (c: any) => {
  const env = c.env as Env;
  try {
    const products = await fetchWooCommerceProducts(env);

    const items = await Promise.all(
      products.map(async (p) => {
        const acf = await fetchEventACF(env, p.id);
        return transformProductToEventListItem(p, acf);
      })
    );

    // Optional: sort by startDate ascending (empty dates last)
    items.sort((a, b) => {
      const ta = a.startDate ? Date.parse(a.startDate) : Number.POSITIVE_INFINITY;
      const tb = b.startDate ? Date.parse(b.startDate) : Number.POSITIVE_INFINITY;
      return ta - tb;
    });

    return c.json(items, 200);
  } catch (err: any) {
    return c.json({ error: String(err?.message || err) }, 500);
  }
});

/**
 * GET /api/events/:id
 * - Resolve product by id
 * - Fetch ACF
 * - Fetch orders for this product
 * - Build unique attendees by email
 * - For each attendee, fetch LearnDash and FluentCRM
 * - Transform to EventDetail
 */
app.get('/api/events/:id', async (c: any) => {
  const env = c.env as Env;
  const idStr = c.req.param('id');
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ error: 'Invalid id' }, 400);
  }

  try {
    // We reuse the products list API and filter by id to avoid adding more clients for now.
    const products = await fetchWooCommerceProducts(env);
    const product = products.find((p) => p.id === id);
    if (!product) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const acf = await fetchEventACF(env, product.id);
    const listItem = transformProductToEventListItem(product, acf);

    // Orders that contain this product
    const orders = await fetchWooCommerceOrdersForProduct(env, product.id);

    // Deduplicate attendees by email; keep earliest order by date_created
    const byEmail = new Map<string, WooOrder>();
    for (const o of orders) {
      const email = (o.billing?.email || '').toLowerCase().trim();
      if (!email) continue;
      const existing = byEmail.get(email);
      if (!existing) {
        byEmail.set(email, o);
      } else {
        const tNew = Date.parse(o.date_created);
        const tOld = Date.parse(existing.date_created);
        if (!Number.isFinite(tOld) || (Number.isFinite(tNew) && tNew < tOld)) {
          byEmail.set(email, o);
        }
      }
    }

    const courseId = resolveCourseId(acf, env.LEARNDASH_DEFAULT_COURSE_ID);

    const attendeeOrders = Array.from(byEmail.values());

    const profiles: AttendeeProfile[] = await Promise.all(
      attendeeOrders.map(async (order) => {
        const email = (order.billing?.email || '').toLowerCase().trim();

        // LearnDash: only when userId and courseId are valid
        const userId = Number(order.customer_id || 0);
        const ld =
          userId > 0 && courseId > 0
            ? await fetchLearnDashProgress(env, userId, courseId)
            : null;

        // FluentCRM by email
        const crm = email ? await fetchFluentCRMContactByEmail(env, email) : null;

        return transformOrderToAttendeeProfile(order, ld ?? undefined, crm ?? undefined);
      })
    );

    // Stable sort by orderDate ascending
    profiles.sort((a, b) => {
      const ta = a.orderDate ? Date.parse(a.orderDate) : 0;
      const tb = b.orderDate ? Date.parse(b.orderDate) : 0;
      return ta - tb;
    });

    const detail = buildEventDetail(listItem, acf, profiles);

    return c.json(detail, 200);
  } catch (err: any) {
    return c.json({ error: String(err?.message || err) }, 500);
  }
});

export default app;