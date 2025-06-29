# Route4SSM API Documentation

## Overview

The Route4SSM API provides route optimization services for job scheduling and technician routing. The API supports multiple routing providers, time window constraints, and priority-based optimization.

**Base URL**: `http://localhost:3009` (development)  
**Authentication**: Required for all endpoints (JWT token via `x-auth-token` header)  
**Content-Type**: `application/json`

## Authentication

All API endpoints require authentication using a JWT token in the request header:

```http
x-auth-token: <your-jwt-token>
```

## Health Check

### Get Service Health

Returns the current health status of the API service.

* **URL**  
  `/health`
* **Method**  
  `GET`
* **URL Params**  
  None
* **Data Params**  
  None
* **Success Response:**  
  * **Code:** 200  
  **Content:** 
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-12-19T10:30:00.000Z",
    "service": "route4ssm-api",
    "version": "1.0.0"
  }
  ```
* **Error Response:**  
  * **Code:** 503 SERVICE UNAVAILABLE  
  **Content:** 
  ```json
  {
    "status": "unhealthy",
    "error": "Database connection failed"
  }
  ```
* **Sample Call:**  
  ```bash
  curl -X GET http://localhost:3009/health
  ```
* **Notes:**  
  This endpoint does not require authentication and is used for health monitoring.

## Route Optimization

### Create Optimization Job

Creates a new route optimization job for the given jobs and technicians.

* **URL**  
  `/api/route-optimization`
* **Method**  
  `POST`
* **URL Params**  
  None
* **Data Params**  
  ```json
  {
    "depot": {
      "name": "string",
      "address": "string",
      "coordinates": {
        "latitude": "number",
        "longitude": "number"
      }
    },
    "jobs": [
      {
        "id": "string",
        "address": "string",
        "coordinates": {
          "latitude": "number",
          "longitude": "number"
        },
        "time_window": {
          "start": "string (HH:mm)",
          "end": "string (HH:mm)"
        },
        "service_time": "number (minutes)",
        "priority": "number (1-5)",
        "job_type": "string",
        "technician_id": "string (optional)"
      }
    ],
    "technicians": [
      {
        "id": "string",
        "name": "string",
        "home_address": "string",
        "home_coordinates": {
          "latitude": "number",
          "longitude": "number"
        },
        "working_hours": {
          "start": "string (HH:mm)",
          "end": "string (HH:mm)"
        },
        "skills": ["string"]
      }
    ]
  }
  ```
* **Success Response:**  
  * **Code:** 201 CREATED  
  **Content:** 
  ```json
  {
    "jobId": "uuid-string",
    "status": "queued",
    "message": "Optimization job created successfully"
  }
  ```
* **Error Response:**  
  * **Code:** 400 BAD REQUEST  
  **Content:** 
  ```json
  {
    "error": "At least one job is required for optimization"
  }
  ```
  OR
  * **Code:** 401 UNAUTHORIZED  
  **Content:** 
  ```json
  {
    "error": "No token provided"
  }
  ```
  OR
  * **Code:** 422 UNPROCESSABLE ENTITY  
  **Content:** 
  ```json
  {
    "error": "Invalid time format (HH:mm)"
  }
  ```
* **Sample Call:**  
  ```bash
  curl -X POST http://localhost:3009/api/route-optimization \
    -H "Content-Type: application/json" \
    -H "x-auth-token: your-jwt-token" \
    -d '{
      "depot": {
        "name": "Main Depot",
        "address": "123 Main St, Perth WA 6000",
        "coordinates": {"latitude": -31.9505, "longitude": 115.8605}
      },
      "jobs": [{
        "id": "job-001",
        "address": "456 Job St, Perth WA 6000",
        "coordinates": {"latitude": -31.9505, "longitude": 115.8605},
        "time_window": {"start": "09:00", "end": "17:00"},
        "service_time": 60,
        "priority": 1,
        "job_type": "READ"
      }],
      "technicians": [{
        "id": "tech-001",
        "name": "John Doe",
        "home_address": "789 Home St, Perth WA 6000",
        "home_coordinates": {"latitude": -31.9505, "longitude": 115.8605},
        "working_hours": {"start": "08:00", "end": "18:00"},
        "skills": ["READ"]
      }]
    }'
  ```
* **Notes:**  
  - Job priority: 1 (highest) to 5 (lowest)
  - Time format must be HH:mm (24-hour)
  - Service time is in minutes
  - Coordinates must be valid latitude/longitude values

### Get Optimization Status

Retrieves the current status of an optimization job.

* **URL**  
  `/api/route-optimization/status/:jobId`
* **Method**  
  `GET`
* **URL Params**  
  **Required:**  
  `jobId=[uuid]`
* **Data Params**  
  None
* **Success Response:**  
  * **Code:** 200 OK  
  **Content:** 
  ```json
  {
    "jobId": "uuid-string",
    "status": "completed|processing|failed|queued",
    "progress": 75,
    "timestamp": "2024-12-19T10:30:00.000Z",
    "failedReason": "string (if failed)"
  }
  ```
* **Error Response:**  
  * **Code:** 404 NOT FOUND  
  **Content:** 
  ```json
  {
    "error": "Optimization job not found"
  }
  ```
  OR
  * **Code:** 400 BAD REQUEST  
  **Content:** 
  ```json
  {
    "error": "Invalid job ID format"
  }
  ```
* **Sample Call:**  
  ```bash
  curl -X GET http://localhost:3009/api/route-optimization/status/job-uuid-here \
    -H "x-auth-token: your-jwt-token"
  ```
* **Notes:**  
  - Progress is a percentage (0-100)
  - Status can be: queued, processing, completed, failed

### Get Optimization Result

Retrieves the completed optimization results.

* **URL**  
  `/api/route-optimization/result/:jobId`
* **Method**  
  `GET`
* **URL Params**  
  **Required:**  
  `jobId=[uuid]`
* **Data Params**  
  None
* **Success Response:**  
  * **Code:** 200 OK  
  **Content:** 
  ```json
  {
    "jobId": "uuid-string",
    "status": "completed",
    "result": {
      "summary": {
        "total_jobs": 10,
        "total_routes": 3,
        "total_distance": 145.7,
        "total_time": 420,
        "optimization_score": 0.85
      },
      "routes": [
        {
          "technician_id": "tech-001",
          "total_distance": 45.2,
          "total_time": 180,
          "total_service_time": 120,
          "stops": [
            {
              "sequence": 1,
              "type": "depot",
              "location": {
                "address": "Main Depot",
                "coordinates": {"latitude": -31.9505, "longitude": 115.8605}
              },
              "arrival_time": "08:00",
              "departure_time": "08:00"
            },
            {
              "sequence": 2,
              "type": "job",
              "job_id": "job-001",
              "location": {
                "address": "456 Job St, Perth WA 6000",
                "coordinates": {"latitude": -31.9505, "longitude": 115.8605}
              },
              "arrival_time": "08:15",
              "departure_time": "09:15",
              "service_time": 60
            }
          ]
        }
      ]
    },
    "completedAt": "2024-12-19T10:34:23.000Z"
  }
  ```
* **Error Response:**  
  * **Code:** 202 ACCEPTED  
  **Content:** 
  ```json
  {
    "jobId": "uuid-string",
    "status": "processing",
    "message": "Optimization is still in progress"
  }
  ```
  OR
  * **Code:** 400 BAD REQUEST  
  **Content:** 
  ```json
  {
    "error": "Optimization failed: Invalid coordinates"
  }
  ```
  OR
  * **Code:** 404 NOT FOUND  
  **Content:** 
  ```json
  {
    "error": "Optimization job not found"
  }
  ```
* **Sample Call:**  
  ```bash
  curl -X GET http://localhost:3009/api/route-optimization/result/job-uuid-here \
    -H "x-auth-token: your-jwt-token"
  ```
* **Notes:**  
  - Only returns results for completed jobs
  - Distance is in kilometers
  - Time is in minutes
  - Optimization score is 0.0 to 1.0

## Jobs Management

### List Jobs

Retrieves a list of all jobs.

* **URL**  
  `/api/jobs`
* **Method**  
  `GET`
* **URL Params**  
  **Optional:**  
  `status=[string]` - Filter by job status  
  `technician_id=[string]` - Filter by assigned technician  
  `limit=[number]` - Number of jobs to return (default: 50)  
  `offset=[number]` - Number of jobs to skip (default: 0)
* **Data Params**  
  None
* **Success Response:**  
  * **Code:** 200 OK  
  **Content:** 
  ```json
  {
    "jobs": [
      {
        "id": "job-001",
        "address": "456 Job St, Perth WA 6000",
        "coordinates": {"latitude": -31.9505, "longitude": 115.8605},
        "time_window": {"start": "09:00", "end": "17:00"},
        "service_time": 60,
        "priority": 1,
        "status": "pending",
        "technician_id": "tech-001",
        "created_at": "2024-12-19T10:30:00.000Z",
        "updated_at": "2024-12-19T10:30:00.000Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
  ```
* **Error Response:**  
  * **Code:** 401 UNAUTHORIZED  
  **Content:** 
  ```json
  {
    "error": "No token provided"
  }
  ```
* **Sample Call:**  
  ```bash
  curl -X GET "http://localhost:3009/api/jobs?status=pending&limit=10" \
    -H "x-auth-token: your-jwt-token"
  ```

### Get Job

Retrieves a specific job by ID.

* **URL**  
  `/api/jobs/:id`
* **Method**  
  `GET`
* **URL Params**  
  **Required:**  
  `id=[uuid]`
* **Data Params**  
  None
* **Success Response:**  
  * **Code:** 200 OK  
  **Content:** 
  ```json
  {
    "id": "job-001",
    "address": "456 Job St, Perth WA 6000",
    "coordinates": {"latitude": -31.9505, "longitude": 115.8605},
    "time_window": {"start": "09:00", "end": "17:00"},
    "service_time": 60,
    "priority": 1,
    "status": "pending",
    "technician_id": "tech-001",
    "created_at": "2024-12-19T10:30:00.000Z",
    "updated_at": "2024-12-19T10:30:00.000Z"
  }
  ```
* **Error Response:**  
  * **Code:** 404 NOT FOUND  
  **Content:** 
  ```json
  {
    "error": "Job not found"
  }
  ```
* **Sample Call:**  
  ```bash
  curl -X GET http://localhost:3009/api/jobs/job-001 \
    -H "x-auth-token: your-jwt-token"
  ```

### Create Job

Creates a new job.

* **URL**  
  `/api/jobs`
* **Method**  
  `POST`
* **URL Params**  
  None
* **Data Params**  
  ```json
  {
    "address": "string",
    "coordinates": {
      "latitude": "number",
      "longitude": "number"
    },
    "time_window": {
      "start": "string (HH:mm)",
      "end": "string (HH:mm)"
    },
    "service_time": "number (minutes)",
    "priority": "number (1-5)",
    "job_type": "string",
    "technician_id": "string (optional)"
  }
  ```
* **Success Response:**  
  * **Code:** 201 CREATED  
  **Content:** 
  ```json
  {
    "id": "job-001",
    "address": "456 Job St, Perth WA 6000",
    "coordinates": {"latitude": -31.9505, "longitude": 115.8605},
    "time_window": {"start": "09:00", "end": "17:00"},
    "service_time": 60,
    "priority": 1,
    "status": "pending",
    "created_at": "2024-12-19T10:30:00.000Z"
  }
  ```
* **Error Response:**  
  * **Code:** 400 BAD REQUEST  
  **Content:** 
  ```json
  {
    "error": "Invalid coordinates"
  }
  ```
* **Sample Call:**  
  ```bash
  curl -X POST http://localhost:3009/api/jobs \
    -H "Content-Type: application/json" \
    -H "x-auth-token: your-jwt-token" \
    -d '{
      "address": "456 Job St, Perth WA 6000",
      "coordinates": {"latitude": -31.9505, "longitude": 115.8605},
      "time_window": {"start": "09:00", "end": "17:00"},
      "service_time": 60,
      "priority": 1,
      "job_type": "READ"
    }'
  ```

## Technicians Management

### List Technicians

Retrieves a list of all technicians.

* **URL**  
  `/api/technicians`
* **Method**  
  `GET`
* **URL Params**  
  **Optional:**  
  `status=[string]` - Filter by technician status  
  `skills=[string]` - Filter by skills (comma-separated)  
  `limit=[number]` - Number of technicians to return (default: 50)  
  `offset=[number]` - Number of technicians to skip (default: 0)
* **Data Params**  
  None
* **Success Response:**  
  * **Code:** 200 OK  
  **Content:** 
  ```json
  {
    "technicians": [
      {
        "id": "tech-001",
        "name": "John Doe",
        "home_address": "789 Home St, Perth WA 6000",
        "home_coordinates": {"latitude": -31.9505, "longitude": 115.8605},
        "working_hours": {"start": "08:00", "end": "18:00"},
        "skills": ["READ"],
        "status": "active",
        "created_at": "2024-12-19T10:30:00.000Z",
        "updated_at": "2024-12-19T10:30:00.000Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
  ```
* **Error Response:**  
  * **Code:** 401 UNAUTHORIZED  
  **Content:** 
  ```json
  {
    "error": "No token provided"
  }
  ```
* **Sample Call:**  
  ```bash
  curl -X GET "http://localhost:3009/api/technicians?skills=READ&status=active" \
    -H "x-auth-token: your-jwt-token"
  ```

### Get Technician

Retrieves a specific technician by ID.

* **URL**  
  `/api/technicians/:id`
* **Method**  
  `GET`
* **URL Params**  
  **Required:**  
  `id=[uuid]`
* **Data Params**  
  None
* **Success Response:**  
  * **Code:** 200 OK  
  **Content:** 
  ```json
  {
    "id": "tech-001",
    "name": "John Doe",
    "home_address": "789 Home St, Perth WA 6000",
    "home_coordinates": {"latitude": -31.9505, "longitude": 115.8605},
    "working_hours": {"start": "08:00", "end": "18:00"},
    "skills": ["READ"],
    "status": "active",
    "created_at": "2024-12-19T10:30:00.000Z",
    "updated_at": "2024-12-19T10:30:00.000Z"
  }
  ```
* **Error Response:**  
  * **Code:** 404 NOT FOUND  
  **Content:** 
  ```json
  {
    "error": "Technician not found"
  }
  ```
* **Sample Call:**  
  ```bash
  curl -X GET http://localhost:3009/api/technicians/tech-001 \
    -H "x-auth-token: your-jwt-token"
  ```

## Demo Endpoint

### Get Demo Information

Returns information about the API and available features.

* **URL**  
  `/api/demo`
* **Method**  
  `GET`
* **URL Params**  
  None
* **Data Params**  
  None
* **Success Response:**  
  * **Code:** 200 OK  
  **Content:** 
  ```json
  {
    "message": "Route4SSM API is running successfully!",
    "features": [
      "Route optimization algorithm",
      "Priority-based job scheduling",
      "Time window constraints",
      "Multi-technician support",
      "Real-time optimization scoring"
    ],
    "status": "operational",
    "timestamp": "2024-12-19T10:30:00.000Z"
  }
  ```
* **Error Response:**  
  * **Code:** 503 SERVICE UNAVAILABLE  
  **Content:** 
  ```json
  {
    "error": "Service temporarily unavailable"
  }
  ```
* **Sample Call:**  
  ```bash
  curl -X GET http://localhost:3009/api/demo
  ```
* **Notes:**  
  This endpoint does not require authentication and is useful for testing API connectivity.

## Error Handling

### Standard Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **202 Accepted** - Request accepted for processing
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **422 Unprocessable Entity** - Validation errors
- **500 Internal Server Error** - Server error
- **503 Service Unavailable** - Service temporarily unavailable

### Validation Errors

When validation fails, the response includes field-specific errors:

```json
{
  "error": "Validation failed",
  "details": {
    "coordinates.latitude": "Must be between -90 and 90",
    "time_window.start": "Invalid time format (HH:mm)"
  }
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per minute
- **Optimization endpoints**: 10 requests per minute
- **Health check**: No rate limiting

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination using `limit` and `offset` parameters:

```http
GET /api/jobs?limit=20&offset=40
```

Response includes pagination metadata:

```json
{
  "jobs": [...],
  "total": 150,
  "limit": 20,
  "offset": 40,
  "has_more": true
}
```

## Data Types

### Coordinates
```json
{
  "latitude": -31.9505,  // Number between -90 and 90
  "longitude": 115.8605  // Number between -180 and 180
}
```

### Time Window
```json
{
  "start": "09:00",  // String in HH:mm format (24-hour)
  "end": "17:00"     // String in HH:mm format (24-hour)
}
```

### Working Hours
```json
{
  "start": "08:00",  // String in HH:mm format (24-hour)
  "end": "18:00"     // String in HH:mm format (24-hour)
}
```

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Distances are returned in kilometers
- Times are returned in minutes
- Job priorities range from 1 (highest) to 5 (lowest)
- Service times are specified in minutes
- Authentication is required for all endpoints except `/health` and `/api/demo`
- The API supports CORS for cross-origin requests
- All responses are in JSON format
- Request bodies must be valid JSON with `Content-Type: application/json` header

---

**API Version**: 1.0.0  
**Last Updated**: December 2024  
**Base URL**: `http://localhost:3009` (development) 