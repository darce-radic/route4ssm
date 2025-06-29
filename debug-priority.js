// Debug script to test priority ordering
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Test data from the failing test
const technician = {
  home_coordinates: { latitude: -31.9405, longitude: 115.8505 }
};

const jobs = [
  {
    id: 'low-priority',
    coordinates: { latitude: -31.9505, longitude: 115.8605 },
    priority: 3
  },
  {
    id: 'high-priority', 
    coordinates: { latitude: -31.9605, longitude: 115.8705 },
    priority: 1
  }
];

console.log('Technician home:', technician.home_coordinates);
console.log('Jobs:');
jobs.forEach(job => {
  const distance = calculateDistance(
    technician.home_coordinates.latitude,
    technician.home_coordinates.longitude,
    job.coordinates.latitude,
    job.coordinates.longitude
  );
  console.log(`  ${job.id}: priority=${job.priority}, distance=${distance.toFixed(2)}km`);
});

// Sort by priority (highest first)
const sortedJobs = [...jobs].sort((a, b) => b.priority - a.priority);
console.log('\nJobs sorted by priority (highest first):');
sortedJobs.forEach(job => {
  console.log(`  ${job.id}: priority=${job.priority}`);
});

// Simulate our selection logic
console.log('\nSimulating selection logic:');
let bestJob = null;
let bestPriority = -1;
let bestDistance = Infinity;

for (const job of sortedJobs) {
  const distance = calculateDistance(
    technician.home_coordinates.latitude,
    technician.home_coordinates.longitude,
    job.coordinates.latitude,
    job.coordinates.longitude
  );
  
  console.log(`Checking ${job.id}: priority=${job.priority}, distance=${distance.toFixed(2)}km`);
  
  // Priority is the primary factor (higher priority = better)
  // Distance is the secondary factor (shorter distance = better)
  if (job.priority > bestPriority || 
      (job.priority === bestPriority && distance < bestDistance)) {
    bestPriority = job.priority;
    bestDistance = distance;
    bestJob = job;
    console.log(`  ✅ Selected ${job.id} as best job so far`);
  } else {
    console.log(`  ❌ Skipped ${job.id} (not better than current best)`);
  }
}

console.log(`\nFinal selection: ${bestJob.id} (priority: ${bestJob.priority})`); 