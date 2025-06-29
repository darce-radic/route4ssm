// ArcGIS Maps SDK for JavaScript Application
// Route4SSM Frontend - Route Optimization Dashboard

// Global variables
let mapView = null;
let graphicsLayer = null;
let routeLayer = null;
let testScenarios = {};
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;

// Check WebGL2 support with more detailed error handling
function isWebGL2Supported() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      depth: false,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'default'
    });
    
    if (!gl) {
      console.warn('WebGL2 context creation failed');
      return false;
    }
    
    // Test basic WebGL2 functionality
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      console.warn('WebGL2 shader creation failed');
      return false;
    }
    
    gl.deleteShader(vertexShader);
    return true;
  } catch (e) {
    console.warn('WebGL2 test failed:', e.message);
    return false;
  }
}

// Check for specific WebGL context errors
function checkWebGLErrors() {
  const errors = [];
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    
    if (!gl) {
      errors.push('WebGL2 context creation failed');
    } else {
      // Check for common WebGL errors
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        
        if (renderer.toLowerCase().includes('software') || 
            renderer.toLowerCase().includes('swiftshader') ||
            renderer.toLowerCase().includes('llvmpipe')) {
          errors.push('Software rendering detected - hardware acceleration may be disabled');
        }
        
        if (renderer.toLowerCase().includes('virtual') || 
            renderer.toLowerCase().includes('vmware') ||
            renderer.toLowerCase().includes('virtualbox')) {
          errors.push('Virtual machine graphics detected - WebGL may be limited');
        }
      }
    }
  } catch (e) {
    errors.push(`WebGL error: ${e.message}`);
  }
  
  return errors;
}

// Get comprehensive browser/system information
function getSystemInfo() {
  const info = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    webglErrors: checkWebGLErrors(),
    webgl2Supported: isWebGL2Supported(),
    hardwareAccelerated: isHardwareAccelerated()
  };
  
  return info;
}

// Check hardware acceleration
function isHardwareAccelerated() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return !renderer.toLowerCase().includes('software') && 
             !renderer.toLowerCase().includes('swiftshader') &&
             !renderer.toLowerCase().includes('llvmpipe');
    }
    return true; // Assume hardware acceleration if we can't detect
  } catch (e) {
    return false;
  }
}

// Get browser-specific instructions for enabling hardware acceleration
function getHardwareAccelerationInstructions() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome')) {
    return {
      browser: 'Chrome',
      steps: [
        '1. Open Chrome Settings (chrome://settings/)',
        '2. Go to System section',
        '3. Turn on "Use hardware acceleration when available"',
        '4. Click "Relaunch" to restart Chrome'
      ]
    };
  } else if (userAgent.includes('firefox')) {
    return {
      browser: 'Firefox',
      steps: [
        '1. Open Firefox Menu → Options → General',
        '2. Under Performance, check "Use recommended performance settings"',
        '3. Restart Firefox'
      ]
    };
  } else if (userAgent.includes('edge')) {
    return {
      browser: 'Edge',
      steps: [
        '1. Open Edge Settings',
        '2. Go to System section',
        '3. Turn on "Use hardware acceleration when available"',
        '4. Click "Restart" to restart Edge'
      ]
    };
  } else if (userAgent.includes('safari')) {
    return {
      browser: 'Safari',
      steps: [
        '1. Open Safari Preferences',
        '2. Go to Advanced tab',
        '3. Check "Show Develop menu in menu bar"',
        '4. From Develop menu, select "Experimental Features"',
        '5. Enable "WebGL 2.0"'
      ]
    };
  }
  
  return {
    browser: 'Unknown',
    steps: [
      'Please enable hardware acceleration in your browser settings',
      'Look for options like "Use hardware acceleration" or "WebGL 2.0"'
    ]
  };
}

// Initialize the application
async function initializeApp() {
  console.log('🚀 Initializing Route4SSM Frontend...');
  
  // Check WebGL2 support first
  if (!isWebGL2Supported()) {
    console.warn('⚠️ WebGL2 is not supported in this browser');
    showWebGL2Error();
    return;
  }
  
  // Check hardware acceleration
  if (!isHardwareAccelerated()) {
    console.warn('⚠️ Hardware acceleration may not be enabled');
    showHardwareAccelerationWarning();
  }
  
  // Wait for both DOM and all resources to be loaded
  if (document.readyState === 'complete') {
    await initializeMap();
  } else {
    window.addEventListener('load', initializeMap);
  }
}

