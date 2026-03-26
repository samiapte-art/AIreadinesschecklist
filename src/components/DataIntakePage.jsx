import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LogOut, Loader2, FilePlus, ChevronRight, CheckCircle, X, ClipboardList, ArrowLeft } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import AssessmentChecklist from './AssessmentChecklist';

export default function DataIntakePage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [clientName, setClientName] = useState('');
  const [checklistData, setChecklistData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');

  const handleSelectSubmission = useCallback((sub) => {
    if (!sub) {
      setSelectedSubId(null);
      setClientName('');
      setChecklistData({});
      setSubmittedMessage('');
    } else {
      setSelectedSubId(sub.id);
      setClientName(sub.client_name || '');
      setChecklistData(sub.checklist_json || {});
      setSubmittedMessage('');
    }
  }, []);

  const fetchSubmissions = useCallback(async () => {
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
  }, [selectedSubId, handleSelectSubmission]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const autoSaveTimer = useRef(null);
  const autoSave = useCallback(async (subId, checklist) => {
    if (!subId) return;
    const { error } = await supabase
      .from('client_submissions')
      .update({ checklist_json: checklist })
      .eq('id', subId);
    if (error) console.error('Auto-save failed:', error);
  }, []);

  useEffect(() => {
    if (!selectedSubId) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      autoSave(selectedSubId, checklistData);
    }, 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [checklistData, selectedSubId, autoSave]);

  const handleSubmit = async () => {
    if (!selectedSubId) {
       alert("Please select or create an assessment first on the Opportunity Tracker page.");
       return;
    }
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('client_submissions')
      .update({ checklist_json: checklistData })
      .eq('id', selectedSubId);
      
    setIsSubmitting(false);

    if (error) {
      alert("Failed to save. Please check your connection.");
      console.error(error);
    } else {
      setSubmittedMessage('Data Intake completed successfully!');
      setTimeout(() => setSubmittedMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="glass-header sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-500" />
            </Link>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Finivis Logo" className="h-8 object-contain" />
              <h1 className="text-xl font-bold tracking-tight text-finivis-dark">Data Intake</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project:</span>
                <span className="text-sm font-semibold text-gray-700">{clientName || 'No Selection'}</span>
            </div>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-baseline justify-between mb-8">
           <div>
              <h2 className="text-3xl font-extrabold text-finivis-dark tracking-tight">Complete Data Intake</h2>
              <p className="text-gray-500 mt-2">Fill in the technical and operational details for your automation assessment.</p>
           </div>
           
           <select 
             className="apple-input w-auto min-w-[200px]"
             value={selectedSubId || ''}
             onChange={(e) => handleSelectSubmission(submissions.find(s => s.id === e.target.value))}
           >
              <option value="" disabled>Select Assessment</option>
              {submissions.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.client_name || 'Unnamed Project'}</option>
              ))}
           </select>
        </div>

        {submittedMessage && (
          <div className="mb-6 bg-green-50 border border-green-100 text-green-700 p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
            <CheckCircle size={20} />
            <span className="font-bold">{submittedMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <Loader2 className="animate-spin text-finivis-blue mb-4" size={32} />
            <p className="text-gray-500 font-medium">Loading your assessment data...</p>
          </div>
        ) : selectedSubId ? (
          <div className="space-y-8 animate-fade-in fade-in-up">
            <AssessmentChecklist
              checklistData={checklistData}
              onUpdate={(itemId, value) => setChecklistData(prev => ({ ...prev, [itemId]: value }))}
            />
            
            <div className="flex justify-center mt-10">
              <button 
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-12 py-4 bg-finivis-blue text-white rounded-full font-bold text-[16px] shadow-lg hover:bg-slate-800 hover:-translate-y-1 hover:shadow-xl transition-all flex items-center gap-2 group"
              >
                {isSubmitting ? (
                  <><Loader2 size={20} className="animate-spin" /> Saving...</>
                ) : (
                  <>Complete & Save Data Intake <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm px-10">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-400">
              <ClipboardList size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Assessment Selected</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Please select an existing project from the dropdown above or create a new one on the main dashboard to start the Data Intake process.</p>
            <Link 
              to="/" 
              className="inline-flex items-center justify-center px-6 py-3 bg-finivis-dark text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
            >
              Go to Opportunity Tracker
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
