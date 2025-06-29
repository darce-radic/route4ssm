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
  const mapDiv = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [loading, setLoading] = useState(false);
  const [optimizationId, setOptimizationId] = useState<string | null>(null);

  useEffect(() => {
    if (mapDiv.current) {
      const map = new Map({
        basemap: 'streets-navigation-vector'
      });

      const view = new MapView({
        container: mapDiv.current,
        map: map,
        zoom: 12,
        center: [-122.4194, 37.7749] // Default to San Francisco
      });

      setView(view);

      return () => {
        view?.destroy();
      };
    }
  }, []);

  const startOptimization = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/routes/optimize', {
        // Add your optimization parameters here
      });
      setOptimizationId(response.data.jobId);
      pollOptimizationStatus(response.data.jobId);
    } catch (error) {
      console.error('Failed to start optimization:', error);
      setLoading(false);
    }
  };

  const pollOptimizationStatus = async (jobId: string) => {
    try {
      const response = await axios.get(`/api/routes/optimize/${jobId}/status`);
      if (response.data.state === 'completed') {
        const result = await axios.get(`/api/routes/optimize/${jobId}/result`);
        displayRoutes(result.data.routes);
        setLoading(false);
      } else if (response.data.state === 'failed') {
        console.error('Optimization failed:', response.data.failedReason);
        setLoading(false);
      } else {
        setTimeout(() => pollOptimizationStatus(jobId), 2000);
      }
    } catch (error) {
      console.error('Failed to poll status:', error);
      setLoading(false);
    }
  };

  const displayRoutes = (routes: Route[]) => {
    if (!view) return;

    const graphicsLayer = new GraphicsLayer();
    view.map.add(graphicsLayer);

    routes.forEach((route, index) => {
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

      // Draw job points
      route.jobs.forEach((job) => {
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
      });
    });

    // Zoom to the extent of all graphics
    view.goTo(graphicsLayer.graphics.map((g) => g.geometry));
  };

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