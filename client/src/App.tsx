/**
 * App.tsx — Router shell. All page logic lives in pages/*.
 * Pages loaded eagerly — no lazy-load spinner lag.
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
import DashboardPage from './pages/DashboardPage';
import SwotPage from './pages/SwotPage';
import DecidePage from './features/decide/DecidePage';
import PlansPage from './features/plans/PlansPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/swot" element={<SwotPage />} />
        <Route path="/decide" element={<DecidePage />} />
        <Route path="/plans" element={<PlansPage />} />
        {/* Fallback — send unknowns to landing */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
