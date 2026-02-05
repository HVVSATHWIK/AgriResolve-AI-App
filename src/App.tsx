import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Diagnosis } from './pages/Diagnosis';
import { Marketplace } from './pages/Marketplace';
import { Simulator } from './pages/Simulator';
import { MobileBottomNav } from './components/MobileBottomNav';

const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50 font-inter text-gray-900 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/market" element={<Marketplace />} />
          <Route path="/simulator" element={<Simulator />} />
          {/* Redirect unknown routes to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Bottom Navigation for Mobile */}
        <MobileBottomNav />
      </div>
    </BrowserRouter>
  );
};

export default App;