// Show comprehensive WebGL error with multiple solutions
function showWebGL2Error() {
  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) {
    const instructions = getHardwareAccelerationInstructions();
    const systemInfo = getSystemInfo();
    
    mapContainer.innerHTML = `
      <div style="width: 100%; height: 100%; background: #f8f9fa; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 20px; text-align: center; overflow-y: auto;">
        <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
        <h3 style="color: #dc3545; margin-bottom: 15px;">Map Visualization Unavailable</h3>
        <p style="color: #6c757d; margin-bottom: 20px; max-width: 500px;">
          WebGL2 initialization failed, but you can still use all route optimization features without the map.
        </p>
        
        <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left; max-width: 500px;">
          <h4 style="margin-top: 0; color: #495057;">System Information:</h4>
          <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Platform:</strong> ${systemInfo.platform}</p>
          <p style="margin: 5px 0; font-size: 0.9rem;"><strong>CPU Cores:</strong> ${systemInfo.hardwareConcurrency || 'Unknown'}</p>
          <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Memory:</strong> ${systemInfo.deviceMemory || 'Unknown'} GB</p>
          <p style="margin: 5px 0; font-size: 0.9rem;"><strong>WebGL2:</strong> ${systemInfo.webgl2Supported ? '✅ Supported' : '❌ Not Supported'}</p>
          <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Hardware Acceleration:</strong> ${systemInfo.hardwareAccelerated ? '✅ Enabled' : '❌ Disabled'}</p>
          ${systemInfo.webglErrors.length > 0 ? `
            <p style="margin: 5px 0; font-size: 0.9rem;"><strong>WebGL Errors:</strong></p>
            ${systemInfo.webglErrors.map(error => `<p style="margin: 2px 0; font-size: 0.8rem; color: #dc3545;">• ${error}</p>`).join('')}
          ` : ''}
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left; max-width: 500px;">
          <h4 style="margin-top: 0; color: #856404;">Solutions to Try:</h4>
          <div style="font-size: 0.9rem;">
            <p style="margin: 5px 0;"><strong>1. Enable Hardware Acceleration in ${instructions.browser}:</strong></p>
            ${instructions.steps.map(step => `<p style="margin: 2px 0; font-size: 0.8rem;">${step}</p>`).join('')}
            
            <p style="margin: 10px 0 5px 0;"><strong>2. Update Graphics Drivers:</strong></p>
            <p style="margin: 2px 0; font-size: 0.8rem;">• Update your graphics card drivers to the latest version</p>
            <p style="margin: 2px 0; font-size: 0.8rem;">• Restart your computer after updating drivers</p>
            
            <p style="margin: 10px 0 5px 0;"><strong>3. Try Different Browser:</strong></p>
            <p style="margin: 2px 0; font-size: 0.8rem;">• Chrome, Firefox, Edge, or Safari</p>
            <p style="margin: 2px 0; font-size: 0.8rem;">• Try incognito/private browsing mode</p>
            
            <p style="margin: 10px 0 5px 0;"><strong>4. Virtual Machine Users:</strong></p>
            <p style="margin: 2px 0; font-size: 0.8rem;">• Enable 3D acceleration in VM settings</p>
            <p style="margin: 2px 0; font-size: 0.8rem;">• Install VM graphics drivers</p>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
          <button onclick="location.reload()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            🔄 Retry
          </button>
          <button onclick="tryRasterBasemap()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
            🗺️ Try Raster Basemap
          </button>
          <button onclick="hideMapAndContinue()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
            🚀 Continue Without Map
          </button>
        </div>
        
        <p style="font-size: 0.8rem; color: #6c757d; margin-top: 15px;">
          The route optimization features will work perfectly without map visualization.
        </p>
      </div>
    `;
  }
  
  // Initialize app without map
  initializeWithoutMap();
}

// Hide map and continue with optimization features
function hideMapAndContinue() {
  const mapContainer = document.getElementById('mapContainer');
  const resultsContainer = document.querySelector('.results-container');
  const toggleBtn = document.getElementById('toggleMapBtn');
  
  if (mapContainer) {
    mapContainer.classList.add('hidden');
    resultsContainer.classList.add('expanded');
    
    // Update toggle button
    if (toggleBtn) {
      toggleBtn.textContent = '🗺️ Show Map';
      toggleBtn.title = 'Show the map for route visualization';
    }
  }
  
  // Initialize app without map
  initializeWithoutMap();
}

