import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import { SimpleMarkerSymbol, SimpleLineSymbol } from '@arcgis/core/symbols';
import axios from 'axios';

interface Job {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: string;
}

interface Route {
  technician: string;
  jobs: Job[];
  path: [number, number][];
}

const RouteOptimization: React.FC = () => {
  console.log('🗺️  RouteOptimization component rendering...');
  
  const mapDiv = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [loading, setLoading] = useState(false);
  const [optimizationId, setOptimizationId] = useState<string | null>(null);

  useEffect(() => {
    console.log('🗺️  Initializing map...');
    if (mapDiv.current) {
      console.log('✅ Map container found, creating map...');
      
      const map = new Map({
        basemap: 'streets-navigation-vector'
      });

      const view = new MapView({
        container: mapDiv.current,
        map: map,
        zoom: 12,
        center: [-122.4194, 37.7749] // Default to San Francisco
      });

      console.log('✅ Map view created successfully');
      console.log(`   Center: ${view.center.longitude}, ${view.center.latitude}`);
      console.log(`   Zoom: ${view.zoom}`);

      setView(view);

      return () => {
        console.log('🗺️  Cleaning up map view...');
        view?.destroy();
      };
    } else {
      console.log('❌ Map container not found');
    }
  }, []);

  const startOptimization = async () => {
    console.log('\n🚀 === STARTING ROUTE OPTIMIZATION ===');
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    
    try {
      setLoading(true);
      console.log('📤 Sending optimization request to API...');
      
      const response = await axios.post('/api/routes/optimize', {
        // Add your optimization parameters here
      });
      
      console.log('✅ Optimization request sent successfully');
      console.log(`   Job ID: ${response.data.jobId}`);
      console.log(`   Status: ${response.data.status}`);
      
      setOptimizationId(response.data.jobId);
      pollOptimizationStatus(response.data.jobId);
    } catch (error) {
      console.error('❌ Failed to start optimization:', error);
      if (axios.isAxiosError(error)) {
        console.error('   Response status:', error.response?.status);
        console.error('   Response data:', error.response?.data);
      }
      setLoading(false);
    }
  };

  const pollOptimizationStatus = async (jobId: string) => {
    console.log(`\n📊 === POLLING OPTIMIZATION STATUS ===`);
    console.log(`🔍 Checking status for job: ${jobId}`);
    
    try {
      const response = await axios.get(`/api/routes/optimize/${jobId}/status`);
      console.log(`✅ Status response received:`);
      console.log(`   State: ${response.data.state}`);
      console.log(`   Progress: ${response.data.progress || 0}%`);
      
      if (response.data.state === 'completed') {
        console.log('🎉 Optimization completed! Fetching results...');
        const result = await axios.get(`/api/routes/optimize/${jobId}/result`);
        console.log('✅ Results received:', result.data);
        displayRoutes(result.data.routes);
        setLoading(false);
      } else if (response.data.state === 'failed') {
        console.error('❌ Optimization failed:', response.data.failedReason);
        setLoading(false);
      } else {
        console.log(`⏳ Still processing... Will poll again in 2 seconds`);
        setTimeout(() => pollOptimizationStatus(jobId), 2000);
      }
    } catch (error) {
      console.error('❌ Failed to poll status:', error);
      if (axios.isAxiosError(error)) {
        console.error('   Response status:', error.response?.status);
        console.error('   Response data:', error.response?.data);
      }
      setLoading(false);
    }
  };

  const displayRoutes = (routes: Route[]) => {
    console.log('\n🗺️  === DISPLAYING ROUTES ===');
    console.log(`📊 Routes to display: ${routes.length}`);
    
    if (!view) {
      console.log('❌ Map view not available');
      return;
    }

    const graphicsLayer = new GraphicsLayer();
    view.map.add(graphicsLayer);
    console.log('✅ Graphics layer added to map');

    routes.forEach((route, index) => {
      console.log(`   Processing route ${index + 1}/${routes.length} for technician: ${route.technician}`);
      console.log(`   Jobs in route: ${route.jobs.length}`);
      
      // Draw route line
      const lineSymbol = new SimpleLineSymbol({
        color: [
          Math.random() * 255,
          Math.random() * 255,
          Math.random() * 255,
          0.8
        ],
        width: 3
      });

      const routePath = {
        type: 'polyline',
        paths: route.path
      };

      const routeGraphic = new Graphic({
        geometry: routePath,
        symbol: lineSymbol
      });

      graphicsLayer.add(routeGraphic);
      console.log(`   ✅ Route line added for technician ${route.technician}`);

      // Draw job points
      route.jobs.forEach((job, jobIndex) => {
        console.log(`     Adding job ${jobIndex + 1}/${route.jobs.length}: ${job.id}`);
        
        const point = {
          type: 'point',
          longitude: job.location.longitude,
          latitude: job.location.latitude
        };

        const pointSymbol = new SimpleMarkerSymbol({
          style: 'circle',
          color: [255, 255, 255],
          size: 8,
          outline: {
            color: [0, 0, 0],
            width: 1
          }
        });

        const pointGraphic = new Graphic({
          geometry: point,
          symbol: pointSymbol,
          attributes: {
            title: `Job ${job.id}`,
            status: job.status
          },
          popupTemplate: {
            title: '{title}',
            content: 'Status: {status}'
          }
        });

        graphicsLayer.add(pointGraphic);
        console.log(`     ✅ Job point added: ${job.id} at ${job.location.latitude}, ${job.location.longitude}`);
      });
    });

    // Zoom to the extent of all graphics
    console.log('🔍 Zooming to route extent...');
    view.goTo(graphicsLayer.graphics.map((g) => g.geometry));
    console.log('✅ Routes displayed successfully');
  };

  console.log('🎨 RouteOptimization component rendered');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Route Optimization
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={startOptimization}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Optimizing...' : 'Start Optimization'}
        </Button>
        {optimizationId && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Job ID: {optimizationId}
          </Typography>
        )}
      </Paper>
      <Paper
        ref={mapDiv}
        sx={{
          flex: 1,
          minHeight: 500,
          overflow: 'hidden'
        }}
      />
    </Box>
  );
};

export default RouteOptimization; 