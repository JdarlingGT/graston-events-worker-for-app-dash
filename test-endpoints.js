/**
 * Test script for Event Coordinator's Command Center API endpoints
 * Run this script to verify all CRUD operations are working correctly
 */

const BASE_URL = 'http://localhost:8787'; // Adjust this to your worker URL

// Test data
const testEvent = {
  name: 'Test Event - Graston Technique Workshop',
  price: 299.99,
  description: 'Learn advanced Graston Technique methods',
  capacity: 30,
  status: 'publish',
  acf: {
    startDate: '2024-03-15',
    overview: 'Comprehensive workshop on Graston Technique',
    schedule: 'Day 1: Theory, Day 2: Practice',
    ceus: 16,
    courseId: 101
  }
};

const testVenue = {
  name: 'Test Conference Center',
  location: '789 Test Street, Test City',
  capacity: 200
};

const testInstructor = {
  name: 'Dr. Test Smith',
  expertise: 'Graston Technique',
  experience: 10
};

// Helper function to make requests
async function makeRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

// Test functions
async function testEventEndpoints() {
  console.log('\n=== Testing Event Endpoints ===\n');
  
  // Test GET all events
  console.log('1. GET /api/events');
  const getAllEvents = await makeRequest('GET', '/api/events');
  console.log(`   Status: ${getAllEvents.status}`);
  console.log(`   Events count: ${Array.isArray(getAllEvents.data) ? getAllEvents.data.length : 'N/A'}`);
  
  // Test POST new event
  console.log('\n2. POST /api/events');
  const createEvent = await makeRequest('POST', '/api/events', testEvent);
  console.log(`   Status: ${createEvent.status}`);
  const eventId = createEvent.data?.id;
  console.log(`   Created event ID: ${eventId || 'Failed to create'}`);
  
  if (eventId) {
    // Test GET single event
    console.log(`\n3. GET /api/events/${eventId}`);
    const getEvent = await makeRequest('GET', `/api/events/${eventId}`);
    console.log(`   Status: ${getEvent.status}`);
    console.log(`   Event title: ${getEvent.data?.title || 'N/A'}`);
    console.log(`   Has attendees data: ${Array.isArray(getEvent.data?.attendees) ? 'Yes' : 'No'}`);
    
    // Test PUT update event
    console.log(`\n4. PUT /api/events/${eventId}`);
    const updateData = { name: 'Updated Test Event', price: 399.99 };
    const updateEvent = await makeRequest('PUT', `/api/events/${eventId}`, updateData);
    console.log(`   Status: ${updateEvent.status}`);
    
    // Test DELETE event
    console.log(`\n5. DELETE /api/events/${eventId}`);
    const deleteEvent = await makeRequest('DELETE', `/api/events/${eventId}`);
    console.log(`   Status: ${deleteEvent.status}`);
    console.log(`   Message: ${deleteEvent.data?.message || 'N/A'}`);
  }
}

async function testVenueEndpoints() {
  console.log('\n=== Testing Venue Endpoints ===\n');
  
  // Test GET all venues
  console.log('1. GET /api/venues');
  const getAllVenues = await makeRequest('GET', '/api/venues');
  console.log(`   Status: ${getAllVenues.status}`);
  console.log(`   Venues count: ${Array.isArray(getAllVenues.data) ? getAllVenues.data.length : 'N/A'}`);
  
  // Test POST new venue
  console.log('\n2. POST /api/venues');
  const createVenue = await makeRequest('POST', '/api/venues', testVenue);
  console.log(`   Status: ${createVenue.status}`);
  const venueId = createVenue.data?.id;
  console.log(`   Created venue ID: ${venueId || 'Failed to create'}`);
  
  if (venueId) {
    // Test GET single venue
    console.log(`\n3. GET /api/venues/${venueId}`);
    const getVenue = await makeRequest('GET', `/api/venues/${venueId}`);
    console.log(`   Status: ${getVenue.status}`);
    console.log(`   Venue name: ${getVenue.data?.name || 'N/A'}`);
    
    // Test PUT update venue
    console.log(`\n4. PUT /api/venues/${venueId}`);
    const updateData = { name: 'Updated Test Venue', capacity: 250 };
    const updateVenue = await makeRequest('PUT', `/api/venues/${venueId}`, updateData);
    console.log(`   Status: ${updateVenue.status}`);
    
    // Test DELETE venue
    console.log(`\n5. DELETE /api/venues/${venueId}`);
    const deleteVenue = await makeRequest('DELETE', `/api/venues/${venueId}`);
    console.log(`   Status: ${deleteVenue.status}`);
    console.log(`   Message: ${deleteVenue.data?.message || 'N/A'}`);
  }
}

async function testInstructorEndpoints() {
  console.log('\n=== Testing Instructor Endpoints ===\n');
  
  // Test GET all instructors
  console.log('1. GET /api/instructors');
  const getAllInstructors = await makeRequest('GET', '/api/instructors');
  console.log(`   Status: ${getAllInstructors.status}`);
  console.log(`   Instructors count: ${Array.isArray(getAllInstructors.data) ? getAllInstructors.data.length : 'N/A'}`);
  
  // Test POST new instructor
  console.log('\n2. POST /api/instructors');
  const createInstructor = await makeRequest('POST', '/api/instructors', testInstructor);
  console.log(`   Status: ${createInstructor.status}`);
  const instructorId = createInstructor.data?.id;
  console.log(`   Created instructor ID: ${instructorId || 'Failed to create'}`);
  
  if (instructorId) {
    // Test GET single instructor
    console.log(`\n3. GET /api/instructors/${instructorId}`);
    const getInstructor = await makeRequest('GET', `/api/instructors/${instructorId}`);
    console.log(`   Status: ${getInstructor.status}`);
    console.log(`   Instructor name: ${getInstructor.data?.name || 'N/A'}`);
    
    // Test PUT update instructor
    console.log(`\n4. PUT /api/instructors/${instructorId}`);
    const updateData = { name: 'Dr. Updated Test', experience: 15 };
    const updateInstructor = await makeRequest('PUT', `/api/instructors/${instructorId}`, updateData);
    console.log(`   Status: ${updateInstructor.status}`);
    
    // Test DELETE instructor
    console.log(`\n5. DELETE /api/instructors/${instructorId}`);
    const deleteInstructor = await makeRequest('DELETE', `/api/instructors/${instructorId}`);
    console.log(`   Status: ${deleteInstructor.status}`);
    console.log(`   Message: ${deleteInstructor.data?.message || 'N/A'}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('Starting API Endpoint Tests...');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('================================');
  
  try {
    // Test health endpoint first
    console.log('\n=== Testing Health Check ===\n');
    const health = await makeRequest('GET', '/');
    console.log(`Health check status: ${health.status}`);
    console.log(`Response: ${JSON.stringify(health.data)}`);
    
    // Run all endpoint tests
    await testEventEndpoints();
    await testVenueEndpoints();
    await testInstructorEndpoints();
    
    console.log('\n================================');
    console.log('All tests completed!');
    console.log('\nNote: Event CRUD operations require actual WordPress/WooCommerce backend.');
    console.log('Venue and Instructor endpoints are using mock data for now.');
  } catch (error) {
    console.error('\nTest suite failed:', error);
  }
}

// Run tests if this is the main module
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testEventEndpoints, testVenueEndpoints, testInstructorEndpoints };