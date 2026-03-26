import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import Dashboard from './Dashboard';
import AIInsightsPanel from './AIInsightsPanel';
import { evaluateOpportunitiesAI } from '../utils/EvaluationEngine';
import { getPriorityLabel } from '../utils/ScoringEngine';
import { Loader2, Users, Sparkles, LogOut, CheckCircle, AlertTriangle, ArrowLeft, Globe, Calendar, ChevronRight, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import AssessmentChecklist from './AssessmentChecklist';

export default function ConsultantDashboard({ session }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showAiStrategist, setShowAiStrategist] = useState(false);
  const [activeTab, setActiveTab] = useState('evaluation');

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

  const handleUpdateOpportunity = useCallback(async (updatedOppIndex, roadmapData, updatedOpp) => {
    if (!selectedSubmission) return;

    console.log(`Persisting roadmap and metadata for opportunity at index ${updatedOppIndex}`);
    
    // 1. Update the original opportunities_json
    const updatedOpps = [...selectedSubmission.opportunities_json];
    updatedOpps[updatedOppIndex] = {
      ...updatedOpps[updatedOppIndex],
      ...(updatedOpp ? {
        name: updatedOpp.opportunityName || updatedOpp.name,
        description: updatedOpp.description
      } : {}),
      persisted_roadmap: roadmapData
    };

    // 2. Update the AI evaluations if they exist
    let updatedAiInsights = selectedSubmission.ai_insights;
    if (updatedOpp && updatedAiInsights?.evaluations) {
      const newEvaluations = [...updatedAiInsights.evaluations];
      // The index in results matches the index in aiEvaluations array
      if (newEvaluations[updatedOppIndex]) {
        newEvaluations[updatedOppIndex] = {
          ...newEvaluations[updatedOppIndex],
          ...updatedOpp,
          // Sync naming conventions if needed
          opportunityName: updatedOpp.opportunityName || updatedOpp.name
        };
        updatedAiInsights = {
          ...updatedAiInsights,
          evaluations: newEvaluations
        };
      }
    }

    const { error } = await supabase
      .from('client_submissions')
      .update({ 
        opportunities_json: updatedOpps,
        ai_insights: updatedAiInsights
      })
      .eq('id', selectedSubmission.id);

    if (error) {
      console.error("Supabase Save Error (Opportunity Update):", error);
    } else {
      console.log("Successfully persisted updates.");
      // Update local state to prevent re-fetch
      setSelectedSubmission(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          opportunities_json: updatedOpps,
          ai_insights: updatedAiInsights
        };
      });
      
      // Update local DVF evaluations state too
      if (updatedAiInsights?.evaluations) {
        setDvfEvaluations(updatedAiInsights.evaluations);
      }
    }
  }, [selectedSubmission]);

  const handleUpdateScore = useCallback(async (oppIndex, field, newValue) => {
    if (!selectedSubmission) return false;

    try {
      // 1. Always persist score_overrides in opportunities_json (works in all modes)
      const updatedOpps = [...selectedSubmission.opportunities_json];
      updatedOpps[oppIndex] = {
        ...updatedOpps[oppIndex],
        score_overrides: {
          ...(updatedOpps[oppIndex].score_overrides || {}),
          [field]: newValue
        }
      };

      // 2. Also update ai_insights.evaluations if they exist (AI mode)
      let updatedAiInsights = selectedSubmission.ai_insights;
      if (updatedAiInsights?.evaluations?.[oppIndex]) {
        const newEvaluations = [...updatedAiInsights.evaluations];
        const evalEntry = { ...newEvaluations[oppIndex] };
        const newScores = { ...evalEntry.scores, [field]: newValue };
        newScores.overall = Math.round(
          (newScores.value * 0.30) + (newScores.data * 0.25) +
          (newScores.feasibility * 0.25) + (newScores.risk * 0.20)
        );
        evalEntry.scores = newScores;
        evalEntry.priority = getPriorityLabel(newScores.overall);
        newEvaluations[oppIndex] = evalEntry;
        updatedAiInsights = { ...updatedAiInsights, evaluations: newEvaluations };
      }

      // 3. Atomic Supabase update (single row)
      const { error } = await supabase
        .from('client_submissions')
        .update({
          opportunities_json: updatedOpps,
          ai_insights: updatedAiInsights
        })
        .eq('id', selectedSubmission.id);

      if (error) {
        console.error("Score update failed:", error);
        return false;
      }

      // 4. Update local state
      setSelectedSubmission(prev => prev ? {
        ...prev,
        opportunities_json: updatedOpps,
        ai_insights: updatedAiInsights
      } : prev);
      if (updatedAiInsights?.evaluations) {
        setDvfEvaluations(updatedAiInsights.evaluations);
      }
      return true;
    } catch (err) {
      console.error("Score update error:", err);
      return false;
    }
  }, [selectedSubmission]);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="glass-header sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
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

          <div className="flex items-center gap-3 shrink-0">
            {selectedSubmission && (
              <>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Back to Clients</span>
                </button>
                <span className="text-sm font-semibold text-finivis-dark">
                  {selectedSubmission.client_name}
                </span>
              </>
            )}
            <div className="pl-3 ml-2 border-l border-gray-200">
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

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Dashboard Content */}
        <div>
          {selectedSubmission ? (
            <div className="space-y-6 animate-fade-in">
              {/* Tab Navigation */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('evaluation')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                    activeTab === 'evaluation'
                      ? 'bg-finivis-dark text-white shadow-md'
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Sparkles size={15} /> Detailed Assessment
                </button>
                {selectedSubmission.checklist_json && Object.keys(selectedSubmission.checklist_json).length > 0 && (
                  <button
                    onClick={() => setActiveTab('checklist')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                      activeTab === 'checklist'
                        ? 'bg-finivis-dark text-white shadow-md'
                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <ClipboardList size={15} /> Data Intake
                  </button>
                )}
              </div>

              {activeTab === 'evaluation' ? (
                <>
                  <div className="bg-white rounded-[2.5rem] shadow-apple border border-gray-100 overflow-hidden">
                    <Dashboard
                  opportunities={selectedSubmission.opportunities_json}
                  processName={`${selectedSubmission.client_name} - ${selectedSubmission.client_website}`}
                  onUpdateOpportunity={handleUpdateOpportunity}
                  onUpdateScore={handleUpdateScore}
                  aiEvaluations={dvfEvaluations}
                  scoringMode={scoringMode}
                  clientName={selectedSubmission.client_name}
                  clientWebsite={selectedSubmission.client_website}
                  onRunDVF={handleRunDVF}
                  dvfLoading={aiLoading}
                  aiInsights={aiInsights}
                  showAiStrategist={showAiStrategist}
                  onToggleStrategist={() => setShowAiStrategist(!showAiStrategist)}
                  aiError={aiError}
                />
              </div>

              {aiInsights && showAiStrategist && <AIInsightsPanel insights={aiInsights} />}
                </>
              ) : (
                <div className="bg-white rounded-[2rem] shadow-apple border border-gray-100 overflow-hidden p-6 animate-fade-in">
                  <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-finivis-blue/10 flex items-center justify-center">
                      <ClipboardList size={20} className="text-finivis-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Data Intake</h3>
                      <p className="text-sm text-gray-500 font-medium">Responses submitted by the client</p>
                    </div>
                  </div>
                  <AssessmentChecklist
                    checklistData={selectedSubmission.checklist_json || {}}
                    readOnly={true}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-finivis-dark tracking-tight">Client Portfolio</h2>
                  <p className="text-gray-400 text-sm mt-0.5">{submissions.length} client{submissions.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center min-h-[30vh]">
                  <Loader2 className="animate-spin text-finivis-blue" size={28} />
                </div>
              ) : submissions.length === 0 ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white/50 p-12">
                  <Users size={36} className="text-gray-300 mb-3" />
                  <h3 className="text-lg font-bold text-gray-700 mb-1">No Clients Yet</h3>
                  <p className="text-gray-500 text-center text-sm max-w-sm">Client submissions will appear here once they complete the intake form.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {submissions.map(sub => {
                    const oppCount = sub.opportunities_json?.length || 0;
                    const createdDate = new Date(sub.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    });

                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setActiveTab('evaluation');
                        }}
                        className="group text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-finivis-blue/20 transition-all duration-200 cursor-pointer px-4 py-3 flex items-center gap-3 min-w-[260px] max-w-[340px]"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-finivis-blue/10 to-finivis-blue/5 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-finivis-blue">{sub.client_name?.charAt(0)?.toUpperCase()}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-finivis-dark group-hover:text-finivis-blue transition-colors truncate">
                            {sub.client_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-gray-400">{createdDate}</span>
                            <span className="text-[11px] text-gray-300">|</span>
                            <span className="text-[11px] font-medium text-finivis-blue">{oppCount} opp{oppCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <ChevronRight size={14} className="text-gray-300 group-hover:text-finivis-blue transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
