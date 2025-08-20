# Event Coordinator's Command Center API Documentation

## Overview
This API provides comprehensive endpoints for managing events, venues, and instructors for the Graston Events system. It integrates with WordPress, WooCommerce, ACF (Advanced Custom Fields), LearnDash, and FluentCRM to provide a unified interface for event management.

## Base URL
```
Production: https://your-worker.workers.dev
Development: http://localhost:8787
```

## Authentication
Currently, the API uses environment variables for authentication to WordPress services. CORS is configured for specific origins.

## Endpoints

### Events

#### 1. List All Events
**GET** `/api/events`

Returns a list of all events with basic information.

**Response:**
```json
[
  {
    "id": "123",
    "title": "Graston Technique Essential Training",
    "startDate": "2024-03-15T00:00:00Z",
    "location": "Atlanta, GA",
    "capacity": 30,
    "enrolledCount": 25,
    "status": "upcoming",
    "url": "https://example.com/product/graston-essential"
  }
]
```

#### 2. Get Event Details
**GET** `/api/events/{id}`

Returns comprehensive details for a specific event, including attendee information aggregated from multiple sources.

**Parameters:**
- `id` (required): The event ID

**Response:**
```json
{
  "id": "123",
  "title": "Graston Technique Essential Training",
  "startDate": "2024-03-15T00:00:00Z",
  "location": "Atlanta, GA",
  "capacity": 30,
  "enrolledCount": 25,
  "status": "upcoming",
  "url": "https://example.com/product/graston-essential",
  "overview": "Comprehensive introduction to Graston Technique",
  "schedule": "Day 1: Theory and basics\nDay 2: Hands-on practice",
  "ceus": "16",
  "attendees": [
    {
      "orderId": "456",
      "name": "John Doe",
      "email": "john@example.com",
      "orderDate": "2024-02-01T00:00:00Z",
      "courseProgress": 75,
      "courseStatus": "in-progress",
      "licenseType": "Professional",
      "crmTags": ["VIP", "Returning Customer"]
    }
  ]
}
```

**Data Sources:**
- WooCommerce: Product information, sales data, capacity
- ACF: Custom event details (overview, schedule, CEUs)
- LearnDash: Student progress and course completion status
- FluentCRM: Customer profiles and tags

#### 3. Create Event
**POST** `/api/events`

Creates a new event in WooCommerce.

**Request Body:**
```json
{
  "name": "New Graston Workshop",
  "price": 299.99,
  "description": "Workshop description",
  "capacity": 30,
  "status": "publish",
  "acf": {
    "startDate": "2024-04-01",
    "overview": "Workshop overview",
    "schedule": "Full day workshop",
    "ceus": 8,
    "courseId": 102
  }
}
```

**Response:** 201 Created
```json
{
  "id": 124,
  "name": "New Graston Workshop",
  "status": "publish",
  // ... full product details
}
```

#### 4. Update Event
**PUT** `/api/events/{id}`

Updates an existing event.

**Parameters:**
- `id` (required): The event ID

**Request Body:** (include only fields to update)
```json
{
  "name": "Updated Workshop Name",
  "price": 349.99,
  "capacity": 35,
  "acf": {
    "startDate": "2024-04-15"
  }
}
```

**Response:** 200 OK

#### 5. Delete Event
**DELETE** `/api/events/{id}`

Permanently deletes an event.

**Parameters:**
- `id` (required): The event ID

**Response:** 200 OK
```json
{
  "message": "Event deleted successfully",
  "id": 124
}
```

### Venues

#### 1. List All Venues
**GET** `/api/venues`

Returns a list of all available venues.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Grand Hall",
    "location": "123 Main St",
    "capacity": 500
  }
]
```

#### 2. Get Venue Details
**GET** `/api/venues/{id}`

Returns details for a specific venue.

**Parameters:**
- `id` (required): The venue ID

**Response:** 200 OK

#### 3. Create Venue
**POST** `/api/venues`

Creates a new venue (currently using mock data).

**Request Body:**
```json
{
  "name": "Conference Center",
  "location": "456 Elm St",
  "capacity": 300
}
```

**Response:** 201 Created

#### 4. Update Venue
**PUT** `/api/venues/{id}`

Updates an existing venue.

**Parameters:**
- `id` (required): The venue ID

**Request Body:**
```json
{
  "name": "Updated Venue Name",
  "capacity": 350
}
```

**Response:** 200 OK

#### 5. Delete Venue
**DELETE** `/api/venues/{id}`

Deletes a venue.

**Parameters:**
- `id` (required): The venue ID

**Response:** 200 OK

### Instructors

#### 1. List All Instructors
**GET** `/api/instructors`

Returns a list of all instructors.

**Response:**
```json
[
  {
    "id": "1",
    "name": "John Doe",
    "expertise": "Graston Technique",
    "experience": 5
  }
]
```

#### 2. Get Instructor Details
**GET** `/api/instructors/{id}`

Returns details for a specific instructor.

**Parameters:**
- `id` (required): The instructor ID

**Response:** 200 OK

#### 3. Create Instructor
**POST** `/api/instructors`

Creates a new instructor (currently using mock data).

**Request Body:**
```json
{
  "name": "Jane Smith",
  "expertise": "Sports Medicine",
  "experience": 8
}
```

**Response:** 201 Created

#### 4. Update Instructor
**PUT** `/api/instructors/{id}`

Updates an existing instructor.

**Parameters:**
- `id` (required): The instructor ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "experience": 10
}
```

**Response:** 200 OK

#### 5. Delete Instructor
**DELETE** `/api/instructors/{id}`

Deletes an instructor.

**Parameters:**
- `id` (required): The instructor ID

**Response:** 200 OK

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid id"
}
```

### 404 Not Found
```json
{
  "error": "Event not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch events",
  "code": "EVENTS_FETCH_ERROR",
  "details": "Detailed error message"
}
```

## Environment Variables

The following environment variables are required:

- `WP_BASE_URL`: WordPress site base URL
- `WC_CONSUMER_KEY`: WooCommerce REST API consumer key
- `WC_CONSUMER_SECRET`: WooCommerce REST API consumer secret
- `WP_APP_USER`: WordPress application username
- `WP_APP_PASSWORD`: WordPress application password
- `LEARNDASH_DEFAULT_COURSE_ID`: Default LearnDash course ID (optional)

## Testing

Use the provided `test-endpoints.js` script to verify all endpoints:

```bash
node test-endpoints.js
```

## Notes

1. **Event endpoints** integrate with real WordPress/WooCommerce data
2. **Venue and Instructor endpoints** currently use mock data but are structured for future WordPress integration
3. The Event Detail endpoint (`GET /api/events/{id}`) provides comprehensive data aggregation from multiple sources
4. All endpoints support CORS for specified origins
5. The API is designed to run on Cloudflare Workers for global edge deployment

## Future Enhancements

- [ ] Implement real WordPress custom post types for Venues and Instructors
- [ ] Add pagination support for list endpoints
- [ ] Implement filtering and search capabilities
- [ ] Add webhook support for real-time updates
- [ ] Implement API key authentication for external access
- [ ] Add batch operations support
- [ ] Implement caching strategies for improved performance