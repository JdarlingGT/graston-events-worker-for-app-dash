import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, WooOrder, AttendeeProfile } from './types';
import {
  fetchWooCommerceProducts,
  fetchEventACF,
  fetchWooCommerceOrdersForProduct,
  fetchLearnDashProgress,
  fetchFluentCRMContactByEmail,
  fetchVenues,
  fetchInstructors,
  createVenue,
  createInstructor,
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

// CORS configuration - restrict to known origins in production
app.use('/*', cors({
  origin: ['https://graston-events-page-for-app-dash.pages.dev', 'http://localhost:3000', 'https://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

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
    console.error('Error fetching events:', err);
    return c.json({
      error: 'Failed to fetch events',
      code: 'EVENTS_FETCH_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * POST /api/events
 * Create a new event
 */
app.post('/api/events', async (c: any) => {
  const env = c.env as Env;
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name || !body.price) {
      return c.json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        details: 'name and price are required'
      }, 400);
    }

    // Create product in WooCommerce
    const productData = {
      name: body.name,
      type: 'simple',
      regular_price: String(body.price),
      status: body.status || 'publish',
      manage_stock: body.manage_stock !== false,
      stock_quantity: body.stock_quantity || body.capacity || null,
      description: body.description || '',
      short_description: body.short_description || '',
      categories: body.categories || [],
      images: body.images || [],
      meta_data: body.meta_data || []
    };

    const url = buildUrl(env.WP_BASE_URL, '/wp-json/wc/v3/products', {
      consumer_key: env.WC_CONSUMER_KEY,
      consumer_secret: env.WC_CONSUMER_SECRET,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Graston-Data-Worker/0.1'
      },
      body: JSON.stringify(productData)
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      return c.json({
        error: 'Failed to create event',
        code: 'CREATE_ERROR',
        details: errorText
      }, res.status);
    }

    const createdProduct: any = await res.json();

    // If ACF fields are provided, update them
    if (body.acf) {
      try {
        const acfUrl = buildUrl(env.WP_BASE_URL, `/wp-json/acf/v3/product/${createdProduct.id}`);
        const acfRes = await fetch(acfUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': basicAuth(env.WP_APP_USER, env.WP_APP_PASSWORD),
            'User-Agent': 'Graston-Data-Worker/0.1'
          },
          body: JSON.stringify({ fields: body.acf })
        });

        if (!acfRes.ok) {
          console.error('Failed to update ACF fields:', await acfRes.text());
        }
      } catch (acfError) {
        console.error('Error updating ACF fields:', acfError);
      }
    }

    return c.json(createdProduct, 201);
  } catch (err: any) {
    console.error('Error creating event:', err);
    return c.json({
      error: 'Failed to create event',
      code: 'CREATE_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * PUT /api/events/:id
 * Update an existing event
 */
app.put('/api/events/:id', async (c: any) => {
  const env = c.env as Env;
  const idStr = c.req.param('id');
  const id = Number(idStr);
  
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ error: 'Invalid id' }, 400);
  }

  try {
    const body = await c.req.json();
    
    // Prepare update data (only include fields that are provided)
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.regular_price = String(body.price);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.manage_stock !== undefined) updateData.manage_stock = body.manage_stock;
    if (body.stock_quantity !== undefined) updateData.stock_quantity = body.stock_quantity;
    if (body.capacity !== undefined) updateData.stock_quantity = body.capacity;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.short_description !== undefined) updateData.short_description = body.short_description;
    if (body.categories !== undefined) updateData.categories = body.categories;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.meta_data !== undefined) updateData.meta_data = body.meta_data;

    const url = buildUrl(env.WP_BASE_URL, `/wp-json/wc/v3/products/${id}`, {
      consumer_key: env.WC_CONSUMER_KEY,
      consumer_secret: env.WC_CONSUMER_SECRET,
    });

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Graston-Data-Worker/0.1'
      },
      body: JSON.stringify(updateData)
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      if (res.status === 404) {
        return c.json({ error: 'Event not found' }, 404);
      }
      return c.json({
        error: 'Failed to update event',
        code: 'UPDATE_ERROR',
        details: errorText
      }, res.status);
    }

    const updatedProduct = await res.json();

    // If ACF fields are provided, update them
    if (body.acf) {
      try {
        const acfUrl = buildUrl(env.WP_BASE_URL, `/wp-json/acf/v3/product/${id}`);
        const acfRes = await fetch(acfUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': basicAuth(env.WP_APP_USER, env.WP_APP_PASSWORD),
            'User-Agent': 'Graston-Data-Worker/0.1'
          },
          body: JSON.stringify({ fields: body.acf })
        });

        if (!acfRes.ok) {
          console.error('Failed to update ACF fields:', await acfRes.text());
        }
      } catch (acfError) {
        console.error('Error updating ACF fields:', acfError);
      }
    }

    return c.json(updatedProduct, 200);
  } catch (err: any) {
    console.error(`Error updating event ${id}:`, err);
    return c.json({
      error: 'Failed to update event',
      code: 'UPDATE_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * DELETE /api/events/:id
 * Delete an event
 */
app.delete('/api/events/:id', async (c: any) => {
  const env = c.env as Env;
  const idStr = c.req.param('id');
  const id = Number(idStr);
  
  if (!Number.isFinite(id) || id <= 0) {
    return c.json({ error: 'Invalid id' }, 400);
  }

  try {
    const url = buildUrl(env.WP_BASE_URL, `/wp-json/wc/v3/products/${id}`, {
      consumer_key: env.WC_CONSUMER_KEY,
      consumer_secret: env.WC_CONSUMER_SECRET,
      force: 'true' // Permanently delete instead of moving to trash
    });

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Graston-Data-Worker/0.1'
      }
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      if (res.status === 404) {
        return c.json({ error: 'Event not found' }, 404);
      }
      return c.json({
        error: 'Failed to delete event',
        code: 'DELETE_ERROR',
        details: errorText
      }, res.status);
    }

    const deletedProduct: any = await res.json();
    return c.json({
      message: 'Event deleted successfully',
      id: deletedProduct.id
    }, 200);
  } catch (err: any) {
    console.error(`Error deleting event ${id}:`, err);
    return c.json({
      error: 'Failed to delete event',
      code: 'DELETE_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

// Helper function for basic auth
function basicAuth(user: string, pass: string): string {
  return 'Basic ' + btoa(`${user}:${pass}`);
}

// Helper function to build URLs
function buildUrl(base: string, path: string, query?: Record<string, string | number | undefined | null>): string {
  const u = new URL(path.replace(/^\/+/, ''), base.endsWith('/') ? base : base + '/');
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
    }
  }
  return u.toString();
}

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
    console.error(`Error fetching event detail for ID ${id}:`, err);
    return c.json({
      error: 'Failed to fetch event details',
      code: 'EVENT_DETAIL_FETCH_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * GET /api/venues
 * - Fetch available venues
 */
app.get('/api/venues', async (c: any) => {
  const env = c.env as Env;
  try {
    const venues = await fetchVenues(env);
    return c.json(venues, 200);
  } catch (err: any) {
    console.error('Error fetching venues:', err);
    return c.json({
      error: 'Failed to fetch venues',
      code: 'VENUES_FETCH_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * GET /api/venues/:id
 * - Fetch a specific venue by ID
 */
app.get('/api/venues/:id', async (c: any) => {
  const env = c.env as Env;
  const id = c.req.param('id');
  
  try {
    const venues = await fetchVenues(env);
    const venue = venues.find(v => v.id === id);
    
    if (!venue) {
      return c.json({ error: 'Venue not found' }, 404);
    }
    
    return c.json(venue, 200);
  } catch (err: any) {
    console.error(`Error fetching venue ${id}:`, err);
    return c.json({
      error: 'Failed to fetch venue',
      code: 'VENUE_FETCH_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * POST /api/venues
 * - Create a new venue
 */
app.post('/api/venues', async (c: any) => {
  const env = c.env as Env;
  
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name || !body.location || body.capacity === undefined) {
      return c.json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        details: 'name, location, and capacity are required'
      }, 400);
    }
    
    // Generate a new ID (in production, this would be handled by the database)
    const newVenue = {
      id: String(Date.now()),
      name: body.name,
      location: body.location,
      capacity: Number(body.capacity)
    };
    
    // In production, this would save to WordPress or database
    await createVenue(env, newVenue);
    
    return c.json(newVenue, 201);
  } catch (err: any) {
    console.error('Error creating venue:', err);
    return c.json({
      error: 'Failed to create venue',
      code: 'VENUE_CREATE_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * PUT /api/venues/:id
 * - Update an existing venue
 */
app.put('/api/venues/:id', async (c: any) => {
  const env = c.env as Env;
  const id = c.req.param('id');
  
  try {
    const body = await c.req.json();
    const venues = await fetchVenues(env);
    const venueIndex = venues.findIndex(v => v.id === id);
    
    if (venueIndex === -1) {
      return c.json({ error: 'Venue not found' }, 404);
    }
    
    // Update venue with provided fields
    const updatedVenue = {
      ...venues[venueIndex],
      ...(body.name !== undefined && { name: body.name }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.capacity !== undefined && { capacity: Number(body.capacity) })
    };
    
    // In production, this would update in WordPress or database
    console.log('Updating venue:', updatedVenue);
    
    return c.json(updatedVenue, 200);
  } catch (err: any) {
    console.error(`Error updating venue ${id}:`, err);
    return c.json({
      error: 'Failed to update venue',
      code: 'VENUE_UPDATE_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * DELETE /api/venues/:id
 * - Delete a venue
 */
app.delete('/api/venues/:id', async (c: any) => {
  const env = c.env as Env;
  const id = c.req.param('id');
  
  try {
    const venues = await fetchVenues(env);
    const venue = venues.find(v => v.id === id);
    
    if (!venue) {
      return c.json({ error: 'Venue not found' }, 404);
    }
    
    // In production, this would delete from WordPress or database
    console.log('Deleting venue:', id);
    
    return c.json({
      message: 'Venue deleted successfully',
      id: id
    }, 200);
  } catch (err: any) {
    console.error(`Error deleting venue ${id}:`, err);
    return c.json({
      error: 'Failed to delete venue',
      code: 'VENUE_DELETE_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * GET /api/instructors
 * - Fetch available instructors
 */
app.get('/api/instructors', async (c: any) => {
  const env = c.env as Env;
  try {
    const instructors = await fetchInstructors(env);
    return c.json(instructors, 200);
  } catch (err: any) {
    console.error('Error fetching instructors:', err);
    return c.json({
      error: 'Failed to fetch instructors',
      code: 'INSTRUCTORS_FETCH_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * GET /api/instructors/:id
 * - Fetch a specific instructor by ID
 */
app.get('/api/instructors/:id', async (c: any) => {
  const env = c.env as Env;
  const id = c.req.param('id');
  
  try {
    const instructors = await fetchInstructors(env);
    const instructor = instructors.find(i => i.id === id);
    
    if (!instructor) {
      return c.json({ error: 'Instructor not found' }, 404);
    }
    
    return c.json(instructor, 200);
  } catch (err: any) {
    console.error(`Error fetching instructor ${id}:`, err);
    return c.json({
      error: 'Failed to fetch instructor',
      code: 'INSTRUCTOR_FETCH_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * POST /api/instructors
 * - Create a new instructor
 */
app.post('/api/instructors', async (c: any) => {
  const env = c.env as Env;
  
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name || !body.expertise || body.experience === undefined) {
      return c.json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR',
        details: 'name, expertise, and experience are required'
      }, 400);
    }
    
    // Generate a new ID (in production, this would be handled by the database)
    const newInstructor = {
      id: String(Date.now()),
      name: body.name,
      expertise: body.expertise,
      experience: Number(body.experience)
    };
    
    // In production, this would save to WordPress or database
    await createInstructor(env, newInstructor);
    
    return c.json(newInstructor, 201);
  } catch (err: any) {
    console.error('Error creating instructor:', err);
    return c.json({
      error: 'Failed to create instructor',
      code: 'INSTRUCTOR_CREATE_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * PUT /api/instructors/:id
 * - Update an existing instructor
 */
app.put('/api/instructors/:id', async (c: any) => {
  const env = c.env as Env;
  const id = c.req.param('id');
  
  try {
    const body = await c.req.json();
    const instructors = await fetchInstructors(env);
    const instructorIndex = instructors.findIndex(i => i.id === id);
    
    if (instructorIndex === -1) {
      return c.json({ error: 'Instructor not found' }, 404);
    }
    
    // Update instructor with provided fields
    const updatedInstructor = {
      ...instructors[instructorIndex],
      ...(body.name !== undefined && { name: body.name }),
      ...(body.expertise !== undefined && { expertise: body.expertise }),
      ...(body.experience !== undefined && { experience: Number(body.experience) })
    };
    
    // In production, this would update in WordPress or database
    console.log('Updating instructor:', updatedInstructor);
    
    return c.json(updatedInstructor, 200);
  } catch (err: any) {
    console.error(`Error updating instructor ${id}:`, err);
    return c.json({
      error: 'Failed to update instructor',
      code: 'INSTRUCTOR_UPDATE_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

/**
 * DELETE /api/instructors/:id
 * - Delete an instructor
 */
app.delete('/api/instructors/:id', async (c: any) => {
  const env = c.env as Env;
  const id = c.req.param('id');
  
  try {
    const instructors = await fetchInstructors(env);
    const instructor = instructors.find(i => i.id === id);
    
    if (!instructor) {
      return c.json({ error: 'Instructor not found' }, 404);
    }
    
    // In production, this would delete from WordPress or database
    console.log('Deleting instructor:', id);
    
    return c.json({
      message: 'Instructor deleted successfully',
      id: id
    }, 200);
  } catch (err: any) {
    console.error(`Error deleting instructor ${id}:`, err);
    return c.json({
      error: 'Failed to delete instructor',
      code: 'INSTRUCTOR_DELETE_ERROR',
      details: String(err?.message || err)
    }, 500);
  }
});

export default app;