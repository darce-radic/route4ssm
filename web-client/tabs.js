// Tab switching functionality
function switchTab(tabName) {
  console.log(`🔄 Switching to tab: ${tabName}`);
  
  // Remove active class from all tabs and panels
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabPanels.forEach(panel => panel.classList.remove('active'));
  
  // Add active class to selected tab and panel
  const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
  const selectedPanel = document.getElementById(`${tabName}-tab`);
  
  if (selectedTab) selectedTab.classList.add('active');
  if (selectedPanel) selectedPanel.classList.add('active');
  
  // Special handling for results tab - show results if available
  if (tabName === 'results' && window.lastOptimizationResult) {
    displayResults(window.lastOptimizationResult);
  }
}

// Load test scenarios
function loadScenario(scenarioType) {
  console.log(`📋 Loading ${scenarioType} scenario...`);
  
  // Update active scenario button
  const scenarioButtons = document.querySelectorAll('.scenario-btn');
  scenarioButtons.forEach(btn => btn.classList.remove('active'));
  
  const activeButton = document.querySelector(`[onclick="loadScenario('${scenarioType}')"]`);
  if (activeButton) activeButton.classList.add('active');
  
  // Switch to optimization tab
  switchTab('optimization');
  
  // Load scenario data with improved format
  const scenarios = {
    small: {
      jobs: [
        { 
          id: "job-1", 
          coordinates: {latitude: -31.9505, longitude: 115.8605}, 
          address: "Perth CBD, WA 6000", 
          time_window: {start: "09:00", end: "12:00"}, 
          service_time: 30, 
          priority: 1, 
          technician_id: "unassigned" 
        },
        { 
          id: "job-2", 
          coordinates: {latitude: -31.9515, longitude: 115.8615}, 
          address: "Northbridge, WA 6003", 
          time_window: {start: "10:00", end: "14:00"}, 
          service_time: 45, 
          priority: 2, 
          technician_id: "unassigned" 
        },
        { 
          id: "job-3", 
          coordinates: {latitude: -31.9525, longitude: 115.8625}, 
          address: "Subiaco, WA 6008", 
          time_window: {start: "11:00", end: "15:00"}, 
          service_time: 60, 
          priority: 1, 
          technician_id: "unassigned" 
        },
        { 
          id: "job-4", 
          coordinates: {latitude: -31.9535, longitude: 115.8635}, 
          address: "Leederville, WA 6007", 
          time_window: {start: "13:00", end: "17:00"}, 
          service_time: 30, 
          priority: 3, 
          technician_id: "unassigned" 
        },
        { 
          id: "job-5", 
          coordinates: {latitude: -31.9545, longitude: 115.8645}, 
          address: "Mount Lawley, WA 6050", 
          time_window: {start: "14:00", end: "18:00"}, 
          service_time: 45, 
          priority: 2, 
          technician_id: "unassigned" 
        }
      ],
      technicians: [
        { 
          id: "tech-1", 
          name: "John Smith", 
          coordinates: {latitude: -31.9500, longitude: 115.8600}, 
          address: "Perth Depot, WA 6000", 
          start_time: "08:00", 
          end_time: "18:00", 
          skills: ["electrical", "plumbing"], 
          capacity: 8 
        },
        { 
          id: "tech-2", 
          name: "Jane Doe", 
          coordinates: {latitude: -31.9550, longitude: 115.8650}, 
          address: "North Depot, WA 6003", 
          start_time: "08:00", 
          end_time: "18:00", 
          skills: ["electrical", "hvac"], 
          capacity: 6 
        }
      ]
    },
    medium: {
      jobs: [
        { id: "job-1", coordinates: {latitude: -31.9505, longitude: 115.8605}, address: "Perth CBD", time_window: {start: "08:00", end: "12:00"}, service_time: 30, priority: 1, technician_id: "unassigned" },
        { id: "job-2", coordinates: {latitude: -31.9515, longitude: 115.8615}, address: "Northbridge", time_window: {start: "09:00", end: "13:00"}, service_time: 45, priority: 2, technician_id: "unassigned" },
        { id: "job-3", coordinates: {latitude: -31.9525, longitude: 115.8625}, address: "Subiaco", time_window: {start: "10:00", end: "14:00"}, service_time: 60, priority: 1, technician_id: "unassigned" },
        { id: "job-4", coordinates: {latitude: -31.9535, longitude: 115.8635}, address: "Leederville", time_window: {start: "11:00", end: "15:00"}, service_time: 30, priority: 3, technician_id: "unassigned" },
        { id: "job-5", coordinates: {latitude: -31.9545, longitude: 115.8645}, address: "Mount Lawley", time_window: {start: "12:00", end: "16:00"}, service_time: 45, priority: 2, technician_id: "unassigned" },
        { id: "job-6", coordinates: {latitude: -31.9555, longitude: 115.8655}, address: "Highgate", time_window: {start: "13:00", end: "17:00"}, service_time: 60, priority: 1, technician_id: "unassigned" },
        { id: "job-7", coordinates: {latitude: -31.9565, longitude: 115.8665}, address: "Inglewood", time_window: {start: "14:00", end: "18:00"}, service_time: 30, priority: 3, technician_id: "unassigned" },
        { id: "job-8", coordinates: {latitude: -31.9575, longitude: 115.8675}, address: "Bayswater", time_window: {start: "15:00", end: "19:00"}, service_time: 45, priority: 2, technician_id: "unassigned" },
        { id: "job-9", coordinates: {latitude: -31.9585, longitude: 115.8685}, address: "Morley", time_window: {start: "16:00", end: "20:00"}, service_time: 60, priority: 1, technician_id: "unassigned" },
        { id: "job-10", coordinates: {latitude: -31.9595, longitude: 115.8695}, address: "Mirrabooka", time_window: {start: "17:00", end: "21:00"}, service_time: 30, priority: 3, technician_id: "unassigned" },
        { id: "job-11", coordinates: {latitude: -31.9605, longitude: 115.8705}, address: "Balga", time_window: {start: "18:00", end: "22:00"}, service_time: 45, priority: 2, technician_id: "unassigned" },
        { id: "job-12", coordinates: {latitude: -31.9615, longitude: 115.8715}, address: "Nollamara", time_window: {start: "19:00", end: "23:00"}, service_time: 60, priority: 1, technician_id: "unassigned" },
        { id: "job-13", coordinates: {latitude: -31.9625, longitude: 115.8725}, address: "Westminster", time_window: {start: "20:00", end: "24:00"}, service_time: 30, priority: 3, technician_id: "unassigned" },
        { id: "job-14", coordinates: {latitude: -31.9635, longitude: 115.8735}, address: "Osborne Park", time_window: {start: "21:00", end: "01:00"}, service_time: 45, priority: 2, technician_id: "unassigned" },
        { id: "job-15", coordinates: {latitude: -31.9645, longitude: 115.8745}, address: "Scarborough", time_window: {start: "22:00", end: "02:00"}, service_time: 60, priority: 1, technician_id: "unassigned" }
      ],
      technicians: [
        { id: "tech-1", name: "John Smith", coordinates: {latitude: -31.9500, longitude: 115.8600}, address: "Perth Depot", start_time: "08:00", end_time: "18:00", skills: ["electrical", "plumbing"], capacity: 8 },
        { id: "tech-2", name: "Jane Doe", coordinates: {latitude: -31.9550, longitude: 115.8650}, address: "North Depot", start_time: "08:00", end_time: "18:00", skills: ["electrical", "hvac"], capacity: 6 },
        { id: "tech-3", name: "Bob Wilson", coordinates: {latitude: -31.9600, longitude: 115.8700}, address: "East Depot", start_time: "08:00", end_time: "18:00", skills: ["plumbing", "hvac"], capacity: 7 },
        { id: "tech-4", name: "Alice Brown", coordinates: {latitude: -31.9650, longitude: 115.8750}, address: "West Depot", start_time: "08:00", end_time: "18:00", skills: ["electrical", "plumbing", "hvac"], capacity: 5 }
      ]
    },
    large: {
      jobs: Array.from({ length: 30 }, (_, i) => ({
        id: `job-${i + 1}`,
        coordinates: {latitude: -31.9505 + (i * 0.001), longitude: 115.8605 + (i * 0.001)},
        address: `Location ${i + 1}, Perth WA`,
        time_window: { start: `${(8 + i % 12).toString().padStart(2, '0')}:00`, end: `${(12 + i % 8).toString().padStart(2, '0')}:00` },
        service_time: 30 + (i % 60),
        priority: (i % 3) + 1,
        technician_id: "unassigned"
      })),
      technicians: Array.from({ length: 8 }, (_, i) => ({
        id: `tech-${i + 1}`,
        name: `Technician ${i + 1}`,
        coordinates: {latitude: -31.9500 + (i * 0.002), longitude: 115.8600 + (i * 0.002)},
        address: `Depot ${i + 1}, Perth WA`,
        start_time: "08:00",
        end_time: "18:00",
        skills: ["electrical", "plumbing", "hvac"].slice(0, (i % 3) + 1),
        capacity: 5 + (i % 5)
      }))
    },
    custom: {
      jobs: [
        {
          "id": "job-1",
          "coordinates": {"latitude": -31.9505, "longitude": 115.8605},
          "address": "123 Test St, Perth WA 6000",
          "time_window": {"start": "09:00", "end": "17:00"},
          "service_time": 60,
          "priority": 1,
          "technician_id": "unassigned"
        }
      ],
      technicians: [
        {
          "id": "tech-1",
          "name": "John Doe",
          "coordinates": {"latitude": -31.9505, "longitude": 115.8605},
          "address": "456 Home St, Perth WA 6000",
          "start_time": "08:00",
          "end_time": "18:00",
          "skills": ["general"],
          "capacity": 8
        }
      ]
    }
  };
  
  const scenario = scenarios[scenarioType];
  if (scenario) {
    document.getElementById('jsonInput').value = JSON.stringify(scenario, null, 2);
    showMessage(`✅ Loaded ${scenarioType} scenario with ${scenario.jobs.length} jobs and ${scenario.technicians.length} technicians`, 'success');
  }
}

