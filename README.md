# Graston Data Aggregation Worker

Cloudflare Worker that aggregates and synthesizes data from WordPress ecosystem APIs (WooCommerce, ACF, LearnDash, FluentCRM) and exposes clean JSON endpoints for the Graston Command Center.

- Worker entry: [src/index.ts](src/index.ts)
- Types (data contracts): [src/types.ts](src/types.ts)
- API clients: [src/api-clients.ts](src/api-clients.ts)
- Transformation logic: [src/transformer.ts](src/transformer.ts)
- Wrangler config: [wrangler.toml](wrangler.toml)
- Package manifest: [package.json](package.json)

## Endpoints

- GET /api/events
  - Returns an array of clean, aggregated events using [TypeScript.EventListItem()](src/types.ts:5).
  - Source data:
    - WooCommerce Products via [TypeScript.fetchWooCommerceProducts()](src/api-clients.ts:56)
    - ACF fields via [TypeScript.fetchEventACF()](src/api-clients.ts:92)
  - Mapping via [TypeScript.transformProductToEventListItem()](src/transformer.ts:101)

- GET /api/events/:id
  - Returns a detailed event using [TypeScript.EventDetail()](src/types.ts:31).
  - Source data:
    - WooCommerce Product + ACF for ID via [TypeScript.fetchWooCommerceProducts()](src/api-clients.ts:56) and [TypeScript.fetchEventACF()](src/api-clients.ts:92)
    - Orders for product via [TypeScript.fetchWooCommerceOrdersForProduct()](src/api-clients.ts:125)
    - Per attendee:
      - LearnDash course progress via [TypeScript.fetchLearnDashProgress()](src/api-clients.ts:168)
      - FluentCRM contact via [TypeScript.fetchFluentCRMContactByEmail()](src/api-clients.ts:203)
  - Mapping:
    - Order + LD + CRM to attendee via [TypeScript.transformOrderToAttendeeProfile()](src/transformer.ts:136)
    - Combine into detail via [TypeScript.buildEventDetail()](src/transformer.ts:182)

## Data Contracts

Implemented in [src/types.ts](src/types.ts):
- [TypeScript.EventListItem()](src/types.ts:5)
- [TypeScript.AttendeeProfile()](src/types.ts:16)
- [TypeScript.EventDetail()](src/types.ts:31)

Raw shapes consumed for interop:
- [TypeScript.WooProduct()](src/types.ts:41)
- [TypeScript.WooOrder()](src/types.ts:63)
- [TypeScript.ACFEventFields()](src/types.ts:80)
- [TypeScript.LearnDashProgress()](src/types.ts:95)
- [TypeScript.FluentCrmContact()](src/types.ts:101)
- Worker env bindings: [TypeScript.Env()](src/types.ts:114)

## Danger/Watch/Go Logic (Event Status)

Status computation is in [TypeScript.transformProductToEventListItem()](src/transformer.ts:101), using a helper to determine status:

- If startDate is in the past: Completed
- Else if capacity > 0:
  - daysUntil <= 7 and fill < 0.5: Danger
  - daysUntil <= 21 and fill < 0.3: Watch
  - else: Go
- Else (unknown capacity):
  - daysUntil <= 7 and enrolled == 0: Danger
  - daysUntil <= 21 and enrolled <= 2: Watch
  - else: Go

Enrollment is Woo total_sales; capacity prefers product stock (if manage_stock) else ACF capacity.

## Local Development

Prereqs:
- Node.js 18+ (CF recommends 18/20/22)
- Cloudflare account + Wrangler login for deploys

Install:
- npm install

Type-check:
- npm run typecheck

Run locally with Miniflare:
- npm run dev

Wrangler config is in [wrangler.toml](wrangler.toml) with:
- name = "graston-data-api"
- main = "src/index.ts"

CORS is enabled in the worker using [TypeScript.Hono app](src/index.ts:1) with middleware.

## Environment Configuration

Public-ish variables in [wrangler.toml](wrangler.toml):
- WP_BASE_URL: Base URL to your WP site (e.g., https://example.com)
- LEARNDASH_DEFAULT_COURSE_ID: Optional default course ID fallback

Secrets (set via Wrangler; not in version control):
- WC_CONSUMER_KEY
- WC_CONSUMER_SECRET
- WP_APP_USER
- WP_APP_PASSWORD

Set secrets:
- wrangler secret put WC_CONSUMER_KEY
- wrangler secret put WC_CONSUMER_SECRET
- wrangler secret put WP_APP_USER
- wrangler secret put WP_APP_PASSWORD

Optionally override vars per environment via wrangler.toml env sections.

## Deployment

Preview locally:
- npm run dev

Deploy to Cloudflare:
- npm run deploy

Ensure Wrangler is authenticated:
- npx wrangler login

## Implementation Notes

Routing:
- Implemented using Hono. Default export is the app: [TypeScript.default app](src/index.ts:146)

API Clients (all read secrets from Env):
- [TypeScript.fetchWooCommerceProducts()](src/api-clients.ts:56)
- [TypeScript.fetchEventACF()](src/api-clients.ts:92)
- [TypeScript.fetchWooCommerceOrdersForProduct()](src/api-clients.ts:125)
- [TypeScript.fetchLearnDashProgress()](src/api-clients.ts:168)
- [TypeScript.fetchFluentCRMContactByEmail()](src/api-clients.ts:203)

Transformer:
- [TypeScript.transformProductToEventListItem()](src/transformer.ts:101): Parse title/location from product name, determine capacity/enrollment/status
- [TypeScript.transformOrderToAttendeeProfile()](src/transformer.ts:136): Merge Woo order, LearnDash progress, FluentCRM meta/tags
- [TypeScript.buildEventDetail()](src/transformer.ts:182): Combine EventListItem + ACF + attendees
- [TypeScript.resolveCourseId()](src/transformer.ts:203): Course ID from ACF or fallback

Error Handling:
- JSON parsing with detailed HTTP error context
- Conservative fallbacks for LearnDash/FluentCRM if restricted/not found

## Example Responses

GET /api/events
- Array of [TypeScript.EventListItem()](src/types.ts:5)

GET /api/events/:id
- [TypeScript.EventDetail()](src/types.ts:31)

## Performance Considerations

- Woo products and orders are paginated and aggregated client-side (100 per page)
- Orders filtered to processing/completed
- Attendees deduped by email; earliest order retained
- Sequential ACF fetch per product; batching acceptable for expected volumes

## Security

- Secrets are only provided at runtime via Wrangler secrets
- Basic Auth (Application Passwords) used for WP/ACF/LearnDash/FluentCRM where required
- Woo REST uses CK/CS via server-to-server query params

## Troubleshooting

- 401/403 from Woo endpoints: verify WC_CONSUMER_KEY/SECRET
- 401/403 from ACF/LearnDash/FluentCRM: verify WP_APP_USER/PASSWORD and user caps
- Empty LearnDash data: endpoint variants differ by version; code returns defaults gracefully
- Type errors: run npm run typecheck
