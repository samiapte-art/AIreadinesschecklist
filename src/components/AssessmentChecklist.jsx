import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Circle, ClipboardList } from 'lucide-react';
import { CHECKLIST_SECTIONS } from '../data/checklistTemplate';

export default function AssessmentChecklist({ checklistData = {}, onUpdate, readOnly = false }) {
  const [expandedSection, setExpandedSection] = useState(0);

  const totalItems = CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const filledItems = CHECKLIST_SECTIONS.reduce(
    (sum, s) => sum + s.items.filter(item => checklistData[item.id]?.trim()).length,
    0
  );

  const getSectionFilled = (section) =>
    section.items.filter(item => checklistData[item.id]?.trim()).length;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-finivis-blue/10 flex items-center justify-center">
            <ClipboardList size={18} className="text-finivis-blue" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900">Data Intake</h3>
            <p className="text-xs text-gray-400 font-medium">
              Complete all sections to help us understand your automation needs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              filledItems === totalItems
                ? 'bg-green-100 text-green-700'
                : filledItems > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {filledItems}/{totalItems} completed
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-500 bg-finivis-blue"
            style={{ width: `${totalItems > 0 ? (filledItems / totalItems) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      {CHECKLIST_SECTIONS.map((section, sIdx) => {
        const isExpanded = expandedSection === sIdx;
        const sectionFilled = getSectionFilled(section);
        const sectionTotal = section.items.length;

        return (
          <div
            key={section.id}
            className="bg-white rounded-[1rem] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300"
          >
            {/* Section header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-finivis-light/50 transition-colors"
              onClick={() => setExpandedSection(isExpanded ? -1 : sIdx)}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-finivis-blue/10 text-finivis-blue font-semibold text-xs shrink-0">
                  {sIdx + 1}
                </span>
                <h3 className="text-sm font-semibold text-finivis-dark">
                  {section.title}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sectionFilled === sectionTotal
                    ? 'bg-green-100 text-green-600'
                    : sectionFilled > 0
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {sectionFilled}/{sectionTotal}
                </span>
              </div>
              {isExpanded
                ? <ChevronUp size={16} className="text-gray-400" />
                : <ChevronDown size={16} className="text-gray-400" />
              }
            </div>

            {/* Section items */}
            {isExpanded && (
              <div className="p-6 pt-0 border-t border-gray-100 flex flex-col gap-6">
                {section.items.map((item) => {
                  const value = checklistData[item.id] || '';
                  const isFilled = value.trim().length > 0;

                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-start gap-2">
                        {isFilled
                          ? <CheckCircle size={15} className="text-green-500 mt-0.5 shrink-0" />
                          : <Circle size={15} className="text-gray-300 mt-0.5 shrink-0" />
                        }
                        <label className="text-sm font-medium text-gray-700">
                          {item.id}. {item.label}
                        </label>
                      </div>
                      <div className="pl-[23px] space-y-3">
                        <p className="text-xs text-gray-400 font-medium whitespace-pre-line">
                          {item.description}
                        </p>
                        {readOnly ? (
                          value ? (
                            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 whitespace-pre-line">
                              {value}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-300 italic">No response provided</p>
                          )
                        ) : (
                          <textarea
                            className="apple-input"
                            rows={3}
                            placeholder="Enter your response..."
                            value={value}
                            onChange={(e) => onUpdate(item.id, e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
