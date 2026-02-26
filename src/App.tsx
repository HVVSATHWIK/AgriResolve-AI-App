import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Diagnosis } from './pages/Diagnosis';
import { Layout } from './components/Layout';
import { Simulator } from './pages/Simulator';
import { MarketPulse } from './pages/MarketPulse'; // Import Market Pulse
import { ChatAssistant } from './pages/ChatAssistant';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ChatWidget } from './components/ChatWidget';

const App: React.FC = () => {
  // API Key check removed as we now use Backend Proxy.

  return (
    <BrowserRouter>
      <Routes>
        {/* Simulator Standalone Route */}
        <Route path="/simulator" element={<Simulator />} />

        {/* Global Layout Routes */}
        <Route
          path="*"
          element={
            <Layout>
              <div className="min-h-screen font-inter text-gray-900 pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/diagnosis" element={<Diagnosis />} />
                  <Route path="/market" element={<MarketPulse />} />
                  <Route path="/chat" element={<ChatAssistant />} />
                  {/* Redirect unknown routes to Dashboard */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                {/* Global Bottom Navigation for Mobile */}
                <MobileBottomNav />

                {/* Chat Widget */}
                <ChatWidget />
              </div>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
