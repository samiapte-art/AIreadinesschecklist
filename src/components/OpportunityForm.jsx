import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Trash2, FileUp, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

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
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleMultiSelect = (field, val) => {
    const current = opp[field] || [];
    if (current.includes(val)) {
      updateOpp(index, field, current.filter(v => v !== val));
    } else {
      updateOpp(index, field, [...current, val]);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    
    const existingDocs = opp.documents || [];
    const newDocs = [...existingDocs];

    for (const file of files) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `opportunity-docs/${timestamp}_${safeName}`;

      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        // If bucket doesn't exist, store locally as base64 fallback
        const reader = new FileReader();
        reader.onload = () => {
          newDocs.push({
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            // Store a note that it's a reference only
            storagePath: null,
            status: 'pending_bucket_setup'
          });
          updateOpp(index, 'documents', [...newDocs]);
        };
        reader.readAsDataURL(file);
      } else {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        newDocs.push({
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          storagePath: filePath,
          url: urlData?.publicUrl || null
        });
      }
    }

    updateOpp(index, 'documents', newDocs);
    setUploading(false);
  };

  const removeDocument = (docIdx) => {
    const docs = [...(opp.documents || [])];
    const removed = docs.splice(docIdx, 1)[0];
    
    // Try to delete from storage if it was uploaded
    if (removed?.storagePath) {
      supabase.storage.from('documents').remove([removed.storagePath]);
    }
    
    updateOpp(index, 'documents', docs);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`bg-white rounded-[1rem] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${!isExpanded ? 'h-full' : ''}`}>
      <div 
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-finivis-light/50 transition-colors ${!isExpanded ? 'h-full' : ''}`}
        onClick={() => toggleExpand(index)}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-finivis-blue/10 text-finivis-blue font-semibold text-xs shrink-0">
            {index + 1}
          </span>
          <h3 className="text-sm font-semibold text-finivis-dark truncate max-w-[200px]">
            {opp.name || `Opportunity ${index + 1}`}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {removeOpp && (
             <button 
               onClick={(e) => { e.stopPropagation(); removeOpp(index); }}
               className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
             >
               <Trash2 size={16} />
             </button>
          )}
          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 pt-0 border-t border-gray-100 flex flex-col gap-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">1. Opportunity Name</label>
            <input 
              className="apple-input"
              placeholder="e.g. Automate quote generation"
              value={opp.name || ''}
              onChange={(e) => updateOpp(index, 'name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">2. Opportunity Description</label>
            <p className="text-xs text-gray-500">What does this opportunity involve?</p>
            <textarea 
              className="apple-input"
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
                  className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all flex items-center gap-1.5 ${
                    (opp.painPoints || []).includes(pt)
                      ? 'bg-finivis-blue text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all flex items-center gap-1.5 ${
                    (opp.businessValue || []).includes(val)
                      ? 'bg-finivis-red text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              className="apple-input"
              value={opp.maturity || ''}
              onChange={(e) => updateOpp(index, 'maturity', e.target.value)}
            >
              <option value="" disabled>Select maturity</option>
              <option>Adhoc (No process, inconsistent)</option>
              <option>Defined (Documented but not enforced)</option>
              <option>Standardized (Consistent across team)</option>
              <option>Optimized (Measured and refined)</option>
              <option>Automated (Significant tech already used)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">6. Data Availability</label>
            <select 
              className="apple-input"
              value={opp.dataAvailability || ''}
              onChange={(e) => updateOpp(index, 'dataAvailability', e.target.value)}
            >
              <option value="" disabled>Select data state</option>
              <option>No data (Manual tracking/nothing)</option>
              <option>Manual data (Paper, distributed files)</option>
              <option>Digital unstructured (PDFs, Emails, Images)</option>
              <option>Structured systems (SQL, CRM, ERP)</option>
              <option>Data warehouse ready (Clean, integrated data)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">7. Frequency of the Process</label>
            <select 
              className="apple-input"
              value={opp.frequency || ''}
              onChange={(e) => updateOpp(index, 'frequency', e.target.value)}
            >
              <option value="" disabled>Select frequency</option>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Rare (Annual or less)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">8. Systems Involved</label>
            <input 
              className="apple-input"
              placeholder="e.g. CRM, ERP, Excel"
              value={opp.systems || ''}
              onChange={(e) => updateOpp(index, 'systems', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">9. Desired Future State</label>
            <textarea 
              className="apple-input"
              rows={2}
              placeholder="What would the ideal outcome look like?"
              value={opp.futureState || ''}
              onChange={(e) => updateOpp(index, 'futureState', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">10. KPI for Success</label>
            <input 
              className="apple-input"
              placeholder="e.g. Reduce processing time by 50%"
              value={opp.kpi || ''}
              onChange={(e) => updateOpp(index, 'kpi', e.target.value)}
            />
          </div>

          {/* Documentation Upload Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">11. Supporting Documentation</label>
            <p className="text-xs text-gray-500">Upload process maps, screenshots, SOPs, or any relevant documents.</p>
            
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                dragOver 
                  ? 'border-finivis-blue bg-finivis-blue/5 scale-[1.01]' 
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50/30'
              }`}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                {uploading ? (
                  <>
                    <Loader2 size={28} className="text-finivis-blue animate-spin" />
                    <p className="text-sm font-medium text-gray-600">Uploading...</p>
                  </>
                ) : (
                  <>
                    <FileUp size={28} className={dragOver ? 'text-finivis-blue' : 'text-gray-400'} />
                    <p className="text-sm font-medium text-gray-600">
                      Drop files here or <span className="text-finivis-blue">browse</span>
                    </p>
                    <p className="text-xs text-gray-400">PDF, Word, Excel, Images, CSV</p>
                  </>
                )}
              </div>
            </div>

            {/* Uploaded Files List */}
            {(opp.documents || []).length > 0 && (
              <div className="space-y-2 mt-3">
                {(opp.documents || []).map((doc, docIdx) => (
                  <div
                    key={docIdx}
                    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm group hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-finivis-blue/10 flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-finivis-blue" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(doc.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDocument(docIdx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
