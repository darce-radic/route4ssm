import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Technicians from './pages/Technicians';
import RouteOptimization from './pages/RouteOptimization';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HankoAuth from './components/HankoAuth';
import HankoProfile from './components/HankoProfile';
import ProtectedRoute from './components/ProtectedRoute';
import LogoutButton from './components/LogoutButton';

console.log('🚀 Route4SSM Web Client Starting...');
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${import.meta.env.MODE}`);
console.log(`🔧 API URL: ${import.meta.env.VITE_API_URL || 'http://localhost:3009'}`);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  console.log(`🔐 PrivateRoute - Authentication status: ${isAuthenticated}`);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  console.log('🎨 App component rendering...');
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HankoAuth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="technicians" element={<Technicians />} />
              <Route path="route-optimization" element={<RouteOptimization />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

console.log('✅ App component loaded successfully');

export default App; 