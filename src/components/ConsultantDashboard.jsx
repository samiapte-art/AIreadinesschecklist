import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import Dashboard from './Dashboard';
import AIInsightsPanel from './AIInsightsPanel';
import { evaluateOpportunity, evaluateOpportunitiesAI } from '../utils/EvaluationEngine';
import { Loader2, Users, Sparkles, LogOut, CheckCircle, AlertTriangle, Zap } from 'lucide-react';

export default function ConsultantDashboard({ session }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // AI / DVF States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [dvfEvaluations, setDvfEvaluations] = useState(null);
  const [scoringMode, setScoringMode] = useState('preview'); // 'preview' | 'ai' | 'fallback'

  // Clear or load AI states when selecting a new client
  useEffect(() => {
    if (selectedSubmission?.ai_insights) {
      // Check if cached result has the unified DVF format
      const cached = selectedSubmission.ai_insights;
      if (cached.evaluations && cached.narrative) {
        setDvfEvaluations(cached.evaluations);
        setAiInsights(cached.narrative);
        setScoringMode('ai');
      } else {
        // Legacy format — just narrative, no AI evaluations
        setAiInsights(cached);
        setDvfEvaluations(null);
        setScoringMode('preview');
      }
    } else {
      setAiInsights(null);
      setDvfEvaluations(null);
      setScoringMode('preview');
    }
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
        client_website: 'acme.com',
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

  const handleRunDVF = useCallback(async () => {
    if (!selectedSubmission) return;
    setAiLoading(true);
    setAiError(null);

    try {
      // Unified AI-powered DVF evaluation (scores + narrative in one call)
      const result = await evaluateOpportunitiesAI(
        selectedSubmission.opportunities_json,
        selectedSubmission.client_name
      );

      // Persist full result to Supabase
      console.log("Persisting DVF evaluation for submission:", selectedSubmission.id);
      const { error: saveError } = await supabase
        .from('client_submissions')
        .update({ ai_insights: result })
        .eq('id', selectedSubmission.id);

      if (saveError) {
        console.error("Supabase Save Error (DVF):", saveError);
        throw new Error(`Persistence Error: ${saveError.message}. Ensure RLS allows updates.`);
      }

      console.log("Successfully persisted DVF evaluation.");
      setDvfEvaluations(result.evaluations);
      setScoringMode(result.scoringMode);

      if (result.narrative) {
        setAiInsights(result.narrative);
      }

      if (result.error) {
        setAiError(`AI unavailable — showing estimated scores. (${result.error})`);
      }
    } catch (err) {
      console.error("handleRunDVF Failed:", err);
      setAiError(err.message || 'Failed to run DVF analysis.');
    } finally {
      setAiLoading(false);
    }
  }, [selectedSubmission]);

  const handleUpdateOpportunity = useCallback(async (updatedOppIndex, roadmapData) => {
    if (!selectedSubmission) return;

    console.log(`Persisting roadmap for opportunity at index ${updatedOppIndex}`);
    const updatedOpps = [...selectedSubmission.opportunities_json];
    updatedOpps[updatedOppIndex] = {
      ...updatedOpps[updatedOppIndex],
      persisted_roadmap: roadmapData
    };

    const { error } = await supabase
      .from('client_submissions')
      .update({ opportunities_json: updatedOpps })
      .eq('id', selectedSubmission.id);

    if (error) {
      console.error("Supabase Save Error (Opportunity Roadmap):", error);
    } else {
      console.log("Successfully persisted roadmap.");
      // Update local state to prevent re-fetch
      setSelectedSubmission(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          opportunities_json: updatedOpps
        };
      });
    }
  }, [selectedSubmission]);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="glass-header sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="Finivis Logo" className="h-8 object-contain" />
            <h1 className="text-xl font-bold tracking-tight text-finivis-dark">
              Finivis Internal Dashboard
            </h1>
            {session?.user?.email && (
              <span className="hidden lg:block bg-blue-50 text-finivis-blue border border-blue-100 px-3 py-1 rounded-full text-xs font-bold ml-2">
                {session.user.email}
              </span>
            )}
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
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium transition-all border ${selectedSubmission?.id === sub.id
                      ? 'bg-finivis-dark text-white shadow-md border-transparent'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-transparent'
                      }`}
                  >
                    <span>{sub.client_name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="pl-4 ml-2 border-l border-gray-200 flex items-center shrink-0">
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm font-medium"
              >
                <LogOut size={16} /> <span className="hidden sm:block">Sign Out</span>
              </button>
            </div>
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
                  <p className="text-gray-500 font-medium">Website: <span className="text-finivis-blue bg-blue-50 px-2 py-0.5 rounded">{selectedSubmission.client_website}</span></p>
                </div>
                <div className="flex items-center gap-4">
                  {aiError && <span className="text-red-500 text-sm font-medium">{aiError}</span>}
                  <button
                    onClick={handleRunDVF}
                    disabled={aiLoading}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-[1.25rem] font-bold transition-all shadow-apple ${aiLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-200 text-finivis-dark hover:shadow-lg hover:-translate-y-0.5'
                      }`}
                  >
                    {aiLoading ? (
                      <><Loader2 size={18} className="animate-spin" /> Running DVF Analysis...</>
                    ) : (
                      <><Sparkles size={18} className="text-finivis-red" /> Run DVF Analysis</>
                    )}
                  </button>
                </div>
              </div>

              {aiInsights && <AIInsightsPanel insights={aiInsights} />}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                <Dashboard
                  opportunities={selectedSubmission.opportunities_json}
                  processName={`${selectedSubmission.client_name} - ${selectedSubmission.client_website}`}
                  onUpdateOpportunity={handleUpdateOpportunity}
                  aiEvaluations={dvfEvaluations}
                  scoringMode={scoringMode}
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
