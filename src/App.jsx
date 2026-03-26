import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import ClientForm from './components/ClientForm';
import ConsultantDashboard from './components/ConsultantDashboard';
import DataIntakePage from './components/DataIntakePage';

import Auth from './components/Auth';

function App() {
  const [session, setSession] = React.useState(null);
  const [userRole, setUserRole] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUserRole(session?.user?.user_metadata?.role || 'client');
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserRole(session?.user?.user_metadata?.role || 'client');
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-finivis-blue/30 border-t-finivis-blue animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public / Generic Route */}
        <Route 
          path="/" 
          element={
            !session ? <Auth /> : (
              userRole === 'consultant' 
                ? <Navigate to="/internal-dashboard" replace /> 
                : <ClientForm session={session} />
            )
          } 
        />
        
        {/* Secure Consultant Route */}
        <Route 
          path="/internal-dashboard" 
          element={
            !session ? (
              <Navigate to="/" replace />
            ) : userRole === 'consultant' ? (
              <ConsultantDashboard session={session} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        {/* Data Intake Route */}
        <Route 
          path="/dataintake" 
          element={
            !session ? (
              <Auth />
            ) : (
              <DataIntakePage session={session} />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