// Show hardware acceleration warning
function showHardwareAccelerationWarning() {
  const instructions = getHardwareAccelerationInstructions();
  
  // Create a subtle warning banner
  const warningBanner = document.createElement('div');
  warningBanner.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    padding: 10px;
    max-width: 300px;
    z-index: 1000;
    font-size: 0.9rem;
  `;
  
  warningBanner.innerHTML = `
    <div style="display: flex; align-items: start; gap: 10px;">
      <span style="font-size: 1.2rem;">⚠️</span>
      <div>
        <strong>Performance Notice:</strong>
        <p style="margin: 5px 0; font-size: 0.8rem;">Hardware acceleration may not be enabled. Map performance may be reduced.</p>
        <details style="margin-top: 8px;">
          <summary style="cursor: pointer; color: #007bff; font-size: 0.8rem;">How to enable</summary>
          <div style="margin-top: 5px; font-size: 0.8rem;">
            ${instructions.steps.map(step => `<p style="margin: 2px 0;">${step}</p>`).join('')}
          </div>
        </details>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;">×</button>
    </div>
  `;
  
  document.body.appendChild(warningBanner);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (warningBanner.parentElement) {
      warningBanner.remove();
    }
  }, 10000);
}

// Initialize application without map functionality
function initializeWithoutMap() {
  console.log('🚀 Initializing Route4SSM without map visualization...');
  
  // Hide map loading indicator
  const mapLoading = document.getElementById('mapLoading');
  if (mapLoading) {
    mapLoading.style.display = 'none';
  }
  
  // Update layout for expanded results
  const resultsContainer = document.querySelector('.results-container');
  if (resultsContainer) {
    resultsContainer.classList.add('expanded');
  }
  
  // Initialize form handlers
  initializeFormHandlers();
  
  // Show success message
  showMessage('✅ Route4SSM initialized successfully! Map visualization is disabled, but all optimization features are available.', 'success');
  
  console.log('✅ Route4SSM initialized without map visualization');
}

// Check if ArcGIS is properly loaded
function isArcGISLoaded() {
  return typeof $arcgis !== 'undefined' && 
         typeof window.require !== 'undefined' && 
         window.arcgisReady === true &&
         document.querySelector('script[src*="arcgis.com"]');
}

// Check if DOM container is ready
function isMapContainerReady() {
  const mapContainer = document.getElementById('mapContainer');
  const mapDiv = document.getElementById('mapDiv');
  const mapElement = document.querySelector('arcgis-map');
  return mapContainer && mapDiv && mapElement && 
         mapContainer.offsetWidth > 0 && 
         mapContainer.offsetHeight > 0 &&
         mapDiv.offsetWidth > 0 &&
         mapDiv.offsetHeight > 0;
}

// Wait for DOM to be fully ready
function waitForDOM() {
  return new Promise((resolve) => {
    const checkDOM = () => {
      if (isMapContainerReady()) {
        resolve();
      } else {
        setTimeout(checkDOM, 100);
      }
    };
    checkDOM();
  });
}

// Initialize the map after everything is loaded
async function initializeMap() {
  try {
    initializationAttempts++;
    console.log(`🔍 Initializing map programmatically... (Attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})`);
    
    // Double-check WebGL2 support before proceeding
    if (!isWebGL2Supported()) {
      throw new Error('WebGL2 is not supported in this browser');
    }
    
    console.log('✅ WebGL2 supported, waiting for DOM to be ready...');
    
    // Wait for DOM to be fully ready
    try {
      await waitForDOM();
      console.log('✅ DOM is ready');
    } catch (domError) {
      if (initializationAttempts < MAX_INIT_ATTEMPTS) {
        console.log('⏳ DOM not ready yet, retrying...');
        setTimeout(initializeMap, 500);
        return;
      } else {
        throw new Error('DOM not ready after maximum attempts');
      }
    }
    
    console.log('✅ Map container ready, waiting for ArcGIS to be ready...');
    
    // Wait for ArcGIS to be fully loaded with more comprehensive check
    if (!isArcGISLoaded()) {
      if (initializationAttempts < MAX_INIT_ATTEMPTS) {
        console.log('⏳ ArcGIS not loaded yet, retrying...');
        setTimeout(initializeMap, 500);
        return;
      } else {
        throw new Error('ArcGIS not loaded after maximum attempts');
      }
    }
    
    console.log('✅ ArcGIS loaded, creating map programmatically...');
    
    // Go directly to programmatic approach - skip web components entirely
    try {
      await createMapProgrammatically();
      console.log('✅ Programmatic map created successfully');
    } catch (progError) {
      console.error('❌ Programmatic approach failed:', progError);
      
      // Check if it's a WebGL2-related error
      if (progError.message && (
          progError.message.includes('WebGL2') || 
          progError.message.includes('appendChild') ||
          progError.message.includes('validate') ||
          progError.message.includes('GL error 0x500') ||
          progError.message.includes('FEATURE_FAILURE_WEBGL_GLERR_2') ||
          progError.message.includes('WebGL creation failed')
        )) {
        throw new Error('WebGL2 initialization failed. Please enable hardware acceleration in your browser settings.');
      }
      
      throw progError;
    }
    
    if (!mapView) {
      if (initializationAttempts < MAX_INIT_ATTEMPTS) {
        console.log('⏳ Map view is null, retrying...');
        setTimeout(initializeMap, 1000);
        return;
      } else {
        throw new Error('Map view is null after maximum attempts');
      }
    }
    
    console.log('✅ Map view ready, setting up layers...');
    
    // Hide loading indicator
    const mapLoading = document.getElementById('mapLoading');
    if (mapLoading) {
      mapLoading.classList.add('hidden');
    }
    
    // Create graphics layers
    try {
      graphicsLayer = await $arcgis.import("@arcgis/core/layers/GraphicsLayer");
      routeLayer = await $arcgis.import("@arcgis/core/layers/GraphicsLayer");
      
      const graphicsLayerInstance = new graphicsLayer();
      const routeLayerInstance = new routeLayer();
      
      mapView.map.add(graphicsLayerInstance);
      mapView.map.add(routeLayerInstance);
      
      console.log('✅ Graphics layers added');
    } catch (layerError) {
      console.error('❌ Error creating graphics layers:', layerError);
      // Continue without graphics layers - map will still work
    }
    
    // Set initial extent to Perth, Australia
    try {
      const Point = await $arcgis.import("@arcgis/core/geometry/Point");
      const SpatialReference = await $arcgis.import("@arcgis/core/geometry/SpatialReference");
      
      const perthPoint = new Point({
        longitude: 115.8605,
        latitude: -31.9505,
        spatialReference: SpatialReference.WGS84
      });
      
      mapView.goTo({
        target: perthPoint,
        zoom: 12
      });
      
      console.log('✅ Map extent set to Perth');
    } catch (extentError) {
      console.error('❌ Error setting map extent:', extentError);
      // Continue without setting extent - map will use default
    }
    
    // Initialize test scenarios
    initializeTestScenarios();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('✅ Route4SSM Frontend initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing map:', error);
    
    // Check if it's a WebGL2-related error
    if (error.message && (
        error.message.includes('WebGL2') || 
        error.message.includes('appendChild') ||
        error.message.includes('validate') ||
        error.message.includes('hardware acceleration') ||
        error.message.includes('GL error 0x500') ||
        error.message.includes('FEATURE_FAILURE_WEBGL_GLERR_2') ||
        error.message.includes('WebGL creation failed')
      )) {
      showWebGL2Error();
      return;
    }
    
    if (initializationAttempts < MAX_INIT_ATTEMPTS) {
      console.log(`🔄 Retrying initialization (${initializationAttempts}/${MAX_INIT_ATTEMPTS})...`);
      setTimeout(initializeMap, 2000);
      return;
    }
    
    // Show error message to user after max attempts
    const mapLoading = document.getElementById('mapLoading');
    if (mapLoading) {
      mapLoading.innerHTML = `
        <p>⚠️ Map loading failed</p>
        <p style="font-size: 0.8rem; color: #6c757d;">The application will work without map visualization</p>
        <p style="font-size: 0.7rem; color: #6c757d;">Error: ${error.message}</p>
        <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
      `;
    }
    
    // Initialize without map - application can still work
    initializeWithoutMap();
  }
}

// Fallback method to create map programmatically
async function createMapProgrammatically() {
  console.log('🔄 Creating map programmatically...');
  
  try {
    // Check WebGL2 support before attempting to create map
    if (!isWebGL2Supported()) {
      throw new Error('WebGL2 is not supported in this browser');
    }
    
    const Map = await $arcgis.import("@arcgis/core/Map");
    const MapView = await $arcgis.import("@arcgis/core/views/MapView");
    const Basemap = await $arcgis.import("@arcgis/core/Basemap");
    const TileLayer = await $arcgis.import("@arcgis/core/layers/TileLayer");
    
    // Use the mapDiv container directly
    const mapDiv = document.getElementById('mapDiv');
    if (!mapDiv) {
      throw new Error('Map container not found');
    }
    
    // Ensure the container has proper dimensions
    if (mapDiv.offsetWidth === 0 || mapDiv.offsetHeight === 0) {
      console.warn('Map container has zero dimensions, setting explicit size');
      mapDiv.style.width = '100%';
      mapDiv.style.height = '400px';
    }
    
    // Create a map with raster basemap (uses fewer WebGL contexts)
    const map = new Map({
      basemap: new Basemap({
        baseLayers: [
          new TileLayer({
            url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
          })
        ]
      })
    });
    
    // Create map view with reduced WebGL requirements
    mapView = new MapView({
      container: mapDiv,
      map: map,
      zoom: 12,
      center: [115.8605, -31.9505], // Perth coordinates
      constraints: {
        rotationEnabled: false,
        snapToZoom: false
      },
      // Add additional options to reduce WebGL requirements
      environment: {
        background: {
          type: "color",
          color: [255, 255, 255, 1]
        }
      }
    });
    
    console.log('✅ Programmatic map created successfully');
  } catch (error) {
    console.error('❌ Error in programmatic map creation:', error);
    
    // Check if it's a WebGL2-related error
    if (error.message && (
        error.message.includes('WebGL2') || 
        error.message.includes('appendChild') ||
        error.message.includes('validate') ||
        error.message.includes('GL error 0x500') ||
        error.message.includes('FEATURE_FAILURE_WEBGL_GLERR_2') ||
        error.message.includes('WebGL creation failed')
      )) {
      throw new Error('WebGL2 initialization failed. Please enable hardware acceleration in your browser settings.');
    }
    
    // Create a simple placeholder if ArcGIS fails completely
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
      const instructions = getHardwareAccelerationInstructions();
      
      mapContainer.innerHTML = `
        <div style="width: 100%; height: 100%; background: #f8f9fa; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 20px; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
          <h3 style="color: #dc3545; margin-bottom: 15px;">Map Loading Failed</h3>
          <p style="color: #6c757d; margin-bottom: 20px; max-width: 500px;">
            ${error.message || 'ArcGIS map could not be loaded due to a technical issue.'}
          </p>
          
          <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left; max-width: 400px;">
            <h4 style="margin-top: 0; color: #495057;">Try enabling hardware acceleration in ${instructions.browser}:</h4>
            ${instructions.steps.map(step => `<p style="margin: 5px 0; font-size: 0.9rem;">${step}</p>`).join('')}
          </div>
          
          <div style="display: flex; gap: 10px;">
            <button onclick="location.reload()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              🔄 Retry
            </button>
            <button onclick="tryRasterBasemap()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
              🗺️ Try Raster Basemap
            </button>
            <button onclick="hideMapAndContinue()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
              🚀 Continue Without Map
            </button>
          </div>
          
          <p style="font-size: 0.8rem; color: #6c757d; margin-top: 15px;">
            The route optimization features will still work without map visualization.
          </p>
        </div>
      `;
    }
    
    throw error;
  }
}

// Initialize test scenarios with sample data
function initializeTestScenarios() {
  testScenarios = {
    basic: {
      jobs: [
        {
          id: 'job-1',
          coordinates: { latitude: -31.9505, longitude: 115.8605 },
          address: '123 Test St, Perth WA 6000',
          time_window: { start: '09:00', end: '17:00' },
          service_time: 60,
          priority: 1,
          technician_id: 'unassigned'
        }
      ],
      technicians: [
        {
          id: 'tech-1',
          name: 'John Doe',
          home_coordinates: { latitude: -31.9405, longitude: 115.8505 },
          home_address: '456 Home St, Perth WA 6000',
          working_hours: { start: '08:00', end: '18:00' },
          skills: ['READ']
        }
      ]
    },
    priority: {
      jobs: [
        {
          id: 'high-priority',
          coordinates: { latitude: -31.9605, longitude: 115.8705 },
          address: '789 High Priority St, Perth WA 6000',
          time_window: { start: '09:00', end: '17:00' },
          service_time: 60,
          priority: 1,
          technician_id: 'unassigned'
        },
        {
          id: 'low-priority',
          coordinates: { latitude: -31.9505, longitude: 115.8605 },
          address: '123 Low Priority St, Perth WA 6000',
          time_window: { start: '09:00', end: '17:00' },
          service_time: 60,
          priority: 3,
          technician_id: 'unassigned'
        }
      ],
      technicians: [
        {
          id: 'tech-1',
          name: 'John Doe',
          home_coordinates: { latitude: -31.9405, longitude: 115.8505 },
          home_address: '456 Home St, Perth WA 6000',
          working_hours: { start: '08:00', end: '18:00' },
          skills: ['READ']
        }
      ]
    },
    timewindow: {
      jobs: [
        {
          id: 'job-1',
          coordinates: { latitude: -31.9505, longitude: 115.8605 },
          address: '123 Test St, Perth WA 6000',
          time_window: { start: '09:00', end: '17:00' },
          service_time: 60,
          priority: 1,
          technician_id: 'unassigned'
        },
        {
          id: 'job-2',
          coordinates: { latitude: -31.9605, longitude: 115.8705 },
          address: '456 Test St, Perth WA 6000',
          time_window: { start: '20:00', end: '22:00' },
          service_time: 60,
          priority: 1,
          technician_id: 'unassigned'
        }
      ],
      technicians: [
        {
          id: 'tech-1',
          name: 'John Doe',
          home_coordinates: { latitude: -31.9405, longitude: 115.8505 },
          home_address: '456 Home St, Perth WA 6000',
          working_hours: { start: '08:00', end: '18:00' },
          skills: ['READ']
        }
      ]
    },
    multitech: {
      jobs: [
        {
          id: 'job-1',
          coordinates: { latitude: -31.9505, longitude: 115.8605 },
          address: '123 Test St, Perth WA 6000',
          time_window: { start: '09:00', end: '17:00' },
          service_time: 60,
          priority: 1,
          technician_id: 'unassigned'
        },
        {
          id: 'job-2',
          coordinates: { latitude: -31.9605, longitude: 115.8705 },
          address: '456 Test St, Perth WA 6000',
          time_window: { start: '09:00', end: '17:00' },
          service_time: 60,
          priority: 2,
          technician_id: 'unassigned'
        }
      ],
      technicians: [
        {
          id: 'tech-1',
          name: 'John Doe',
          home_coordinates: { latitude: -31.9405, longitude: 115.8505 },
          home_address: '456 Home St, Perth WA 6000',
          working_hours: { start: '08:00', end: '18:00' },
          skills: ['READ']
        },
        {
          id: 'tech-2',
          name: 'Jane Smith',
          home_coordinates: { latitude: -31.9305, longitude: 115.8405 },
          home_address: '789 Home St, Perth WA 6000',
          working_hours: { start: '08:00', end: '18:00' },
          skills: ['READ']
        }
      ]
    }
  };
}

// Set up event listeners
function setupEventListeners() {
  const scenarioSelect = document.getElementById('scenario');
  scenarioSelect.addEventListener('change', function() {
    const selectedScenario = this.value;
    if (selectedScenario !== 'custom' && testScenarios[selectedScenario]) {
      document.getElementById('customData').value = JSON.stringify(testScenarios[selectedScenario], null, 2);
    }
  });
  
  // Load basic scenario by default
  scenarioSelect.value = 'basic';
  document.getElementById('customData').value = JSON.stringify(testScenarios.basic, null, 2);
}

// Run optimization
async function runOptimization() {
  const optimizeBtn = document.getElementById('optimizeBtn');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const success = document.getElementById('success');
  const results = document.getElementById('results');
  
  // Show loading state
  optimizeBtn.disabled = true;
  loading.classList.add('show');
  error.classList.remove('show');
  success.classList.remove('show');
  results.innerHTML = '';
  
  try {
    // Get API URL and data
    const apiUrl = document.getElementById('apiUrl').value;
    const customData = document.getElementById('customData').value;
    
    let requestData;
    try {
      requestData = JSON.parse(customData);
    } catch (e) {
      throw new Error('Invalid JSON data');
    }
    
    // Call the optimization API
    const response = await fetch(`${apiUrl}/api/route-optimization/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Display results
    displayResults(result);
    
    // Visualize on map
    await visualizeResults(result, requestData);
    
    // Show success message
    success.textContent = '✅ Optimization completed successfully!';
    success.classList.add('show');
    
  } catch (err) {
    console.error('Optimization error:', err);
    error.textContent = `❌ Error: ${err.message}`;
    error.classList.add('show');
  } finally {
    // Hide loading state
    optimizeBtn.disabled = false;
    loading.classList.remove('show');
  }
}

