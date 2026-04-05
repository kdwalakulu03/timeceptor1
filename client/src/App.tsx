/**
 * App.tsx — Router shell. All page logic lives in pages/*.
 * Pages loaded eagerly — no lazy-load spinner lag.
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Fallback — send unknowns to landing */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
