import React, { useState, useEffect } from 'react';
import OpportunityForm from './OpportunityForm';
import { Plus, ArrowRight, Save, Send } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function ClientForm() {
  const [processName, setProcessName] = useState('');
  const [clientName, setClientName] = useState('');
  const [opportunities, setOpportunities] = useState([{}]);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto-load from history
  useEffect(() => {
    const saved = localStorage.getItem('finivis_client_data');
    if (saved) {
      try {
        const { processName: savedProcess, clientName: savedClient, opportunities: savedOpps } = JSON.parse(saved);
        if (savedProcess) setTimeout(() => setProcessName(savedProcess), 0);
        if (savedClient) setTimeout(() => setClientName(savedClient), 0);
        if (savedOpps && savedOpps.length > 0) setTimeout(() => setOpportunities(savedOpps), 0);
      } catch(e) { console.error('Error loading saved data', e); }
    }
  }, []);

  // Auto-save on change
  useEffect(() => {
    const data = { processName, clientName, opportunities };
    localStorage.setItem('finivis_client_data', JSON.stringify(data));
  }, [processName, clientName, opportunities]);

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

  const isFormValid = opportunities.some(opp => opp.name && opp.description) && clientName.trim() !== '' && processName.trim() !== '';

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    
    // We send data to Supabase
    const { error } = await supabase
      .from('client_submissions')
      .insert([
        { 
           client_name: clientName, 
           process_area: processName, 
           opportunities_json: opportunities 
        }
      ]);
      
    setIsSubmitting(false);

    if (error) {
      alert("Failed to submit. Please check your connection or database configuration.");
      console.error(error);
    } else {
      setSubmitted(true);
      localStorage.removeItem('finivis_client_data'); // Clear local storage on success
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6">
         <div className="bg-white max-w-lg w-full rounded-3xl p-10 text-center shadow-xl border border-gray-100 animate-fade-in fade-in-up">
           <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
             <Save className="text-green-600 w-10 h-10" />
           </div>
           <h2 className="text-3xl font-bold text-finivis-dark mb-4">Assessment Submitted</h2>
           <p className="text-gray-500 mb-8 leading-relaxed">
             Thank you. Our strategists have securely received your processes. 
             We are utilizing the Finivis AI framework to analyze viability and will present a custom implementation roadmap during our next sync.
           </p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Finivis Logo" className="h-8 object-contain" />
            <h1 className="text-xl font-bold tracking-tight text-finivis-dark hidden sm:block">
              AI opportunity Discovery tracker
            </h1>
          </div>
          
          <div className="flex gap-2 items-center">
            <p className="text-xs text-gray-500 mr-4 hidden md:flex items-center gap-1">
              <Save size={12} /> Auto-saving progress...
            </p>
            <button 
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
              className={`text-sm font-medium px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
                isFormValid && !isSubmitting
                ? 'bg-gradient-to-r from-finivis-blue to-[#2B6AF0] hover:shadow-lg text-white' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Sending...' : 'Submit'} <Send size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="space-y-8 animate-fade-in">
          
          {/* Intake Info */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-finivis-border grid md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">client website</label>
                <input 
                  type="text"
                  placeholder="e.g. Acme Corp"
                  className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-finivis-blue outline-none transition-all"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Area Focus</label>
                <input 
                  type="text"
                  placeholder="e.g. Finance & Accounting Validation"
                  className="w-full text-lg p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-finivis-blue outline-none transition-all"
                  value={processName}
                  onChange={(e) => setProcessName(e.target.value)}
                />
             </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2 px-2">
              <h2 className="text-xl font-bold text-finivis-dark">Process Breakdowns ({opportunities.length}/5)</h2>
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
                className="w-full py-5 border-2 border-dashed border-gray-300 rounded-2xl text-finivis-blue font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-all bg-white"
              >
                <Plus size={20} /> Add Another Process Opportunity
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