// Display optimization results
function displayResults(result) {
  const results = document.getElementById('results');
  
  let html = `
    <div class="result-card">
      <h4>📊 Optimization Summary</h4>
      <p><span class="metric">Total Jobs: ${result.summary.total_jobs}</span></p>
      <p><span class="metric">Total Routes: ${result.summary.total_routes}</span></p>
      <p><span class="metric">Total Distance: ${result.summary.total_distance} km</span></p>
      <p><span class="metric">Total Time: ${result.summary.total_time} min</span></p>
      <p><span class="metric">Optimization Score: ${result.summary.optimization_score}%</span></p>
    </div>
  `;
  
  // Display routes
  result.routes.forEach((route, index) => {
    html += `
      <div class="result-card">
        <h4>🚗 Route ${index + 1} - ${route.technician_id}</h4>
        <p><span class="metric">Distance: ${route.total_distance} km</span></p>
        <p><span class="metric">Time: ${route.total_time} min</span></p>
        <p><span class="metric">Service Time: ${route.total_service_time} min</span></p>
        <p><span class="metric">Stops: ${route.stops.filter(s => s.type === 'job').length} jobs</span></p>
      </div>
    `;
  });
  
  // Display unassigned jobs
  if (result.unassigned_jobs && result.unassigned_jobs.length > 0) {
    html += `
      <div class="result-card">
        <h4>⚠️ Unassigned Jobs (${result.unassigned_jobs.length})</h4>
        ${result.unassigned_jobs.map(job => `
          <p>• ${job.id}: ${job.reason || 'Could not be assigned'}</p>
        `).join('')}
      </div>
    `;
  }
  
  results.innerHTML = html;
}

