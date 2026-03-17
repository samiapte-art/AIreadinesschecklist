import React, { useState } from 'react';
import { Sparkles, AlertTriangle, Lightbulb, Code2, Copy, FileText, CheckCircle, Mail, Check, ChevronDown, ChevronUp } from 'lucide-react';

export default function AIInsightsPanel({ insights }) {
  const [copied, setCopied] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  if (!insights) return null;

  const handleCopy = () => {
    const emailText = `Subject: ${insights.draftEmail?.subject}\n\n${insights.draftEmail?.body}`;
    navigator.clipboard.writeText(emailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 text-gray-900 shadow-apple border border-gray-100 mt-8 mb-8 animate-fade-in fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-finivis-blue flex items-center justify-center p-2.5 rounded-[0.8rem] shadow-sm text-white">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-finivis-dark flex items-center gap-2">
              Finivis AI Strategist
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 bg-blue-50 text-xs text-finivis-blue font-semibold rounded border border-blue-100">
                Powered by GPT-4o
              </span>
              <span className="text-xs text-gray-400 font-medium">Auto-generated strategic analysis</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
          className="text-sm font-medium flex items-center justify-center gap-1.5 text-gray-600 hover:text-finivis-dark transition-colors bg-gray-50 hover:bg-gray-100 py-2 px-4 rounded-lg border border-gray-200"
         >
           {isPanelExpanded ? (
             <><ChevronUp size={16} /> Hide Analysis</>
           ) : (
             <><ChevronDown size={16} /> Show Analysis</>
           )}
         </button>
      </div>

      {isPanelExpanded && (
        <div className="space-y-8 animate-fade-in mt-8">
          {/* Top Row: Exec Summary & Top Rec */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#f5f5f7] p-6 rounded-[1.5rem] border border-gray-100/50">
              <h4 className="text-gray-500 text-xs tracking-widest uppercase font-bold mb-3 flex items-center gap-2">
                <Lightbulb size={16} className="text-yellow-500" /> Executive Summary
              </h4>
              <p className="text-gray-700 leading-relaxed text-sm font-medium">
                {insights.executiveSummary}
              </p>
            </div>

            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-apple relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-finivis-blue blur-[80px] opacity-10 rounded-full"></div>
              <h4 className="text-finivis-blue text-xs tracking-widest uppercase font-bold mb-3 relative z-10">
                Top Priority Recommendation
              </h4>
              <p className="text-finivis-dark font-extrabold text-xl mb-2 relative z-10">
                {insights.topRecommendation?.opportunityName}
              </p>
              <p className="text-gray-600 text-sm font-medium relative z-10">
                {insights.topRecommendation?.rationale}
              </p>
            </div>
          </div>

          {/* Middle Row: SOW & Email */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* SOW */}
            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-apple md:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-emerald-50">
                <h4 className="text-emerald-700 text-xs tracking-widest uppercase font-bold flex items-center gap-2">
                  <FileText size={16} className="text-emerald-500" /> Detailed Scope of Work (SOW)
                </h4>
              </div>

              {insights.scopeOfWork && (
                <div className="space-y-5 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                  <div className="flex justify-between items-start bg-emerald-50/50 p-4 rounded-lg border border-emerald-100/50">
                    <p className="font-bold text-lg text-emerald-950">{insights.scopeOfWork.title}</p>
                    <div className="text-right shrink-0 ml-4 flex flex-col items-end">
                      <span className="block text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">{insights.scopeOfWork.duration}</span>
                      <span className="block text-xs font-medium text-gray-500 mt-1">{insights.scopeOfWork.estimatedHours}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    {insights.scopeOfWork.phases?.map((phase, i) => (
                      <div key={i} className="text-sm bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="font-extrabold text-gray-900 mb-2">{phase.name}</p>
                        <p className="text-gray-600 text-xs leading-relaxed mb-4">{phase.description}</p>
                        
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <CheckCircle size={12} className="text-emerald-500" /> Deliverables
                        </p>
                        <ul className="text-gray-700 text-xs space-y-1.5">
                          {phase.deliverables?.map((d, j) => (
                            <li key={j} className="flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span className="font-medium">{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {insights.scopeOfWork.assumptions && (
                    <div className="mt-8 space-y-5">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Assumptions & Dependencies:</p>
                        <ul className="text-gray-600 text-xs space-y-1">
                          {insights.scopeOfWork.assumptions?.map((a, j) => (
                            <li key={j} className="flex items-start gap-2">
                              <span className="text-gray-400">•</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide mb-2">Out of Scope:</p>
                        <ul className="text-red-700/80 text-xs space-y-1">
                          {insights.scopeOfWork.outOfScope?.map((o, j) => (
                            <li key={j} className="flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              <span className="font-medium">{o}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Check size={14} /> Acceptance Criteria
                        </p>
                        <p className="text-emerald-800 text-xs font-medium">{insights.scopeOfWork.acceptanceCriteria}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Draft Email */}
            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-apple flex flex-col md:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <h4 className="text-gray-700 text-xs tracking-widest uppercase font-bold flex items-center gap-2">
                  <Mail size={16} className="text-finivis-blue" /> Draft Client Email
                </h4>
                <button 
                  onClick={handleCopy}
                  className="text-xs font-bold flex bg-gray-50 hover:bg-gray-100 border border-gray-200 items-center gap-1.5 text-gray-600 transition-colors py-1.5 px-3 rounded-md shadow-sm"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copied ? 'Copied to Clipboard!' : 'Copy Email'}
                </button>
              </div>
              
              {insights.draftEmail && (
                <div className="text-sm text-gray-700 bg-gray-50/80 p-5 rounded-xl flex-1 font-mono whitespace-pre-wrap overflow-y-auto max-h-[400px] border border-gray-100 leading-relaxed">
                  <p className="mb-4 pb-4 border-b border-gray-200"><span className="text-gray-400 font-bold">Subject:</span> <span className="font-bold">{insights.draftEmail.subject}</span></p>
                  <p>{insights.draftEmail.body}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Risk, Tech, Tasks */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#fff0f0] p-6 rounded-[1.5rem] border border-red-50 shadow-sm">
              <h4 className="text-red-700 text-xs tracking-widest uppercase font-bold mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" /> Risk Profile
              </h4>
              <p className="text-red-800 font-medium leading-relaxed text-sm">
                {insights.riskProfile}
              </p>
            </div>

            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-apple">
              <h4 className="text-gray-700 text-xs tracking-widest uppercase font-bold mb-4 flex items-center gap-2">
                <CheckCircle size={16} className="text-finivis-blue" /> Consultant Tasks
              </h4>
              <ul className="space-y-3">
                {insights.internalNextSteps?.map((task, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-700 items-start font-medium">
                    <div className="mt-1 w-5 h-5 rounded flex items-center justify-center bg-blue-50 text-finivis-blue border border-blue-100 shrink-0 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="pt-0.5">{task}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-apple">
              <h4 className="text-gray-700 text-xs tracking-widest uppercase font-bold mb-4 flex items-center gap-2">
                <Code2 size={16} className="text-purple-500" /> Suggested Tech Stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {insights.suggestedTechStack?.map((tech, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 shadow-[0_1px_2px_rgb(0,0,0,0.05)]">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
