import React, { useState, useEffect } from 'react';
import {
  X, ArrowLeft, Zap, Shield, Database, BarChart3,
  MessageSquare, Layout, Server, ClipboardList,
  TrendingUp, Loader2, Info, AlertTriangle, CheckCircle,
  Calendar, Users, FileCheck, ListChecks, Layers, Lightbulb, RefreshCw
} from 'lucide-react';
import { getOpportunityPreReqs } from '../utils/aiAnalyzer';
import NotConsideredPanel from './NotConsideredPanel';
import KickoffReadinessPanel from './KickoffReadinessPanel';

// Safe text helper — converts any value (string, object, null) into a renderable string
const safeText = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.item || val.role || val.text || val.name || val.task || JSON.stringify(val);
  return String(val);
};

/**
 * OpportunityDetailView - Deep-dive screen for a single AI opportunity.
 * Now renders all sections dynamically from AI evaluation data.
 */
export default function OpportunityDetailView({ evaluatedOpp, clientName, onClose, onSaveRoadmap }) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOpp, setEditedOpp] = useState(evaluatedOpp);

  // Reusable fetch function — can be called from useEffect or Regenerate button
  async function runPromptChain() {
    try {
      setLoading(true);
      setLoadingStage('');
      setError(null);
      const scopePhases = evaluatedOpp.scope?.phases || [];
      const data = await getOpportunityPreReqs(evaluatedOpp, clientName, scopePhases, (stage) => {
        setLoadingStage(stage);
      });
      setSchedule(data);
      if (onSaveRoadmap) {
        onSaveRoadmap(data);
      }
    } catch (err) {
      console.error("Failed to load readiness schedule:", err);
      setError("Could not generate the readiness schedule at this time.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Check if cached roadmap exists AND has the new format (documentChecklist)
    const cached = evaluatedOpp.persisted_roadmap;
    if (cached && Array.isArray(cached.preAutomationTasks) && cached.preAutomationTasks.length > 0) {
      // Cache is fresh — use a deep copy for local state editing
      setSchedule(JSON.parse(JSON.stringify(cached)));
      setLoading(false);
      return;
    }

    // No cache or stale cache — run the 3-prompt chain
    runPromptChain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluatedOpp.opportunityName, evaluatedOpp.name, clientName]);

  const { priority, challenges, tags, decision, missingFields } = evaluatedOpp;

  const isNotConsidered = decision?.verdict === 'Not Considered';

  /* Strategic Outcome Report variables - commented out while section is hidden
  const phases = evaluatedOpp.scope?.phases || [
    { phase: 'Phase 1', title: 'Process standardization', desc: 'Aligning business logic and manual approval chains.' },
    { phase: 'Phase 2', title: 'Data preparation', desc: 'Centralizing scattered datasets and historical records.' },
    { phase: 'Phase 3', title: 'AI automation', desc: 'Deploying AI-driven decision support and extraction.' },
    { phase: 'Phase 4', title: 'Workflow deployment', desc: 'Full integration with existing systems.' }
  ];

  const challengeCategories = [
    { key: 'data', label: 'DATA', color: 'text-purple-400' },
    { key: 'process', label: 'PROCESS', color: 'text-blue-400' },
    { key: 'value', label: 'VALUE', color: 'text-orange-400' },
    { key: 'feasibility', label: 'FEASIBILITY', color: 'text-red-400' }
  ];

  const archStack = evaluatedOpp.scope?.architectureStack;
  */

  function getPriorityStyle(p) {
    if (p === 'High Priority' || p === 'HIGH') return 'bg-green-50 text-green-700 border-green-100';
    if (p === 'Good Candidate' || p === 'MEDIUM') return 'bg-blue-50 text-blue-700 border-blue-100';
    if (p === 'Experimental' || p === 'LOW') return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    return 'bg-red-50 text-red-700 border-red-100';
  }

  function getDecisionStyle(verdict) {
    if (verdict === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <div className="bg-[#F5F7FA] min-h-screen animate-fade-in pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-500 hover:text-finivis-dark transition-all font-medium"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          {decision && (
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getDecisionStyle(decision.verdict)}`}>
              {decision.verdict}
            </span>
          )}
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getPriorityStyle(priority)}`}>
            {priority}
          </span>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          {isEditing ? (
            <button
              onClick={() => {
                setIsEditing(false);
                if (onSaveRoadmap) onSaveRoadmap(schedule, editedOpp);
              }}
              className="px-4 py-1.5 bg-finivis-blue text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <CheckCircle size={14} /> Save Changes
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <ClipboardList size={14} /> Edit Mode
            </button>
          )}
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          {isEditing ? (
            <input
              className="text-4xl font-extrabold text-finivis-dark mb-3 w-full bg-white border-b-2 border-finivis-blue outline-none py-1 focus:bg-blue-50/30 px-2 rounded-t-lg transition-all"
              value={editedOpp.opportunityName}
              onChange={(e) => setEditedOpp({ ...editedOpp, opportunityName: e.target.value })}
            />
          ) : (
            <h1 className="text-4xl font-extrabold text-finivis-dark mb-3">
              {editedOpp.opportunityName}
            </h1>
          )}
          
          <div className="flex flex-wrap gap-2 mb-4">
            {tags?.map(tag => (
              <span key={tag} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
          
          {isEditing ? (
            <textarea
              className="text-lg text-gray-500 w-full bg-white border border-gray-200 rounded-xl p-4 outline-none focus:border-finivis-blue focus:ring-4 focus:ring-finivis-blue/5 transition-all text-left"
              rows={3}
              value={editedOpp.description}
              onChange={(e) => setEditedOpp({ ...editedOpp, description: e.target.value })}
            />
          ) : (
            <p className="text-lg text-gray-500 max-w-3xl leading-relaxed">
              {editedOpp.description}
            </p>
          )}
        </div>

        {/* Missing Fields Warning */}
        {missingFields && missingFields.length > 0 && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-[2rem] p-6 shadow-sm">
            <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertTriangle size={14} /> Incomplete Checklist — {missingFields.length} field{missingFields.length > 1 ? 's' : ''} missing
            </h4>
            <div className="grid md:grid-cols-2 gap-2">
              {missingFields.map((mf, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <div>
                    <span className="font-bold text-amber-800">{mf.label}</span>
                    <span className="text-amber-600"> — {mf.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternative Recommendation (if present) */}
        {evaluatedOpp.alternativeRecommendation && (
          <div className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2rem] p-6 md:p-8 border border-indigo-100 shadow-sm">
            <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Lightbulb size={14} /> Alternative Recommendation
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                evaluatedOpp.alternativeRecommendation.relationship === 'replaces'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-green-100 text-green-600'
              }`}>
                {evaluatedOpp.alternativeRecommendation.relationship === 'replaces' ? 'Alternative' : 'Complementary'}
              </span>
            </h4>
            <p className="text-sm text-gray-800 font-medium mb-2">
              {evaluatedOpp.alternativeRecommendation.approach}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {evaluatedOpp.alternativeRecommendation.rationale}
            </p>
          </div>
        )}

        {/* CONDITIONAL: Not Considered vs Full Blueprint */}
        {isNotConsidered ? (
          <NotConsideredPanel evaluatedOpp={evaluatedOpp} schedule={schedule} />
        ) : (
          <>

        {/* 1. CHALLENGE MATRIX AT THE TOP */}
        <div className="mb-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-apple border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" /> Critical Challenge Matrix
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              <ChallengeCard
                title="Data Pipeline"
                icon={<Database size={16} />}
                items={challenges?.data || []}
                detail={safeText(schedule?.dataRequirements?.[0])}
                isEditing={isEditing}
                onEdit={(newItems) => {
                  const newChallenges = { ...challenges, data: newItems };
                  setEditedOpp({ ...editedOpp, challenges: newChallenges });
                }}
              />
              <ChallengeCard
                title="Value Realization"
                icon={<TrendingUp size={16} />}
                items={challenges?.value || []}
                detail={null}
                isEditing={isEditing}
                onEdit={(newItems) => {
                  const newChallenges = { ...challenges, value: newItems };
                  setEditedOpp({ ...editedOpp, challenges: newChallenges });
                }}
              />
              <ChallengeCard
                title="Implementation Feasibility"
                icon={<Zap size={16} />}
                items={[...(challenges?.process || []), ...(challenges?.feasibility || [])]}
                detail={safeText(schedule?.stakeholderChecklist?.[0])}
                isEditing={isEditing}
                onEdit={(newItems) => {
                  const newChallenges = { ...challenges, feasibility: newItems }; // Simplified: putting merged back into feasibility for now
                  setEditedOpp({ ...editedOpp, challenges: newChallenges });
                }}
              />
            </div>
          </div>
        </div>

        {/* 2. STRATEGIC OUTCOME REPORT - Hidden per user request to reduce duplication
        <div className="mb-8">
          <div className="bg-finivis-dark text-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-800 relative overflow-hidden">
            ... [content omitted for brevity in comment] ...
          </div>
        </div>
        */}

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Column: Metrics & Scores - Hidden per user request
          <div className="lg:col-span-1 space-y-6">
            ...
          </div>
          */}

          {/* Right Column: Pre-automation Schedule - Now Full Width */}
          <div className="lg:col-span-3 space-y-8">

            <div className="bg-white p-8 rounded-[2.5rem] shadow-apple border border-gray-100 min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ListChecks size={20} className="text-finivis-blue" /> Client Pre-Automation Roadmap
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">Steps required BEFORE Project Commencement</p>
                </div>
                <div className="flex items-center gap-2">
                  {loading && <Loader2 size={20} className="animate-spin text-finivis-blue" />}
                  {!loading && (
                    <button
                      onClick={runPromptChain}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-finivis-blue bg-finivis-blue/5 hover:bg-finivis-blue/10 border border-finivis-blue/20 rounded-full transition-all"
                      title="Regenerate roadmap using latest AI analysis"
                    >
                      <RefreshCw size={12} /> Regenerate
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 size={40} className="animate-spin mb-4" />
                  <p className="font-medium">{loadingStage || 'Curating readiness checklist...'}</p>
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4" />
                  <p className="text-gray-600">{error}</p>
                </div>
              ) : (
                <div className="space-y-8 animate-fade-in">
                  <div className="p-6 rounded-2xl bg-finivis-blue/5 border border-finivis-blue/10 relative group">
                    <h4 className="text-[10px] font-black text-finivis-blue uppercase tracking-widest mb-1 text-center">EXECUTIVE READINESS SUMMARY</h4>
                    {isEditing ? (
                      <textarea
                        className="w-full bg-white border border-finivis-blue/20 rounded-xl p-3 text-gray-800 font-medium text-sm outline-none focus:border-finivis-blue transition-all"
                        value={schedule.clientExecutiveSummary}
                        onChange={(e) => setSchedule({ ...schedule, clientExecutiveSummary: e.target.value })}
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-800 font-medium text-center leading-relaxed">"{schedule.clientExecutiveSummary}"</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} /> STEP-BY-STEP READINESS SCHEDULE
                      </h4>
                      {isEditing && (
                        <button
                          onClick={() => {
                            const newTasks = [...(schedule.preAutomationTasks || []), { task: 'New Task', description: 'Brief description...', importance: 'Standard', owner: 'Consultant' }];
                            setSchedule({ ...schedule, preAutomationTasks: newTasks });
                          }}
                          className="text-[10px] font-bold text-finivis-blue hover:underline"
                        >
                          + Add Step
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {(schedule.preAutomationTasks || []).map((item, idx) => (
                        <div key={idx} className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-finivis-blue group transition-all relative">
                          {isEditing && (
                            <button
                              onClick={() => {
                                const newTasks = schedule.preAutomationTasks.filter((_, i) => i !== idx);
                                setSchedule({ ...schedule, preAutomationTasks: newTasks });
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <X size={14} />
                            </button>
                          )}
                          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-black text-finivis-blue shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    className="flex-1 font-bold text-gray-900 bg-white border border-gray-200 rounded p-1 outline-none focus:border-finivis-blue"
                                    value={item.task}
                                    onChange={(e) => {
                                      const newTasks = [...schedule.preAutomationTasks];
                                      newTasks[idx].task = e.target.value;
                                      setSchedule({ ...schedule, preAutomationTasks: newTasks });
                                    }}
                                  />
                                  <select
                                    className="text-[10px] font-bold uppercase rounded border border-gray-200 px-1 outline-none"
                                    value={item.importance}
                                    onChange={(e) => {
                                      const newTasks = [...schedule.preAutomationTasks];
                                      newTasks[idx].importance = e.target.value;
                                      setSchedule({ ...schedule, preAutomationTasks: newTasks });
                                    }}
                                  >
                                    <option value="Critical">Critical</option>
                                    <option value="Standard">Standard</option>
                                  </select>
                                </div>
                                <textarea
                                  className="w-full text-xs text-gray-500 bg-white border border-gray-200 rounded p-1 outline-none focus:border-finivis-blue"
                                  rows={2}
                                  value={item.description}
                                  onChange={(e) => {
                                    const newTasks = [...schedule.preAutomationTasks];
                                    newTasks[idx].description = e.target.value;
                                    setSchedule({ ...schedule, preAutomationTasks: newTasks });
                                  }}
                                />
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                  <Users size={10} /> 
                                  <input
                                    className="bg-transparent border-b border-gray-200 outline-none focus:border-finivis-blue"
                                    value={item.owner}
                                    placeholder="Owner"
                                    onChange={(e) => {
                                      const newTasks = [...schedule.preAutomationTasks];
                                      newTasks[idx].owner = e.target.value;
                                      setSchedule({ ...schedule, preAutomationTasks: newTasks });
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start mb-1">
                                  <h5 className="font-bold text-gray-900">{item.task}</h5>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${item.importance === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {item.importance}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2 leading-relaxed">{item.description}</p>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                  <Users size={10} /> Owner: {item.owner}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Database size={14} /> DATA REQUIREMENTS
                      </h4>
                      <ul className="space-y-2">
                        {(schedule.dataRequirements || []).map((req, i) => {
                          const isObject = typeof req === 'object' && req !== null;
                          return (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-600 font-medium">
                              <div className="w-1.5 h-1.5 rounded-full bg-finivis-blue mt-1.5 shrink-0"></div>
                              <div>
                                <span className="text-gray-800 font-semibold">{isObject ? (req.item || JSON.stringify(req)) : String(req)}</span>
                                {isObject && req.reason && (
                                  <span className="text-gray-400 ml-1">— {req.reason}</span>
                                )}
                                {isObject && req.priority && (
                                  <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    req.priority === 'Critical' ? 'bg-red-100 text-red-600' :
                                    req.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                                    'bg-blue-100 text-blue-600'
                                  }`}>{req.priority}</span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div className="space-y-4 group/items relative">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <FileCheck size={14} /> STAKEHOLDER CHECKLIST
                        </h4>
                        {isEditing && (
                          <button
                            onClick={() => {
                              const newStakeholders = [...(schedule.stakeholderChecklist || []), { role: 'New Role', reason: 'Describe role impact...', involvement: 'Ongoing' }];
                              setSchedule({ ...schedule, stakeholderChecklist: newStakeholders });
                            }}
                            className="text-[10px] font-bold text-finivis-blue hover:underline"
                          >
                            + Add Role
                          </button>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {(schedule.stakeholderChecklist || []).map((item, i) => {
                          const isObject = typeof item === 'object' && item !== null;
                          return (
                            <li key={i} className="flex items-center gap-2 text-xs text-gray-600 font-medium group/item relative">
                              {isEditing && (
                                <button
                                  onClick={() => {
                                    const newStakeholders = schedule.stakeholderChecklist.filter((_, idx) => idx !== i);
                                    setSchedule({ ...schedule, stakeholderChecklist: newStakeholders });
                                  }}
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity z-10"
                                >
                                  <X size={10} />
                                </button>
                              )}
                              <CheckCircle size={14} className="text-green-500 shrink-0" />
                              <div className="flex-1">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <div className="flex gap-2">
                                      <input
                                        className="flex-1 bg-white border border-gray-100 rounded px-1 outline-none text-gray-800 font-semibold"
                                        value={isObject ? item.role : item}
                                        onChange={(e) => {
                                          const newStakeholders = [...schedule.stakeholderChecklist];
                                          if (isObject) newStakeholders[i].role = e.target.value;
                                          else newStakeholders[i] = e.target.value;
                                          setSchedule({ ...schedule, stakeholderChecklist: newStakeholders });
                                        }}
                                      />
                                      <select
                                        className="text-[9px] font-bold uppercase rounded border border-gray-100 px-1 outline-none bg-white"
                                        value={isObject ? (item.involvement || 'Ongoing') : 'Ongoing'}
                                        onChange={(e) => {
                                          const newStakeholders = [...schedule.stakeholderChecklist];
                                          if (isObject) newStakeholders[i].involvement = e.target.value;
                                          else newStakeholders[i] = { role: item, involvement: e.target.value };
                                          setSchedule({ ...schedule, stakeholderChecklist: newStakeholders });
                                        }}
                                      >
                                        <option value="Ongoing">Ongoing</option>
                                        <option value="Sign-off">Sign-off</option>
                                        <option value="Consulted">Consulted</option>
                                      </select>
                                    </div>
                                    <input
                                      className="w-full text-[10px] text-gray-400 italic bg-white border border-gray-100 rounded px-1 outline-none"
                                      value={isObject ? (item.reason || '') : ''}
                                      placeholder="Reason for involvement..."
                                      onChange={(e) => {
                                        const newStakeholders = [...schedule.stakeholderChecklist];
                                        if (isObject) newStakeholders[i].reason = e.target.value;
                                        else newStakeholders[i] = { role: item, reason: e.target.value };
                                        setSchedule({ ...schedule, stakeholderChecklist: newStakeholders });
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-gray-800 font-semibold">{isObject ? item.role : item}</span>
                                    {isObject && item.reason && (
                                      <span className="text-gray-400 ml-1">— {item.reason}</span>
                                    )}
                                    {isObject && item.involvement && (
                                      <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${item.involvement === 'Ongoing' ? 'bg-blue-100 text-blue-600' :
                                          item.involvement === 'Sign-off' ? 'bg-purple-100 text-purple-600' :
                                            'bg-gray-100 text-gray-500'
                                        }`}>{item.involvement}</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Kickoff Readiness Panel — only for Approved opportunities */}
        {!isNotConsidered && schedule && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-apple border border-gray-100 mt-8">
            <KickoffReadinessPanel
              kickoffReadiness={schedule.kickoffReadiness}
              dataRequirements={schedule.dataRequirements}
              documentRequirements={schedule.documentRequirements}
              accessRequirements={schedule.accessRequirements}
              documentChecklist={schedule.documentChecklist}
              isEditing={isEditing}
              onUpdate={(updates) => setSchedule({ ...schedule, ...updates })}
            />
          </div>
        )}

          </>
        )}

      </div>
    </div>
  );
}

/* Unused ScoreBar - commented out after hiding the Framework Scores section
function ScoreBar({ label, value, color }) {
  ...
}
*/

function ChallengeCard({ title, icon, items, detail, isEditing, onEdit }) {
  return (
    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 h-full flex flex-col group relative">
      <div className="flex items-center gap-2 mb-3 text-gray-900">
        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-200">
          {icon}
        </div>
        <h5 className="font-bold text-sm">{title}</h5>
      </div>
      <ul className="space-y-2 mb-3">
        {items.length > 0 ? items.map((item, idx) => (
          <li key={idx} className="flex gap-2 text-xs text-gray-600 group/item relative">
            <span className="text-amber-500">•</span>
            {isEditing ? (
              <div className="flex-1 flex gap-1">
                <input
                  className="flex-1 bg-white border border-gray-200 rounded px-1 outline-none focus:border-finivis-blue"
                  value={item}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx] = e.target.value;
                    onEdit(newItems);
                  }}
                />
                <button
                  onClick={() => {
                    const newItems = items.filter((_, i) => i !== idx);
                    onEdit(newItems);
                  }}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover/item:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <span className="line-clamp-2">{item}</span>
            )}
          </li>
        )) : (
          <li className="text-[10px] text-green-600 font-bold flex items-center gap-1">
            <CheckCircle size={10} /> No Major Challenges
          </li>
        )}
        {isEditing && (
          <button
            onClick={() => onEdit([...items, 'New challenge statement...'])}
            className="text-[10px] text-finivis-blue font-bold hover:underline mt-1"
          >
            + Add Challenge
          </button>
        )}
      </ul>
      {detail && (
        <div className="mt-auto pt-3 border-t border-gray-200 text-[10px] text-gray-400 italic font-medium">
          AI Insight: {detail}
        </div>
      )}
    </div>
  );
}

/* Unused SparklesIcon - commented out while section is hidden
const SparklesIcon = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
*/

