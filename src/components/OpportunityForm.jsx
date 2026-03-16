import React from 'react';
import { ChevronDown, ChevronUp, Check, Trash2 } from 'lucide-react';

const PAIN_POINTS = [
  'Manual work',
  'Slow turnaround',
  'Errors or rework',
  'High cost',
  'Poor customer experience',
  'Data scattered across systems'
];

const VALUES = [
  'Revenue growth',
  'Cost reduction',
  'Productivity / efficiency',
  'Better customer experience',
  'Compliance / risk reduction'
];

export default function OpportunityForm({ opp, index, updateOpp, removeOpp, isExpanded, toggleExpand }) {

  const handleMultiSelect = (field, val) => {
    const current = opp[field] || [];
    if (current.includes(val)) {
      updateOpp(index, field, current.filter(v => v !== val));
    } else {
      updateOpp(index, field, [...current, val]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-finivis-border mb-4 overflow-hidden transition-all duration-300">
      <div 
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-finivis-light/50 transition-colors"
        onClick={() => toggleExpand(index)}
      >
        <div className="flex items-center gap-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-finivis-blue/10 text-finivis-blue font-semibold text-sm">
            {index + 1}
          </span>
          <h3 className="text-lg font-semibold text-finivis-dark">
            {opp.name || `Opportunity ${index + 1}`}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {removeOpp && (
             <button 
               onClick={(e) => { e.stopPropagation(); removeOpp(index); }}
               className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
             >
               <Trash2 size={18} />
             </button>
          )}
          {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 pt-0 border-t border-finivis-border flex flex-col gap-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">1. Opportunity Name</label>
            <input 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-finivis-blue focus:border-finivis-blue transition-all"
              placeholder="e.g. Automate quote generation"
              value={opp.name || ''}
              onChange={(e) => updateOpp(index, 'name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">2. Business Area Focus</label>
            <p className="text-xs text-gray-500">What does this process currently involve?</p>
            <textarea 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-finivis-blue focus:border-finivis-blue transition-all"
              rows={3}
              placeholder="Describe the current manual process..."
              value={opp.description || ''}
              onChange={(e) => updateOpp(index, 'description', e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">3. Current Pain Points</label>
            <div className="flex flex-wrap gap-2">
              {PAIN_POINTS.map(pt => (
                <button
                  key={pt}
                  onClick={() => handleMultiSelect('painPoints', pt)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1 ${
                    (opp.painPoints || []).includes(pt)
                      ? 'bg-finivis-blue text-white border-finivis-blue'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-finivis-blue'
                  }`}
                >
                  {(opp.painPoints || []).includes(pt) && <Check size={14} />}
                  {pt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">4. Business Value</label>
            <p className="text-xs text-gray-500 mb-1">What would improve if solved?</p>
            <div className="flex flex-wrap gap-2">
              {VALUES.map(val => (
                <button
                  key={val}
                  onClick={() => handleMultiSelect('businessValue', val)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1 ${
                    (opp.businessValue || []).includes(val)
                      ? 'bg-finivis-red text-white border-finivis-red'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-finivis-red'
                  }`}
                >
                  {(opp.businessValue || []).includes(val) && <Check size={14} />}
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">5. Current Process Maturity</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-finivis-blue outline-none"
              value={opp.maturity || ''}
              onChange={(e) => updateOpp(index, 'maturity', e.target.value)}
            >
              <option value="" disabled>Select maturity</option>
              <option>Not documented</option>
              <option>Partially documented</option>
              <option>Well documented and standardized</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">6. Data Availability</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-finivis-blue outline-none"
              value={opp.dataAvailability || ''}
              onChange={(e) => updateOpp(index, 'dataAvailability', e.target.value)}
            >
              <option value="" disabled>Select data state</option>
              <option>High (clean, structured data available)</option>
              <option>Medium (some data available but messy)</option>
              <option>Low (little or no data)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">7. Frequency of the Process</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-finivis-blue outline-none"
              value={opp.frequency || ''}
              onChange={(e) => updateOpp(index, 'frequency', e.target.value)}
            >
              <option value="" disabled>Select frequency</option>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Occasionally</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">8. Systems Involved</label>
            <input 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-finivis-blue"
              placeholder="e.g. CRM, ERP, Excel"
              value={opp.systems || ''}
              onChange={(e) => updateOpp(index, 'systems', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">9. Desired Future State</label>
            <textarea 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-finivis-blue"
              rows={2}
              placeholder="What would the ideal outcome look like?"
              value={opp.futureState || ''}
              onChange={(e) => updateOpp(index, 'futureState', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">10. KPI for Success</label>
            <input 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-finivis-blue"
              placeholder="e.g. Reduce processing time by 50%"
              value={opp.kpi || ''}
              onChange={(e) => updateOpp(index, 'kpi', e.target.value)}
            />
          </div>

        </div>
      )}
    </div>
  );
}
