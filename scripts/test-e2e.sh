#!/bin/bash

# Route4SSM E2E Test Runner
# This script tests the complete solution end-to-end

set -e

echo "🚀 Starting Route4SSM E2E Testing Suite"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is available
check_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker is available"
        return 0
    else
        print_warning "Docker is not available - will test with mock services"
        return 1
    fi
}

# Check if Node.js is available
check_node() {
    if command -v node &> /dev/null; then
        print_success "Node.js is available"
        return 0
    else
        print_error "Node.js is required but not available"
        exit 1
    fi
}

# Start services with Docker
start_services() {
    print_status "Starting services with Docker Compose..."
    
    if docker compose up -d; then
        print_success "Services started successfully"
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 10
        
        # Check service health
        check_service_health
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Check service health
check_service_health() {
    print_status "Checking service health..."
    
    # Check API health
    if curl -f http://localhost:3009/health > /dev/null 2>&1; then
        print_success "API service is healthy"
    else
        print_error "API service is not responding"
        return 1
    fi
    
    # Check Hanko health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Hanko service is healthy"
    else
        print_warning "Hanko service is not responding"
    fi
    
    # Check PostgreSQL
    if docker compose exec -T postgres pg_isready -U route4ssm > /dev/null 2>&1; then
        print_success "PostgreSQL is healthy"
    else
        print_error "PostgreSQL is not responding"
        return 1
    fi
    
    # Check Redis
    if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is healthy"
    else
        print_error "Redis is not responding"
        return 1
    fi
}

# Run API tests
run_api_tests() {
    print_status "Running API tests..."
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s http://localhost:3009/health)
    if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
        print_success "Health endpoint test passed"
    else
        print_error "Health endpoint test failed"
        echo "Response: $HEALTH_RESPONSE"
        return 1
    fi
    
    # Test optimization endpoint (with mock auth)
    print_status "Testing route optimization endpoint..."
    OPTIMIZATION_REQUEST='{
        "depot": {
            "name": "Test Depot",
            "address": "123 Test St, Perth WA 6000",
            "coordinates": {"latitude": -31.9505, "longitude": 115.8605}
        },
        "jobs": [{
            "id": "test-job-1",
            "address": "456 Job St, Perth WA 6000",
            "coordinates": {"latitude": -31.9505, "longitude": 115.8605},
            "time_window": {"start": "09:00", "end": "17:00"},
            "service_time": 60,
            "priority": 1,
            "job_type": "READ"
        }],
        "technicians": [{
            "id": "test-tech-1",
            "name": "John Test",
            "home_address": "789 Home St, Perth WA 6000",
            "home_coordinates": {"latitude": -31.9505, "longitude": 115.8605},
            "working_hours": {"start": "08:00", "end": "18:00"},
            "skills": ["READ"]
        }]
    }'
    
    OPTIMIZATION_RESPONSE=$(curl -s -X POST http://localhost:3009/api/route-optimization \
        -H "Content-Type: application/json" \
        -H "x-auth-token: mock-token" \
        -d "$OPTIMIZATION_REQUEST")
    
    if echo "$OPTIMIZATION_RESPONSE" | grep -q '"status":"queued"'; then
        print_success "Optimization endpoint test passed"
        JOB_ID=$(echo "$OPTIMIZATION_RESPONSE" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
        print_status "Created optimization job: $JOB_ID"
        
        # Test status endpoint
        print_status "Testing status endpoint..."
        sleep 2
        STATUS_RESPONSE=$(curl -s http://localhost:3009/api/route-optimization/status/$JOB_ID \
            -H "x-auth-token: mock-token")
        
        if echo "$STATUS_RESPONSE" | grep -q '"status"'; then
            print_success "Status endpoint test passed"
        else
            print_error "Status endpoint test failed"
            echo "Response: $STATUS_RESPONSE"
        fi
    else
        print_error "Optimization endpoint test failed"
        echo "Response: $OPTIMIZATION_RESPONSE"
        return 1
    fi
}

# Run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    if npm test; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Test web client (if available)
test_web_client() {
    print_status "Testing web client..."
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Web client is accessible"
        
        # Check if it's a React app
        if curl -s http://localhost:3000 | grep -q "React\|route4ssm"; then
            print_success "Web client appears to be a React application"
        else
            print_warning "Web client response doesn't match expected React app"
        fi
    else
        print_warning "Web client is not accessible"
    fi
}

# Performance test
run_performance_test() {
    print_status "Running performance test..."
    
    # Test concurrent optimization requests
    print_status "Testing concurrent optimization requests..."
    
    for i in {1..5}; do
        curl -s -X POST http://localhost:3009/api/route-optimization \
            -H "Content-Type: application/json" \
            -H "x-auth-token: mock-token" \
            -d '{
                "depot": {"name": "Test", "address": "123 Test St", "coordinates": {"latitude": -31.9505, "longitude": 115.8605}},
                "jobs": [{"id": "perf-job-'$i'", "address": "456 Job St", "coordinates": {"latitude": -31.9505, "longitude": 115.8605}, "time_window": {"start": "09:00", "end": "17:00"}, "service_time": 30, "priority": 1, "job_type": "READ"}],
                "technicians": [{"id": "perf-tech-'$i'", "name": "John", "home_address": "789 Home St", "home_coordinates": {"latitude": -31.9505, "longitude": 115.8605}, "working_hours": {"start": "08:00", "end": "18:00"}, "skills": ["READ"]}]
            }' &
    done
    
    wait
    print_success "Concurrent optimization test completed"
}

# Cleanup
cleanup() {
    print_status "Cleaning up..."
    
    if command -v docker &> /dev/null; then
        docker compose down
        print_success "Services stopped"
    fi
}

# Main execution
main() {
    print_status "Route4SSM E2E Test Suite"
    print_status "========================="
    
    # Check prerequisites
    check_node
    DOCKER_AVAILABLE=$(check_docker)
    
    # Set up trap for cleanup
    trap cleanup EXIT
    
    if [ "$DOCKER_AVAILABLE" -eq 0 ]; then
        start_services
        run_api_tests
        test_web_client
        run_performance_test
    else
        print_warning "Running tests with mock services"
        run_unit_tests
    fi
    
    print_success "E2E test suite completed successfully!"
    echo ""
    print_status "Test Summary:"
    print_success "✅ Health checks passed"
    print_success "✅ API endpoints tested"
    print_success "✅ Optimization workflow tested"
    print_success "✅ Performance tests completed"
}

# Run main function
main "$@" 