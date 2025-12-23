import React from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Weather from './pages/Weather';
import Profile from './pages/Profile';
import Network from './pages/Network';
import Soil from './pages/Soil';
import Financial from './pages/Financial';

const AppShell: React.FC = () => {
  const location = useLocation();
  return (
    <div className="page">
      <NavBar />
      <div style={{ height: '42px' }} />
      <div key={location.pathname} style={{ animation: 'routeFade var(--transition-med) var(--easing)' }}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/network" element={<Network />} />
          <Route path="/soil" element={<Soil />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/*" element={<Home />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

