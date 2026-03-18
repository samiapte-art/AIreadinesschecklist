import React, { useState, useEffect, useRef, useCallback } from 'react';
import OpportunityForm from './OpportunityForm';
import { Plus, LogOut, Loader2, FilePlus, ChevronRight, CheckCircle, X } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function ClientForm({ session }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Current Form State
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [clientWebsite, setClientWebsite] = useState('');
  const [clientName, setClientName] = useState('');
  const [opportunities, setOpportunities] = useState([{}]);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [isReviewMode, setIsReviewMode] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    // RLS automatically limits this to the client's own rows
    const { data, error } = await supabase
      .from('client_submissions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching submissions:", error);
    } else {
      setSubmissions(data || []);
      // Auto-select the most recent one if we don't have one selected, or keep the existing
      if (!selectedSubId && data && data.length > 0) {
        handleSelectSubmission(data[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectSubmission = (sub) => {
    if (!sub) {
      // Start a completely new submission
      setSelectedSubId(null);
      setClientName('');
      setClientWebsite('');
      setOpportunities([{}]);
      setExpandedIndex(0);
      setSubmittedMessage('');
      setIsReviewMode(false);
    } else {
      // Load existing submission
      setSelectedSubId(sub.id);
      setClientName(sub.client_name || '');
      setClientWebsite(sub.client_website || '');
      setOpportunities(sub.opportunities_json || [{}]);
      setExpandedIndex(-1); // Collapse all on load
      setSubmittedMessage('');
      setIsReviewMode(false);
    }
  };

  const addOpportunity = () => {
    if (opportunities.length >= 5) return;
    setOpportunities([...opportunities, {}]);
    setExpandedIndex(opportunities.length);
  };

  const removeOpportunity = (idx) => {
    const newOpps = [...opportunities];
    newOpps.splice(idx, 1);
    if (newOpps.length === 0) newOpps.push({});
    setOpportunities(newOpps);
    if (expandedIndex >= newOpps.length) setExpandedIndex(newOpps.length - 1);
  };

  const updateOpp = (idx, field, value) => {
    const newOpps = [...opportunities];
    newOpps[idx] = { ...newOpps[idx], [field]: value };
    setOpportunities(newOpps);
  };

  const isFormValid = opportunities.some(opp => opp.name && opp.description) && clientName.trim() !== '' && clientWebsite.trim() !== '';

  // Auto-save: persist changes to Supabase when editing an existing submission
  const autoSaveTimer = useRef(null);
  const autoSave = useCallback(async (subId, opps, name, website) => {
    if (!subId) return; // Only auto-save on existing records
    const { error } = await supabase
      .from('client_submissions')
      .update({ 
        opportunities_json: opps, 
        client_name: name,
        client_website: website
      })
      .eq('id', subId);
    if (error) console.error('Auto-save failed:', error);
  }, []);

  useEffect(() => {
    if (!selectedSubId) return;
    // Debounce: wait 2 seconds after the last change before saving
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      autoSave(selectedSubId, opportunities, clientName, clientWebsite);
    }, 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [opportunities, clientName, clientWebsite, selectedSubId, autoSave]);

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    
    const payload = { 
       user_id: session?.user?.id,
       client_name: clientName, 
       client_website: clientWebsite, 
       opportunities_json: opportunities 
    };

    let resultError = null;

    if (selectedSubId) {
      // Update existing
      const { error } = await supabase
        .from('client_submissions')
        .update(payload)
        .eq('id', selectedSubId);
      resultError = error;
    } else {
      // Create new
      const { error } = await supabase
        .from('client_submissions')
        .insert([payload]);
      resultError = error;
    }
      
    setIsSubmitting(false);

    if (resultError) {
      alert("Failed to save. Please check your connection or database configuration.");
      console.error(resultError);
    } else {
      setSubmittedMessage('Success! Your assessment has been submitted.');
      setIsReviewMode(true);
      fetchSubmissions(); // Re-fetch the list to show the new/updated name
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      
      {/* Header */}
      <header className="glass-header sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="Finivis Logo" className="h-8 object-contain" />
            <h1 className="text-xl font-bold tracking-tight text-finivis-dark hidden sm:block">
              AI Opportunity Discovery Tracker
            </h1>
          </div>
          
          <div className="flex-1 flex items-center justify-start md:justify-end gap-3 overflow-x-auto pb-2 md:pb-0 custom-scrollbar hide-scrollbar">
            {loading ? (
               <Loader2 className="animate-spin text-finivis-blue" size={20} />
            ) : (
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => handleSelectSubmission(null)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-medium transition-all border ${
                    !selectedSubId 
                    ? 'bg-finivis-dark text-white shadow-md border-transparent' 
                    : 'bg-green-50 hover:bg-green-100 text-green-700 border-transparent border-dashed border border-green-200'
                  }`}
                >
                  <FilePlus size={16} /> <span className="hidden md:inline">New Assessment</span>
                </button>
                
                {submissions.length > 0 && <span className="text-gray-300 mx-1">|</span>}

                {submissions.map(sub => (
                  <button 
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-medium transition-all border ${
                      selectedSubId === sub.id 
                      ? 'bg-finivis-dark text-white shadow-md border-transparent' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-transparent'
                    }`}
                  >
                    <span>{sub.client_name || 'Unnamed'}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div className="pl-4 ml-2 border-l border-gray-200 flex items-center shrink-0">
               <button 
                 onClick={() => supabase.auth.signOut()}
                 className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm font-medium"
                 title="Sign Out"
               >
                 <LogOut size={16} /> <span className="hidden sm:block">Sign Out</span>
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        
        {isReviewMode ? (
          <div className="space-y-6 animate-fade-in fade-in-up">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                 <button onClick={() => { setIsReviewMode(false); setSubmittedMessage(''); }} className="text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 p-2 rounded-full transition-colors" title="Close Review">
                   <X size={20} />
                 </button>
               </div>
               <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
               <h2 className="text-2xl font-bold text-green-800 mb-2">{submittedMessage || 'Successfully Submitted!'}</h2>
               <p className="text-green-600 max-w-xl mx-auto">Your assessment for <span className="font-semibold">{clientName || 'the company'}</span> has been saved. Please review the details below.</p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-apple border border-gray-100">
               <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-6">
                 <div>
                   <h3 className="text-xl font-bold text-finivis-dark">{clientName || 'Unnamed Assessment'}</h3>
                   <p className="text-gray-500 text-sm mt-1">{clientWebsite}</p>
                 </div>
                 <button onClick={() => { setIsReviewMode(false); setSubmittedMessage(''); }} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm">
                   Edit Assessment
                 </button>
               </div>

               <h4 className="font-bold text-gray-900 mb-4 tracking-tight">Process Opportunities ({opportunities.length})</h4>
               <div className="space-y-4">
                 {opportunities.map((opp, idx) => (
                   <div key={idx} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
                     <div className="flex items-start gap-4">
                       <div className="w-8 h-8 rounded-full bg-finivis-blue/10 text-finivis-blue flex items-center justify-center font-bold text-sm shrink-0">
                         {idx + 1}
                       </div>
                       <div>
                         <h5 className="font-bold text-gray-900 text-[15px]">{opp.name || 'Unnamed Opportunity'}</h5>
                         <p className="text-sm text-gray-600 mt-1.5 leading-relaxed whitespace-pre-wrap">{opp.description || 'No description provided.'}</p>
                         {opp.businessValue?.length > 0 && (
                           <div className="flex flex-wrap gap-2 mt-3">
                             {opp.businessValue.map((bv, i) => (
                               <span key={i} className="px-2.5 py-1 text-xs font-semibold bg-white border border-gray-200 text-gray-600 rounded-md">
                                 {bv}
                               </span>
                             ))}
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
            
            <button 
              onClick={() => handleSelectSubmission(null)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-[1.2rem] text-gray-600 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all bg-white"
            >
              <Plus size={20} /> Start Another Assessment
            </button>
          </div>
        ) : (
        <div className="space-y-8 animate-fade-in fade-in-up">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-3xl font-extrabold text-finivis-dark">{selectedSubId ? 'Edit Assessment' : 'New Assessment'}</h2>
          </div>

          {/* Intake Info */}
          <div className="bg-white p-8 rounded-[2rem] shadow-apple border border-gray-100 grid md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Acme Corp"
                  className="apple-input"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Website</label>
                <input 
                  type="text"
                  placeholder="e.g. acme.com"
                  className="apple-input"
                  value={clientWebsite}
                  onChange={(e) => setClientWebsite(e.target.value)}
                />
             </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-finivis-dark">Process Details ({opportunities.length}/5)</h2>
            </div>
            
            {opportunities.map((opp, idx) => (
              <OpportunityForm 
                key={idx}
                index={idx}
                opp={opp}
                updateOpp={updateOpp}
                removeOpp={opportunities.length > 1 ? removeOpportunity : null}
                isExpanded={expandedIndex === idx}
                toggleExpand={(i) => setExpandedIndex(expandedIndex === i ? -1 : i)}
              />
            ))}

            {opportunities.length < 5 && (
              <button 
                onClick={addOpportunity}
                className="w-full py-5 border-2 border-dashed border-gray-300 rounded-[1.5rem] text-finivis-blue font-bold flex items-center justify-center gap-2 hover:bg-finivis-blue/5 transition-all bg-white"
              >
                <Plus size={20} /> Add Another Process Opportunity
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button 
            disabled={!isFormValid || isSubmitting}
            onClick={handleSubmit}
            className={`w-full py-4 rounded-[1.2rem] font-bold text-[15px] transition-all flex items-center justify-center gap-2 ${
              isFormValid && !isSubmitting
              ? 'bg-finivis-blue text-white shadow-apple hover:-translate-y-0.5 hover:shadow-lg' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
          >
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <>Submit <ChevronRight size={16} /></>}
          </button>
        </div>
        )}
      </main>
    </div>
  );
}
