import React, { useState, useEffect, useRef, useCallback } from 'react';
import OpportunityForm from './OpportunityForm';
import { Plus, LogOut, Loader2, FilePlus, ChevronRight, CheckCircle, X, ClipboardList, Zap, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    const { data, error } = await supabase
      .from('client_submissions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching submissions:", error);
    } else {
      setSubmissions(data || []);
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
      setSelectedSubId(null);
      setClientName('');
      setClientWebsite('');
      setOpportunities([{}]);
      setExpandedIndex(0);
      setSubmittedMessage('');
      setIsReviewMode(false);
    } else {
      setSelectedSubId(sub.id);
      setClientName(sub.client_name || '');
      setClientWebsite(sub.client_website || '');
      setOpportunities(sub.opportunities_json || [{}]);
      setExpandedIndex(-1);
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


  const autoSaveTimer = useRef(null);
  const autoSave = useCallback(async (subId, opps, name, website) => {
    if (!subId) return;
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
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      autoSave(selectedSubId, opportunities, clientName, clientWebsite);
    }, 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [opportunities, clientName, clientWebsite, selectedSubId, autoSave]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const payload = {
       user_id: session?.user?.id,
       client_name: clientName,
       client_website: clientWebsite,
       opportunities_json: opportunities
    };

    let resultError = null;

    if (selectedSubId) {
      const { error } = await supabase
        .from('client_submissions')
        .update(payload)
        .eq('id', selectedSubId);
      resultError = error;
    } else {
      const { error } = await supabase
        .from('client_submissions')
        .insert([payload]);
      resultError = error;
    }
      
    setIsSubmitting(false);

    if (resultError) {
      alert("Failed to save. Please check your connection.");
      console.error(resultError);
    } else {
      setSubmittedMessage('Success! Your assessment has been saved.');
      setIsReviewMode(true);
      fetchSubmissions();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="glass-header sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="Finivis Logo" className="h-8 object-contain" />
            <h1 className="text-xl font-bold tracking-tight text-finivis-dark hidden sm:block">
              Opportunity Tracker
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
               >
                 <LogOut size={16} /> <span className="hidden sm:block">Sign Out</span>
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {isReviewMode ? (
          <div className="space-y-6 animate-fade-in fade-in-up">
            <div className="flex items-center justify-between bg-white border border-green-200 rounded-2xl p-4 md:px-6 shadow-sm relative">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                   <CheckCircle size={20} className="text-green-600" />
                 </div>
                 <div>
                   <h2 className="text-base font-bold text-gray-900">{submittedMessage || 'Successfully Saved'}</h2>
                   <p className="text-sm text-gray-500">Your assessment for <span className="font-semibold text-gray-700">{clientName || 'the company'}</span> has been updated. Please review below.</p>
                 </div>
               </div>
               <button onClick={() => { setIsReviewMode(false); setSubmittedMessage(''); }} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors shrink-0">
                 <X size={18} />
               </button>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-apple border border-gray-100">
               <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-6">
                 <div>
                   <h3 className="text-xl font-bold text-finivis-dark">{clientName || 'Unnamed Assessment'}</h3>
                   <p className="text-gray-500 text-sm mt-1">{clientWebsite}</p>
                 </div>
                 <button onClick={() => setIsReviewMode(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm">
                   Edit Processes
                 </button>
               </div>

               {opportunities.some(opp => opp.name || opp.description) && (
                 <>
                   <h4 className="font-bold text-gray-900 mb-4 tracking-tight">Process Opportunities ({opportunities.filter(o => o.name || o.description).length})</h4>
                   <div className="space-y-4">
                     {opportunities.filter(o => o.name || o.description).map((opp, idx) => (
                       <div key={idx} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-finivis-blue/10 text-finivis-blue flex items-center justify-center font-bold text-sm shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <h5 className="font-bold text-gray-900 text-[15px]">{opp.name || 'Unnamed Opportunity'}</h5>
                              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed whitespace-pre-wrap">{opp.description || 'No description provided.'}</p>
                            </div>
                          </div>
                       </div>
                     ))}
                   </div>
                 </>
               )}

               <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">Next Step: Data Intake</h4>
                    <p className="text-sm text-gray-500 mt-1">Complete the operational detail checklist for this assessment.</p>
                  </div>
                  <Link 
                    to="/dataintake" 
                    className="flex items-center gap-2 px-5 py-2.5 bg-finivis-blue text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm shadow-md"
                  >
                    Fill Data Intake <ExternalLink size={16} />
                  </Link>
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

            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-finivis-dark text-white shadow-md"
              >
                <Zap size={15} /> Opportunity Tracker
              </div>
              
              <Link 
                to="/dataintake" 
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-white text-finivis-blue border border-finivis-blue/30 hover:bg-finivis-blue/5 transition-all shadow-sm"
              >
                <ClipboardList size={15} /> Go to Data Intake <ExternalLink size={14} />
              </Link>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-finivis-dark">Process Details <span className="text-gray-400 font-medium text-[16px]">({opportunities.length}/5)</span></h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {opportunities.map((opp, idx) => (
                  <div key={idx} className={expandedIndex === idx ? "col-span-1 md:col-span-2 lg:col-span-3 transition-all" : "transition-all"}>
                    <OpportunityForm
                      index={idx}
                      opp={opp}
                      updateOpp={updateOpp}
                      removeOpp={opportunities.length > 1 ? removeOpportunity : null}
                      isExpanded={expandedIndex === idx}
                      toggleExpand={(i) => setExpandedIndex(expandedIndex === i ? -1 : i)}
                    />
                  </div>
                ))}
              </div>

              {opportunities.length < 5 && (
                <button
                  onClick={addOpportunity}
                  className="w-full mt-4 py-4 border-2 border-dashed border-gray-200 rounded-[1rem] text-finivis-blue font-bold flex items-center justify-center gap-2 hover:bg-finivis-blue/5 transition-all bg-white text-sm"
                >
                  <Plus size={18} /> Add Another Process Opportunity
                </button>
              )}
            </div>

            <div className="flex justify-center mt-8">
              <button 
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-12 py-3 bg-[#2970FF] text-white rounded-full font-bold text-[15px] shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <>Save Assessment <ChevronRight size={16} /></>}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