// Normalize coordinate format for backend compatibility
function normalizeCoordinates(data) {
  // Deep clone the data to avoid modifying the original
  const normalized = JSON.parse(JSON.stringify(data));
  
  // Normalize job coordinates
  if (normalized.jobs) {
    normalized.jobs.forEach(job => {
      if (job.coordinates) {
        if (typeof job.coordinates.latitude !== 'undefined' && typeof job.coordinates.longitude !== 'undefined') {
          // Convert object format to array format for backend
          job.coordinates = [job.coordinates.longitude, job.coordinates.latitude];
        }
      }
    });
  }
  
  // Normalize technician coordinates
  if (normalized.technicians) {
    normalized.technicians.forEach(tech => {
      if (tech.coordinates) {
        if (typeof tech.coordinates.latitude !== 'undefined' && typeof tech.coordinates.longitude !== 'undefined') {
          // Convert object format to array format for backend
          tech.coordinates = [tech.coordinates.longitude, tech.coordinates.latitude];
        }
      }
    });
  }
  
  return normalized;
}

// Run optimization
async function runOptimization() {
  const jsonInput = document.getElementById('jsonInput').value;
  const algorithm = document.getElementById('algorithm').value;
  const maxIterations = document.getElementById('maxIterations').value;
  const timeLimit = document.getElementById('timeLimit').value;
  
  if (!jsonInput.trim()) {
    showMessage('❌ Please enter JSON data or select a scenario', 'error');
    return;
  }
  
  try {
    const data = JSON.parse(jsonInput);
    console.log('🚀 Running optimization...', { algorithm, maxIterations, timeLimit });
    
    // Normalize coordinate format for backend compatibility
    const normalizedData = normalizeCoordinates(data);
    console.log('📊 Normalized data:', normalizedData);
    
    // Show loading state
    showMessage('🔄 Running optimization... Please wait', 'info');
    
    const response = await fetch('http://localhost:3009/api/route-optimization/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...normalizedData,
        algorithm,
        maxIterations: parseInt(maxIterations),
        timeLimit: parseInt(timeLimit)
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Optimization completed:', result);
    
    // Store result globally
    window.lastOptimizationResult = result;
    
    // Display results
    displayResults(result);
    
    // Switch to results tab
    switchTab('results');
    
    // Visualize on map if available
    if (window.routeView) {
      // TODO: Add map visualization when needed
      console.log('🗺️ Map visualization available');
    }
    
    showMessage('✅ Optimization completed successfully!', 'success');
    
  } catch (error) {
    console.error('❌ Optimization failed:', error);
    showMessage(`❌ Optimization failed: ${error.message}`, 'error');
  }
}

// Display optimization results
function displayResults(result) {
  const resultsContent = document.getElementById('resultsContent');
  
  console.log('📊 Displaying results:', result);
  
  if (!result || !result.routes) {
    console.log('❌ No results or routes found');
    resultsContent.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">📊</div>
        <h4>No Results Yet</h4>
        <p>Run an optimization to see results here</p>
      </div>
    `;
    return;
  }
  
  // Calculate totals from the actual API response structure
  const totalDistance = result.routes.reduce((sum, route) => sum + (route.total_distance || 0), 0);
  const totalTime = result.routes.reduce((sum, route) => sum + (route.total_time || 0), 0);
  const totalJobs = result.routes.reduce((sum, route) => {
    // Count job stops (exclude depot stops)
    const jobStops = route.stops ? route.stops.filter(stop => stop.type === 'job').length : 0;
    return sum + jobStops;
  }, 0);
  
  console.log('📈 Calculated totals:', { totalDistance, totalTime, totalJobs });
  
  resultsContent.innerHTML = `
    <div class="results-summary">
      <h4>📊 Optimization Summary</h4>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${result.routes.length}</div>
          <div class="metric-label">Routes</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${totalJobs}</div>
          <div class="metric-label">Jobs Assigned</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${totalDistance.toFixed(1)} km</div>
          <div class="metric-label">Total Distance</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${(totalTime / 60).toFixed(1)} h</div>
          <div class="metric-label">Total Time</div>
        </div>
      </div>
    </div>
    
    <div class="routes-details">
      <h4>🚗 Route Details</h4>
      ${result.routes.map((route, index) => {
        const jobStops = route.stops ? route.stops.filter(stop => stop.type === 'job') : [];
        const totalDistance = route.total_distance || 0;
        const totalTime = route.total_time || 0;
        
        console.log(`🚗 Route ${index + 1}:`, { jobStops: jobStops.length, totalDistance, totalTime });
        
        return `
          <div class="route-card">
            <div class="route-header">
              <h5>Route ${index + 1} - Technician ${route.technician_id || 'Unknown'}</h5>
              <div class="route-stats">
                <span>📍 ${jobStops.length} jobs</span>
                <span>🛣️ ${totalDistance.toFixed(1)} km</span>
                <span>⏱️ ${(totalTime / 60).toFixed(1)} h</span>
              </div>
            </div>
            <div class="route-jobs">
              ${route.stops ? route.stops.map((stop, stopIndex) => {
                if (stop.type === 'depot') {
                  return `
                    <div class="job-item depot-stop">
                      <span class="job-number">🏢</span>
                      <span class="job-details">
                        <strong>Depot</strong> - ${stop.location.address}
                        <br><small>📍 Start/End Point</small>
                      </span>
                    </div>
                  `;
                } else if (stop.type === 'job') {
                  return `
                    <div class="job-item">
                      <span class="job-number">${stopIndex}</span>
                      <span class="job-details">
                        <strong>Job ${stop.job_id}</strong> - ${stop.location.address}
                        <br><small>⏱️ ${stop.service_time}min | 🕐 Arrive: ${stop.planned_arrival}</small>
                      </span>
                    </div>
                  `;
                }
                return '';
              }).join('') : '<div class="no-stops">No stops in this route</div>'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Clear results
function clearResults() {
  document.getElementById('jsonInput').value = '';
  window.lastOptimizationResult = null;
  
  // Clear results tab
  const resultsContent = document.getElementById('resultsContent');
  resultsContent.innerHTML = `
    <div class="no-results">
      <div class="no-results-icon">📊</div>
      <h4>No Results Yet</h4>
      <p>Run an optimization to see results here</p>
    </div>
  `;
  
  // Clear map if available
  if (window.routeView) {
    // TODO: Add map visualization when needed
    console.log('🗺️ Map visualization available');
  }
  
  showMessage('🗑️ Results cleared', 'info');
}

// Show message function (if not already defined)
function showMessage(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Create or update message element
  let messageEl = document.getElementById('message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'message';
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(messageEl);
  }
  
  // Set message content and style
  messageEl.textContent = message;
  messageEl.style.background = type === 'error' ? '#dc3545' : 
                               type === 'success' ? '#28a745' : 
                               type === 'warning' ? '#ffc107' : '#007bff';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.parentNode.removeChild(messageEl);
    }
  }, 5000);
}

// Show JSON format documentation
function showJsonFormat() {
  const modal = document.getElementById('formatModal');
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

// Hide JSON format documentation
function hideJsonFormat() {
  const modal = document.getElementById('formatModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('formatModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hideJsonFormat();
      }
    });
  }
});

// Initialize tabs when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎯 Tabbed interface initialized');
  
  // Set default active tab
  switchTab('optimization');
  
  // Load default scenario
  loadScenario('small');
}); 