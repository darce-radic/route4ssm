# Route4SSM

An API-first route planning and optimization service designed to replace Route4Me for job visit planning. The service provides efficient route optimization considering multiple constraints like time windows, service durations, and job priorities.

## Features

- Multi-depot route optimization
- Time window constraints support
- Service duration handling
- Job priority management
- Multiple technician support
- Real-time route tracking
- Asynchronous optimization processing
- Multiple routing provider support

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- Redis >= 6
- OpenRouteService API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/route4ssm.git
cd route4ssm
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Create the database:
```bash
createdb route4ssm
```

5. Run migrations:
```bash
npm run typeorm migration:run
```

## Development

Start the development server:
```bash
npm run dev
```

Run tests:
```bash
npm test
```

Build for production:
```bash
npm run build
```

## API Documentation

### Route Optimization

```http
POST /api/v1/routes/optimize
```

Request body:
```json
{
  "depot": {
    "name": "Main Depot",
    "address": "123 Main St, Perth WA 6000",
    "coordinates": [-31.9505, 115.8605]
  },
  "jobs": [
    {
      "id": "9495123",
      "client_ref": "5600978571-068024376",
      "address": "14 GRACEFIELD BVD HARRISDALE WA 6112",
      "coordinates": [-32.0707, 115.9441],
      "time_window": {
        "start": "07:00",
        "end": "16:00"
      },
      "service_time": 60,
      "priority": 1,
      "job_type": "READ"
    }
  ],
  "options": {
    "optimization_time_limit": 300,
    "prefer_provider": "openrouteservice",
    "avoid_tolls": false,
    "include_traffic": true
  }
}
```

Response:
```json
{
  "job_id": "opt_123456789",
  "status": "processing",
  "status_url": "/api/v1/routes/optimize/opt_123456789/status"
}
```

### Get Optimization Status

```http
GET /api/v1/routes/optimize/{job_id}/status
```

Response:
```json
{
  "job_id": "opt_123456789",
  "status": "completed",
  "progress": 100,
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:34:23Z",
  "result_url": "/api/v1/routes/optimize/opt_123456789/result"
}
```

### Get Optimization Result

```http
GET /api/v1/routes/optimize/{job_id}/result
```

Response:
```json
{
  "optimization_id": "opt_123456789",
  "routes": [
    {
      "technician_id": "TECH_001",
      "total_distance": 145.7,
      "total_time": 420,
      "stops": [
        {
          "sequence": 1,
          "job_id": "9495123",
          "location": {
            "address": "14 GRACEFIELD BVD HARRISDALE WA 6112",
            "coordinates": [-32.0707, 115.9441]
          },
          "planned_arrival": "07:25",
          "planned_departure": "08:25",
          "service_time": 60
        }
      ]
    }
  ]
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 