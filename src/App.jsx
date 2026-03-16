import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClientForm from './components/ClientForm';
import ConsultantDashboard from './components/ConsultantDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Client Route */}
        <Route path="/" element={<ClientForm />} />
        
        {/* Secure Consultant Route */}
        <Route path="/internal-dashboard" element={<ConsultantDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
