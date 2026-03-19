import React, { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, Zap, Shield, Database, BarChart3, 
  MessageSquare, Layout, Server, ClipboardList, 
  TrendingUp, Loader2, Info, AlertTriangle, CheckCircle,
  Calendar, Users, FileCheck, ListChecks
} from 'lucide-react';
import { getOpportunityPreReqs } from '../utils/aiAnalyzer';

/**
 * OpportunityDetailView - A high-fidelity, deep-dive screen for a single AI opportunity.
 * Updated to focus on Challenge Matrix first and Client Pre-requisites.
 */
export default function OpportunityDetailView({ evaluatedOpp, clientName, onClose, onSaveRoadmap }) {
  const [schedule, setSchedule] = useState(evaluatedOpp.persisted_roadmap || null);
  const [loading, setLoading] = useState(!evaluatedOpp.persisted_roadmap);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we already have a persisted roadmap, don't re-fetch
    if (evaluatedOpp.persisted_roadmap) {
      setSchedule(evaluatedOpp.persisted_roadmap);
      setLoading(false);
      return;
    }

    async function fetchSchedule() {
      try {
        setLoading(true);
        const data = await getOpportunityPreReqs(evaluatedOpp, clientName);
        setSchedule(data);
        // Persist the freshly generated roadmap
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
    fetchSchedule();
  }, [evaluatedOpp, clientName, onSaveRoadmap]);

  const { scores, priority, challenges, effort, confidence, tags } = evaluatedOpp;

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F7FA] overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 flex items-center justify-between">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-gray-500 hover:text-finivis-dark transition-all font-medium"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
           <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
              priority === 'HIGH' ? 'bg-green-50 text-green-700 border-green-100' :
              priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-100' :
              'bg-yellow-50 text-yellow-700 border-yellow-100'
           }`}>
             {priority} PRIORITY
           </span>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
             <X size={20} />
           </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-finivis-dark mb-3">
            {evaluatedOpp.opportunityName}
          </h1>
          <div className="flex flex-wrap gap-2 mb-4">
             {tags?.map(tag => (
               <span key={tag} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                 {tag}
               </span>
             ))}
          </div>
          <p className="text-lg text-gray-500 max-w-3xl leading-relaxed">
            {evaluatedOpp.description}
          </p>
        </div>

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
                   items={challenges.data} 
                   detail={schedule?.dataRequirements?.[0]}
                 />
                 <ChallengeCard 
                   title="Process Maturity" 
                   icon={<ClipboardList size={16} />} 
                   items={challenges.process}
                   detail={schedule?.stakeholderChecklist?.[0]}
                 />
                 <ChallengeCard 
                   title="Tech Integration" 
                   icon={<Server size={16} />} 
                   items={challenges.feasibility}
                   detail={schedule?.stakeholderChecklist?.[1]}
                 />
              </div>
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Metrics & Scores */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-apple border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 size={18} className="text-finivis-blue" /> Framework Scores
              </h3>
              
              <div className="space-y-6">
                <ScoreBar label="Business Value" value={scores.value} color="bg-finivis-blue" />
                <ScoreBar label="Data Readiness" value={scores.data} color="bg-purple-500" />
                <ScoreBar label="Tech Feasibility" value={scores.feasibility} color="bg-orange-500" />
                <ScoreBar label="Risk Resilience" value={scores.risk} color="bg-finivis-red" />
                
                <div className="pt-6 border-t border-gray-100">
                   <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-gray-400">OVERALL READINESS</span>
                      <span className="text-3xl font-black text-finivis-dark">{scores.overall}%</span>
                   </div>
                   <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className="h-full bg-finivis-dark transition-all duration-1000" style={{ width: `${scores.overall}%` }}></div>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-finivis-dark text-white p-8 rounded-[2.5rem] border border-gray-800 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Zap size={24} className="text-yellow-400 fill-yellow-400" />
                <h3 className="text-lg font-bold">Quick Insights</h3>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between border-b border-gray-700 pb-3">
                    <span className="text-gray-400 text-sm">Target Effort</span>
                    <span className="font-bold">{effort}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-700 pb-3">
                    <span className="text-gray-400 text-sm">Automation Confidence</span>
                    <span className="font-bold text-green-400">{confidence}%</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Complexity</span>
                    <span className={`font-bold ${evaluatedOpp.complexity === 'HIGH' ? 'text-red-400' : 'text-blue-400'}`}>
                      {evaluatedOpp.complexity}
                    </span>
                 </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pre-automation Schedule */}
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-white p-8 rounded-[2.5rem] shadow-apple border border-gray-100 min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <ListChecks size={20} className="text-finivis-blue" /> Client Pre-Automation Roadmap
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">Steps required BEFORE Project Commencement</p>
                 </div>
                {loading && <Loader2 size={20} className="animate-spin text-finivis-blue" />}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                   <Loader2 size={40} className="animate-spin mb-4" />
                   <p className="font-medium">Curating readiness checklist...</p>
                </div>
              ) : error ? (
                <div className="text-center py-20">
                   <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4" />
                   <p className="text-gray-600">{error}</p>
                </div>
              ) : (
                <div className="space-y-8 animate-fade-in">
                   <div className="p-6 rounded-2xl bg-finivis-blue/5 border border-finivis-blue/10">
                      <h4 className="text-[10px] font-black text-finivis-blue uppercase tracking-widest mb-1 text-center">EXECUTIVE READINESS SUMMARY</h4>
                      <p className="text-gray-800 font-medium text-center leading-relaxed">"{schedule.clientExecutiveSummary}"</p>
                   </div>

                   <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Calendar size={14} /> STEP-BY-STEP READINESS SCHEDULE
                      </h4>
                      <div className="space-y-4">
                         {schedule.preAutomationTasks.map((item, idx) => (
                           <div key={idx} className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-finivis-blue group transition-all">
                              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-black text-finivis-blue shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                 {idx + 1}
                              </div>
                              <div className="flex-1">
                                 <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-bold text-gray-900">{item.task}</h5>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                                       item.importance === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                       {item.importance}
                                    </span>
                                 </div>
                                 <p className="text-xs text-gray-500 mb-2 leading-relaxed">{item.description}</p>
                                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                    <Users size={10} /> Owner: {item.owner}
                                 </div>
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
                            {schedule.dataRequirements.map((req, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                 <div className="w-1.5 h-1.5 rounded-full bg-finivis-blue"></div>
                                 {req}
                              </li>
                            ))}
                         </ul>
                      </div>
                      <div className="space-y-4">
                         <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <FileCheck size={14} /> STAKEHOLDER CHECKLIST
                         </h4>
                         <ul className="space-y-2">
                            {schedule.stakeholderChecklist.map((item, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-gray-600 font-medium whitespace-nowrap">
                                 <CheckCircle size={14} className="text-green-500" />
                                 {item}
                              </li>
                            ))}
                         </ul>
                      </div>
                   </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-bold text-gray-700">{label}</span>
        <span className="font-black text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function ChallengeCard({ title, icon, items, detail }) {
  return (
    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 h-full flex flex-col">
       <div className="flex items-center gap-2 mb-3 text-gray-900">
          <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-200">
             {icon}
          </div>
          <h5 className="font-bold text-sm">{title}</h5>
       </div>
       <ul className="space-y-2 mb-3">
          {items.length > 0 ? items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-xs text-gray-600 line-clamp-2">
               <span className="text-amber-500">•</span> {item}
            </li>
          )) : (
            <li className="text-[10px] text-green-600 font-bold flex items-center gap-1">
               <CheckCircle size={10} /> No Major Challenges
            </li>
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

const Sparkles = ({ size, className }) => (
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
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);