// Visualize results on the map
async function visualizeResults(result, originalData) {
  // Check if map is available
  if (!mapView) {
    console.log('⚠️ Map not available, skipping visualization');
    return;
  }
  
  // Clear existing graphics
  clearMap();
  
  try {
    const Graphic = await $arcgis.import("@arcgis/core/Graphic");
    const Point = await $arcgis.import("@arcgis/core/geometry/Point");
    const SimpleMarkerSymbol = await $arcgis.import("@arcgis/core/symbols/SimpleMarkerSymbol");
    const SimpleLineSymbol = await $arcgis.import("@arcgis/core/symbols/SimpleLineSymbol");
    const SpatialReference = await $arcgis.import("@arcgis/core/geometry/SpatialReference");
    
    // Add technician homes
    originalData.technicians.forEach(tech => {
      const point = new Point({
        longitude: tech.home_coordinates.longitude,
        latitude: tech.home_coordinates.latitude,
        spatialReference: SpatialReference.WGS84
      });
      
      const symbol = new SimpleMarkerSymbol({
        color: [76, 175, 80, 0.8], // Green
        size: 12,
        outline: {
          color: [255, 255, 255],
          width: 2
        }
      });
      
      const graphic = new Graphic({
        geometry: point,
        symbol: symbol,
        attributes: {
          type: 'technician_home',
          id: tech.id,
          name: tech.name
        },
        popupTemplate: {
          title: 'Technician Home',
          content: `
            <strong>${tech.name}</strong><br>
            ID: ${tech.id}<br>
            Address: ${tech.home_address}<br>
            Working Hours: ${tech.working_hours.start} - ${tech.working_hours.end}
          `
        }
      });
      
      mapView.graphics.add(graphic);
    });
    
    // Add job locations
    originalData.jobs.forEach(job => {
      const point = new Point({
        longitude: job.coordinates.longitude,
        latitude: job.coordinates.latitude,
        spatialReference: SpatialReference.WGS84
      });
      
      // Check if job is assigned
      const isAssigned = result.routes.some(route => 
        route.stops.some(stop => stop.job_id === job.id)
      );
      
      const symbol = new SimpleMarkerSymbol({
        color: isAssigned ? [33, 150, 243, 0.8] : [244, 67, 54, 0.8], // Blue if assigned, Red if unassigned
        size: 10,
        outline: {
          color: [255, 255, 255],
          width: 2
        }
      });
      
      const graphic = new Graphic({
        geometry: point,
        symbol: symbol,
        attributes: {
          type: 'job',
          id: job.id,
          assigned: isAssigned
        },
        popupTemplate: {
          title: 'Job Location',
          content: `
            <strong>Job ${job.id}</strong><br>
            Address: ${job.address}<br>
            Priority: ${job.priority}<br>
            Time Window: ${job.time_window.start} - ${job.time_window.end}<br>
            Service Time: ${job.service_time} min<br>
            Status: ${isAssigned ? '✅ Assigned' : '❌ Unassigned'}
          `
        }
      });
      
      mapView.graphics.add(graphic);
    });
    
    // Add optimized routes
    result.routes.forEach((route, routeIndex) => {
      const routeColors = [
        [255, 152, 0, 0.8], // Orange
        [156, 39, 176, 0.8], // Purple
        [0, 188, 212, 0.8], // Cyan
        [255, 193, 7, 0.8]  // Amber
      ];
      
      const routeColor = routeColors[routeIndex % routeColors.length];
      
      // Create route line
      const routeStops = route.stops.filter(stop => stop.type === 'job');
      if (routeStops.length > 0) {
        const points = routeStops.map(stop => {
          const job = originalData.jobs.find(j => j.id === stop.job_id);
          return new Point({
            longitude: job.coordinates.longitude,
            latitude: job.coordinates.latitude,
            spatialReference: SpatialReference.WGS84
          });
        });
        
        // Add technician home as first point
        const tech = originalData.technicians.find(t => t.id === route.technician_id);
        if (tech) {
          points.unshift(new Point({
            longitude: tech.home_coordinates.longitude,
            latitude: tech.home_coordinates.latitude,
            spatialReference: SpatialReference.WGS84
          }));
        }
        
        // Create polyline geometry
        const Polyline = $arcgis.import("@arcgis/core/geometry/Polyline");
        const polyline = new Polyline({
          paths: [points.map(p => [p.longitude, p.latitude])],
          spatialReference: SpatialReference.WGS84
        });
        
        const lineSymbol = new SimpleLineSymbol({
          color: routeColor,
          width: 4,
          style: "solid"
        });
        
        const routeGraphic = new Graphic({
          geometry: polyline,
          symbol: lineSymbol,
          attributes: {
            type: 'route',
            technician_id: route.technician_id,
            route_index: routeIndex
          },
          popupTemplate: {
            title: `Route ${routeIndex + 1} - ${route.technician_id}`,
            content: `
              <strong>Route Details</strong><br>
              Total Distance: ${route.total_distance} km<br>
              Total Time: ${route.total_time} min<br>
              Service Time: ${route.total_service_time} min<br>
              Jobs: ${routeStops.length}
            `
          }
        });
        
        mapView.graphics.add(routeGraphic);
      }
    });
    
    // Fit map to show all graphics
    if (mapView.graphics.length > 0) {
      mapView.goTo(mapView.graphics);
    }
    
  } catch (error) {
    console.error('❌ Error visualizing results:', error);
    // Continue without visualization - results are still displayed in the sidebar
  }
}

