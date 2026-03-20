import React from 'react';
import { XCircle, AlertTriangle, RefreshCw, Lightbulb, ChevronRight, CheckCircle, X as XIcon } from 'lucide-react';

/**
 * NotConsideredPanel — Client-facing justification panel for opportunities
 * that did not meet the qualification threshold.
 * Professional, respectful tone throughout.
 */
export default function NotConsideredPanel({ evaluatedOpp, schedule }) {
  const { decision, scores } = evaluatedOpp;
  const notConsideredDetails = schedule?.notConsideredDetails;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Decision Verdict Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-extrabold text-amber-900">Not Considered</h3>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                Score: {scores?.overall || 'N/A'}%
              </span>
            </div>
            <p className="text-amber-800 leading-relaxed font-medium text-sm">
              {decision?.reasoning || 'This opportunity did not meet the qualification criteria at this time.'}
            </p>
          </div>
        </div>
      </div>

      {/* Formal Justification */}
      {notConsideredDetails?.formalJustification && (
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-apple border border-gray-100">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <XCircle size={14} className="text-amber-500" /> Assessment Summary
          </h4>
          <p className="text-gray-700 leading-relaxed font-medium text-[15px]">
            {notConsideredDetails.formalJustification}
          </p>
        </div>
      )}

      {/* Criteria Evaluation Checklist */}
      {decision?.criteriaChecklist && decision.criteriaChecklist.length > 0 && (
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-apple border border-gray-100">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            Qualification Criteria Assessment
          </h4>
          <div className="space-y-3">
            {decision.criteriaChecklist.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                  item.met
                    ? 'bg-green-50/50 border-green-100'
                    : 'bg-red-50/50 border-red-100'
                }`}
              >
                <div className={`mt-0.5 shrink-0 ${item.met ? 'text-green-500' : 'text-red-400'}`}>
                  {item.met ? <CheckCircle size={18} /> : <XIcon size={18} />}
                </div>
                <div>
                  <p className={`text-sm font-bold ${item.met ? 'text-green-800' : 'text-red-800'}`}>
                    {item.criterion}
                  </p>
                  <p className={`text-xs mt-1 leading-relaxed ${item.met ? 'text-green-600' : 'text-red-600'}`}>
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specific Failures */}
      {notConsideredDetails?.specificFailures && notConsideredDetails.specificFailures.length > 0 && (
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-apple border border-gray-100">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400" /> Key Issues Identified
          </h4>
          <div className="space-y-3">
            {notConsideredDetails.specificFailures.map((failure, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-black uppercase">
                    {failure.area}
                  </span>
                </div>
                <p className="text-sm text-gray-800 font-medium mb-1">{failure.issue}</p>
                <p className="text-xs text-gray-500 italic">
                  Based on: {failure.checklistInput}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Path to Reconsideration */}
      {notConsideredDetails?.pathToReconsideration && notConsideredDetails.pathToReconsideration.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2rem] p-6 md:p-8 border border-blue-100 shadow-sm">
          <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-6 flex items-center gap-2">
            <RefreshCw size={14} /> Path to Reconsideration
          </h4>
          <p className="text-sm text-blue-800 font-medium mb-6">
            This opportunity could become viable with the following changes. We recommend addressing these items and resubmitting for evaluation.
          </p>
          <div className="space-y-3">
            {notConsideredDetails.pathToReconsideration.map((step, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-white/70 backdrop-blur rounded-2xl border border-blue-100 hover:border-blue-300 transition-all">
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-sm font-black text-blue-700 shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-bold text-gray-900 text-sm">{step.condition}</h5>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                      step.priority === 'Critical' ? 'bg-red-100 text-red-600' :
                      step.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {step.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scaled-Down Alternative */}
      {notConsideredDetails?.scaledDownAlternative && (
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-apple border border-gray-100">
          <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Lightbulb size={14} className="text-emerald-500" /> Alternative Approach Available
          </h4>
          <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
            <p className="text-sm text-emerald-900 font-medium leading-relaxed">
              {notConsideredDetails.scaledDownAlternative}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-3 font-medium flex items-center gap-1">
            <ChevronRight size={12} /> Contact your Finivis consultant to explore this alternative
          </p>
        </div>
      )}
    </div>
  );
}
