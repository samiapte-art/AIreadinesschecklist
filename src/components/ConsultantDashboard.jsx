import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import Dashboard from './Dashboard';
import AIInsightsPanel from './AIInsightsPanel';
import { analyzeOpportunities } from '../utils/aiAnalyzer';
import { Loader2, Users, Sparkles } from 'lucide-react';

export default function ConsultantDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // AI States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Clear AI states when selecting a new client
  useEffect(() => {
    setAiInsights(null);
    setAiError(null);
  }, [selectedSubmission]);

  const fetchSubmissions = async () => {
    setLoading(true);
    // Since RLS is true, ensure consultant has access. For this demo we'll fetch all.
    const { data, error } = await supabase
      .from('client_submissions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching submissions:", error);
      // Fallback dummy data if no DB connected
      setSubmissions([{
        id: 'mock-id-1',
        client_name: 'Acme Corp',
        process_area: 'Invoice Processing',
        created_at: new Date().toISOString(),
        opportunities_json: [{
             name: 'Automate approvals',
             description: 'Manual email chain',
             painPoints: ['Slow turnaround'],
             businessValue: ['Productivity / efficiency'],
             maturity: 'Partially documented',
             dataAvailability: 'Medium (some data available but messy)',
             frequency: 'Daily'
        }]
      }]);
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleGenerateAI = async () => {
    if (!selectedSubmission) return;
    setAiLoading(true);
    setAiError(null);
    
    try {
      // Pass the raw opportunities. In a real app we might pass pre-calculated DVF scores here too.
      const insights = await analyzeOpportunities(
        selectedSubmission.opportunities_json, 
        { note: "DVF scores calculated implicitly by framework" },
        selectedSubmission.client_name
      );
      setAiInsights(insights);
    } catch (err) {
      setAiError(err.message || 'Failed to generate AI insights.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
       <header className="bg-[#1a1a1a] text-white border-b border-gray-800 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="Finivis Logo" className="h-8 object-contain" />
            <h1 className="text-xl font-bold tracking-tight">
              Finivis Internal Dashboard
            </h1>
          </div>
          
          {/* Top Navigation - Client List */}
          <div className="flex-1 flex items-center justify-start md:justify-end gap-3 overflow-x-auto pb-2 md:pb-0 custom-scrollbar hide-scrollbar">
            {loading ? (
               <Loader2 className="animate-spin text-finivis-blue" size={20} />
            ) : submissions.length === 0 ? (
               <span className="text-sm text-gray-500">No submissions found.</span>
            ) : (
              <div className="flex gap-2">
                {submissions.map(sub => (
                  <button 
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      selectedSubmission?.id === sub.id 
                      ? 'bg-finivis-blue text-white border-finivis-blue shadow-md' 
                      : 'bg-white/10 hover:bg-white/20 text-gray-300 border-white/5'
                    }`}
                  >
                    <span>{sub.client_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Dashboard Content */}
        <div>
          {selectedSubmission ? (
            <div className="space-y-8 animate-fade-in">
               <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div>
                   <h2 className="text-3xl font-extrabold text-finivis-dark mb-1">{selectedSubmission.client_name}</h2>
                   <p className="text-gray-500 font-medium">Process Area: <span className="text-finivis-blue bg-blue-50 px-2 py-0.5 rounded">{selectedSubmission.process_area}</span></p>
                 </div>
                 <div className="flex items-center gap-4">
                   {aiError && <span className="text-red-500 text-sm font-medium">{aiError}</span>}
                   <button 
                     onClick={handleGenerateAI}
                     disabled={aiLoading}
                     className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                       aiLoading 
                       ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                       : 'bg-gradient-to-r from-finivis-dark to-black text-white hover:shadow-xl hover:-translate-y-0.5'
                     }`}
                   >
                     {aiLoading ? (
                       <><Loader2 size={18} className="animate-spin" /> Analyzing...</>
                     ) : (
                       <><Sparkles size={18} className="text-finivis-red" /> Generate AI Strategy</>
                     )}
                   </button>
                 </div>
               </div>
               
               {aiInsights && <AIInsightsPanel insights={aiInsights} />}

               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                 <Dashboard 
                    opportunities={selectedSubmission.opportunities_json} 
                    processName={`${selectedSubmission.client_name} - ${selectedSubmission.process_area}`}
                 />
               </div>
            </div>
          ) : (
            <div className="min-h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-[2rem] bg-white/50 p-20">
              <Users size={48} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">Select a Client</h3>
              <p className="text-gray-500 text-center max-w-sm">Choose a client submission from the top navigation bar to view the DVF analysis and AI strategy.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