// Clear map graphics
function clearMap() {
  if (!mapView) {
    console.log('⚠️ Map not available, cannot clear graphics');
    return;
  }
  
  try {
    mapView.graphics.removeAll();
    console.log('🗑️ Map cleared');
  } catch (error) {
    console.error('❌ Error clearing map:', error);
  }
}

// Try raster basemap as fallback
function tryRasterBasemap() {
  console.log('🗺️ Attempting to initialize map with raster basemap...');
  
  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) {
    mapContainer.innerHTML = `
      <div id="mapLoading" class="map-loading">
        <p>🗺️ Loading Raster Map...</p>
        <p style="font-size: 0.8rem; color: #6c757d;">Attempting raster basemap initialization</p>
      </div>
      <div id="mapInnerContainer" style="width: 100%; height: 100%; position: relative; min-height: 400px;">
        <div id="mapDiv" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"></div>
      </div>
      <button id="toggleMapBtn" class="toggle-map-btn" onclick="toggleMap()">
        🗺️ Hide Map
      </button>
    `;
  }
  
  // Attempt to initialize with raster basemap
  initializeMapWithRasterBasemap();
}

// Initialize map with raster basemap
async function initializeMapWithRasterBasemap() {
  try {
    console.log('🗺️ Loading ArcGIS with raster basemap...');
    
    // Load ArcGIS modules
    const [Map, MapView, Basemap, TileLayer] = await Promise.all([
      loadArcGISModule('esri/Map'),
      loadArcGISModule('esri/views/MapView'),
      loadArcGISModule('esri/Basemap'),
      loadArcGISModule('esri/layers/TileLayer')
    ]);
    
    // Create raster basemap
    const rasterBasemap = Basemap.fromId('streets-navigation-vector');
    
    // Create map with raster basemap
    const map = new Map({
      basemap: rasterBasemap
    });
    
    // Create map view
    const view = new MapView({
      container: 'mapDiv',
      map: map,
      zoom: 10,
      center: [-122.4194, 37.7749] // San Francisco
    });
    
    // Hide loading indicator
    const mapLoading = document.getElementById('mapLoading');
    if (mapLoading) {
      mapLoading.style.display = 'none';
    }
    
    // Store map and view globally
    window.routeMap = map;
    window.routeView = view;
    
    console.log('✅ Map initialized with raster basemap successfully');
    showMessage('✅ Map loaded with raster basemap! Route visualization is now available.', 'success');
    
    // Initialize form handlers
    initializeFormHandlers();
    
  } catch (error) {
    console.error('❌ Failed to initialize raster basemap:', error);
    showWebGL2Error();
  }
}

// Toggle map visibility
function toggleMap() {
  const mapContainer = document.getElementById('mapContainer');
  const resultsContainer = document.querySelector('.results-container');
  const toggleBtn = document.getElementById('toggleMapBtn');
  
  if (mapContainer.classList.contains('hidden')) {
    // Show map
    mapContainer.classList.remove('hidden');
    resultsContainer.classList.remove('expanded');
    toggleBtn.textContent = '🗺️ Hide Map';
    toggleBtn.title = 'Hide the map to focus on results';
    showMessage('🗺️ Map visualization enabled! You can now see routes and job locations on the map.', 'info');
  } else {
    // Hide map
    mapContainer.classList.add('hidden');
    resultsContainer.classList.add('expanded');
    toggleBtn.textContent = '🗺️ Show Map';
    toggleBtn.title = 'Show the map for route visualization';
    showMessage('📊 Map hidden! All route optimization features remain fully functional. Click "Show Map" to restore visualization.', 'info');
  }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);

// Make functions globally available
window.runOptimization = runOptimization;
window.clearMap = clearMap;

// Tab switching functionality
function switchTab(tabName) {
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
  
  // Load scenario data
  const scenarios = {
    small: {
      jobs: [
        { id: 1, coordinates: [115.8605, -31.9505], address: "Perth CBD", timeWindow: { start: "09:00", end: "12:00" }, serviceTime: 30, priority: 1 },
        { id: 2, coordinates: [115.8615, -31.9515], address: "Northbridge", timeWindow: { start: "10:00", end: "14:00" }, serviceTime: 45, priority: 2 },
        { id: 3, coordinates: [115.8625, -31.9525], address: "Subiaco", timeWindow: { start: "11:00", end: "15:00" }, serviceTime: 60, priority: 1 },
        { id: 4, coordinates: [115.8635, -31.9535], address: "Leederville", timeWindow: { start: "13:00", end: "17:00" }, serviceTime: 30, priority: 3 },
        { id: 5, coordinates: [115.8645, -31.9545], address: "Mount Lawley", timeWindow: { start: "14:00", end: "18:00" }, serviceTime: 45, priority: 2 }
      ],
      technicians: [
        { id: 1, coordinates: [115.8600, -31.9500], address: "Perth Depot", skills: ["electrical", "plumbing"], capacity: 8 },
        { id: 2, coordinates: [115.8650, -31.9550], address: "North Depot", skills: ["electrical", "hvac"], capacity: 6 }
      ]
    },
    medium: {
      jobs: [
        { id: 1, coordinates: [115.8605, -31.9505], address: "Perth CBD", timeWindow: { start: "08:00", end: "12:00" }, serviceTime: 30, priority: 1 },
        { id: 2, coordinates: [115.8615, -31.9515], address: "Northbridge", timeWindow: { start: "09:00", end: "13:00" }, serviceTime: 45, priority: 2 },
        { id: 3, coordinates: [115.8625, -31.9525], address: "Subiaco", timeWindow: { start: "10:00", end: "14:00" }, serviceTime: 60, priority: 1 },
        { id: 4, coordinates: [115.8635, -31.9535], address: "Leederville", timeWindow: { start: "11:00", end: "15:00" }, serviceTime: 30, priority: 3 },
        { id: 5, coordinates: [115.8645, -31.9545], address: "Mount Lawley", timeWindow: { start: "12:00", end: "16:00" }, serviceTime: 45, priority: 2 },
        { id: 6, coordinates: [115.8655, -31.9555], address: "Highgate", timeWindow: { start: "13:00", end: "17:00" }, serviceTime: 60, priority: 1 },
        { id: 7, coordinates: [115.8665, -31.9565], address: "Inglewood", timeWindow: { start: "14:00", end: "18:00" }, serviceTime: 30, priority: 3 },
        { id: 8, coordinates: [115.8675, -31.9575], address: "Bayswater", timeWindow: { start: "15:00", end: "19:00" }, serviceTime: 45, priority: 2 },
        { id: 9, coordinates: [115.8685, -31.9585], address: "Morley", timeWindow: { start: "16:00", end: "20:00" }, serviceTime: 60, priority: 1 },
        { id: 10, coordinates: [115.8695, -31.9595], address: "Mirrabooka", timeWindow: { start: "17:00", end: "21:00" }, serviceTime: 30, priority: 3 },
        { id: 11, coordinates: [115.8705, -31.9605], address: "Balga", timeWindow: { start: "18:00", end: "22:00" }, serviceTime: 45, priority: 2 },
        { id: 12, coordinates: [115.8715, -31.9615], address: "Nollamara", timeWindow: { start: "19:00", end: "23:00" }, serviceTime: 60, priority: 1 },
        { id: 13, coordinates: [115.8725, -31.9625], address: "Westminster", timeWindow: { start: "20:00", end: "24:00" }, serviceTime: 30, priority: 3 },
        { id: 14, coordinates: [115.8735, -31.9635], address: "Osborne Park", timeWindow: { start: "21:00", end: "01:00" }, serviceTime: 45, priority: 2 },
        { id: 15, coordinates: [115.8745, -31.9645], address: "Scarborough", timeWindow: { start: "22:00", end: "02:00" }, serviceTime: 60, priority: 1 }
      ],
      technicians: [
        { id: 1, coordinates: [115.8600, -31.9500], address: "Perth Depot", skills: ["electrical", "plumbing"], capacity: 8 },
        { id: 2, coordinates: [115.8650, -31.9550], address: "North Depot", skills: ["electrical", "hvac"], capacity: 6 },
        { id: 3, coordinates: [115.8700, -31.9600], address: "East Depot", skills: ["plumbing", "hvac"], capacity: 7 },
        { id: 4, coordinates: [115.8750, -31.9650], address: "West Depot", skills: ["electrical", "plumbing", "hvac"], capacity: 5 }
      ]
    },
    large: {
      jobs: Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        coordinates: [115.8605 + (i * 0.001), -31.9505 + (i * 0.001)],
        address: `Location ${i + 1}`,
        timeWindow: { start: `${(8 + i % 12).toString().padStart(2, '0')}:00`, end: `${(12 + i % 8).toString().padStart(2, '0')}:00` },
        serviceTime: 30 + (i % 60),
        priority: (i % 3) + 1
      })),
      technicians: Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        coordinates: [115.8600 + (i * 0.002), -31.9500 + (i * 0.002)],
        address: `Depot ${i + 1}`,
        skills: ["electrical", "plumbing", "hvac"].slice(0, (i % 3) + 1),
        capacity: 5 + (i % 5)
      }))
    },
    custom: {
      jobs: [],
      technicians: []
    }
  };
  
  const scenario = scenarios[scenarioType];
  if (scenario) {
    document.getElementById('jsonInput').value = JSON.stringify(scenario, null, 2);
    showMessage(`✅ Loaded ${scenarioType} scenario with ${scenario.jobs.length} jobs and ${scenario.technicians.length} technicians`, 'success');
  }
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
    clearMapVisualization();
  }
  
  showMessage('🗑️ Results cleared', 'info');
} 