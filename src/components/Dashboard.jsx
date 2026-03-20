import React, { useState, useMemo } from 'react';
import { evaluateOpportunity } from '../utils/EvaluationEngine';
import OpportunityDetailView from './OpportunityDetailView';
import { Download, FileText, FileSpreadsheet, Paperclip, ChevronRight, Brain, Calculator, Layout, Sparkles, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  BubbleController
} from 'chart.js';
import { Bubble } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as xlsx from 'xlsx';

ChartJS.register(LinearScale, PointElement, BubbleController, Tooltip, Legend, ChartDataLabels);

// Risk-based color mapping for bubble chart
function getRiskColor(riskScore) {
  if (riskScore >= 80) return 'rgba(16, 185, 129, 0.7)';   // Green — low risk
  if (riskScore >= 60) return 'rgba(234, 179, 8, 0.7)';    // Yellow — medium risk
  if (riskScore >= 40) return 'rgba(249, 115, 22, 0.7)';   // Orange — high risk
  return 'rgba(239, 68, 68, 0.7)';                          // Red — critical risk
}

function getPriorityStyle(priority) {
  switch (priority) {
    case 'High Priority':
    case 'HIGH':
      return 'bg-green-50 text-green-700 border-green-100';
    case 'Good Candidate':
    case 'MEDIUM':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'Experimental':
    case 'LOW':
      return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    default:
      return 'bg-red-50 text-red-700 border-red-100';
  }
}

export default function Dashboard({ 
  opportunities, 
  processName, 
  onUpdateOpportunity, 
  aiEvaluations, 
  scoringMode,
  clientName,
  clientWebsite,
  onRunDVF,
  dvfLoading,
  aiInsights,
  showAiStrategist,
  onToggleStrategist,
  aiError
}) {
  const [selectedOppIndex, setSelectedOppIndex] = useState(null);

  const results = useMemo(() => {
    if (scoringMode === 'ai' && aiEvaluations?.length) {
      // Use AI-driven DVF evaluations
      return aiEvaluations.map((evalOpp, idx) => ({
        ...evalOpp,
        persisted_roadmap: opportunities[idx]?.persisted_roadmap,
        originalIndex: idx
      }));
    }
    // Fallback: deterministic local scoring
    return opportunities.map((opp, idx) => ({
      ...opp,
      ...evaluateOpportunity(opp),
      originalIndex: idx
    }));
  }, [opportunities, aiEvaluations, scoringMode]);

  // Derive the active opportunity from results to ensure it stays in sync with parent updates
  const activeOpp = useMemo(() =>
    selectedOppIndex !== null ? results[selectedOppIndex] : null,
    [results, selectedOppIndex]);

  // Bubble chart: X=feasibility, Y=value, radius=dataReadiness, color=risk
  const chartData = {
    datasets: [
      {
        label: 'Opportunities',
        data: results.map(r => ({
          x: r.scores.feasibility,
          y: r.scores.value,
          r: Math.max(4, r.scores.data / 5), // Bubble radius proportional to data readiness
          name: r.opportunityName,
          priority: r.priority,
          risk: r.scores.risk,
          dataScore: r.scores.data
        })),
        backgroundColor: results.map(r => getRiskColor(r.scores.risk)),
        borderColor: results.map(r => getRiskColor(r.scores.risk).replace('0.7', '1')),
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    scales: {
      x: {
        min: 0, max: 100,
        title: { display: true, text: 'Implementation Ease (Feasibility %)' },
      },
      y: {
        min: 0, max: 100,
        title: { display: true, text: 'Business Impact (Value %)' }
      }
    },
    plugins: {
      datalabels: {
        anchor: 'end',
        align: 'top',
        formatter: (value, context) => {
          return context.dataset.data[context.dataIndex].name || 'Unnamed';
        },
        font: {
          weight: 'bold',
          size: 11
        },
        color: '#4B5563',
        offset: 4
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const d = ctx.raw;
            return [
              `${d.name}`,
              `Value: ${d.y}% | Feasibility: ${d.x}%`,
              `Data Readiness: ${d.dataScore}% | Risk: ${d.risk}%`,
              `Priority: ${d.priority}`
            ];
          }
        }
      }
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Finivis Solutions - AI Opportunity Evaluation", 14, 20);

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Process/Area: ${processName || 'General'}`, 14, 30);

    const tableData = results.map((r, i) => [
      i + 1,
      r.opportunityName,
      r.scores.value,
      r.scores.data,
      r.scores.feasibility,
      r.scores.risk,
      r.scores.overall,
      r.priority
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['#', 'Name', 'Value %', 'Data %', 'Feasibility %', 'Risk %', 'Overall %', 'Priority']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [26, 86, 204] },
    });

    doc.save(`Finivis_AI_Opportunities_${Date.now()}.pdf`);
  };

  const exportExcel = () => {
    const sheetData = results.map(r => ({
      "Name": r.opportunityName,
      "Description": r.description,
      "Pain Points": r.painPoints?.join(', '),
      "Maturity": r.maturity,
      "Data Availability": r.dataAvailability,
      "Frequency": r.frequency,
      "Business Value Labels": r.businessValue?.join(', '),
      "Future State": r.futureState,
      "KPI": r.kpi,
      "Systems": r.systems,
      "Value %": r.scores.value,
      "Data %": r.scores.data,
      "Feasibility %": r.scores.feasibility,
      "Risk %": r.scores.risk,
      "Overall Score %": r.scores.overall,
      "Priority": r.priority,
      "Implementation Effort": r.effort,
      "Automation Type": r.automationType,
      "ROI Timeline": r.roiTimeline || '',
      "Scoring Mode": r.scoringMode || scoringMode || 'local'
    }));

    const ws = xlsx.utils.json_to_sheet(sheetData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Opportunities");
    xlsx.writeFile(wb, `Finivis_AI_Opportunities_${Date.now()}.xlsx`);
  };

  const isAI = scoringMode === 'ai';

  return (
    <div className="space-y-8 animate-fade-in fade-in-up">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-apple border border-gray-100">
        {/* Consolidated Client & Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-gray-50 pb-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-finivis-blue/10 flex items-center justify-center text-finivis-blue shrink-0 shadow-sm border border-finivis-blue/20">
              <img src="/logo.png" alt="C" className="w-8 h-8 object-contain" onError={(e) => { e.target.parentElement.innerHTML = `<span class="text-xl font-black">${clientName?.charAt(0).toUpperCase() || 'C'}</span>` }} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-finivis-dark mb-1 tracking-tight">
                {clientName || 'Client Assessment'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                {clientWebsite && (
                  <a 
                    href={clientWebsite.startsWith('http') ? clientWebsite : `https://${clientWebsite}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-finivis-blue hover:underline transition-all flex items-center gap-1"
                  >
                    {clientWebsite.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block"></span>
                <span className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${isAI 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  {isAI ? <><Brain size={12} /> AI Scored</> : <><Calculator size={12} /> Estimated</>}
                </span>
                {aiError && (
                  <span className="text-red-500 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle size={12} /> {aiError}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {aiInsights && (
              <button
                onClick={onToggleStrategist}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-xs border ${showAiStrategist 
                  ? 'bg-finivis-dark text-white border-transparent shadow-lg' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Layout size={14} />
                {showAiStrategist ? "Hide Strategist View" : "Show Strategist View"}
              </button>
            )}

            <button
              onClick={onRunDVF}
              disabled={dvfLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-xs shadow-sm ${dvfLoading
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100'
                : 'bg-white border border-gray-200 text-finivis-dark hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {dvfLoading ? (
                <><Loader2 size={14} className="animate-spin" /> Running...</>
              ) : (
                <><Sparkles size={14} className="text-finivis-red" /> Run DVF Analysis</>
              )}
            </button>

            <div className="h-8 w-px bg-gray-200 mx-1 hidden lg:block"></div>

            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button 
                onClick={exportPDF} 
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-finivis-blue hover:bg-white rounded-lg transition-all text-[11px] font-bold"
                title="Export as PDF"
              >
                <FileText size={14} /> PDF
              </button>
              <button 
                onClick={exportExcel} 
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-emerald-600 hover:bg-white rounded-lg transition-all text-[11px] font-bold"
                title="Export as Excel"
              >
                <FileSpreadsheet size={14} /> EXCEL
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-finivis-dark uppercase tracking-tight">Evaluation Dashboard</h3>
            <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
            <p className="text-xs text-gray-400 font-medium">{results.length} Identified Opportunities</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-finivis-light/50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="p-3 font-semibold rounded-tl-lg">Opportunity Name</th>
                <th className="p-3 font-semibold">Data %</th>
                <th className="p-3 font-semibold">Value %</th>
                <th className="p-3 font-semibold">Feasibility %</th>
                <th className="p-3 font-semibold text-lg text-finivis-dark">Overall %</th>
                <th className="p-3 font-semibold">Priority</th>
                <th className="p-3 font-semibold rounded-tr-lg text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((r, i) => (
                <React.Fragment key={i}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-finivis-dark">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {r.opportunityName}
                          {(r.documents || []).length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              <Paperclip size={10} />{(r.documents || []).length}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {r.tags?.map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="p-3"><span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md font-medium">{r.scores.data}</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">{r.scores.value}</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md font-medium">{r.scores.feasibility}</span></td>
                    <td className="p-3 font-bold text-lg text-finivis-dark">{r.scores.overall}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getPriorityStyle(r.priority)}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedOppIndex(r.originalIndex)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-finivis-blue/5 text-finivis-blue hover:bg-finivis-blue hover:text-white rounded-lg transition-all text-xs font-bold"
                      >
                        Detail Assessment <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                  {/* Documents sub-row */}
                  {(r.documents || []).length > 0 && (
                    <tr className="bg-[#fafbfc]">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-500 mr-1">Documents:</span>
                          {(r.documents || []).map((doc, di) => (
                            <a
                              key={di}
                              href={doc.url || '#'}
                              download={doc.name}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-finivis-blue hover:text-finivis-blue transition-all group shadow-sm"
                            >
                              <FileText size={12} className="text-finivis-blue" />
                              <span className="max-w-[150px] truncate">{doc.name}</span>
                              <Download size={10} className="text-gray-400 group-hover:text-finivis-blue" />
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-apple border border-gray-100">
          <h3 className="text-xl font-bold text-finivis-dark mb-2">AI Opportunity Quadrant</h3>
          <p className="text-sm text-gray-500 mb-1">Top Right = Highest Value & Easiest to Implement</p>
          <p className="text-xs text-gray-400 mb-4">Bubble size = Data Readiness &bull; Color = Risk Level (green=low, red=high)</p>
          <div className="aspect-video max-h-[500px] w-full">
            <Bubble data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-apple border border-gray-100">
          <h3 className="text-xl font-bold text-finivis-dark mb-6">Implementation Guidance</h3>
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
              <div className="w-1.5 h-12 rounded-full bg-emerald-500 shrink-0"></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">HIGH PRIORITY</h4>
                <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">High value impact with strong data readiness. Look for 'Quick Win' tags for immediate ROI or 'Strategic Initiative' for long-term transformation.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
              <div className="w-1.5 h-12 rounded-full bg-finivis-blue shrink-0"></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">GOOD CANDIDATE</h4>
                <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">Solid efficiency plays that need some refinement. Good for building momentum and reducing standard manual overhead.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
              <div className="w-1.5 h-12 rounded-full bg-amber-500 shrink-0"></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">EXPERIMENTAL</h4>
                <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">Lower ROI or higher complexity relative to value. Worth exploring once foundational processes are in place.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
              <div className="w-1.5 h-12 rounded-full bg-red-500 shrink-0"></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">NOT RECOMMENDED</h4>
                <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">Low data readiness, high risk, or negligible value. Focus on data architecture or process redesign first.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Overlay */}
      {activeOpp && (
        <OpportunityDetailView
          evaluatedOpp={activeOpp}
          clientName={processName?.split(' - ')[0] || 'Client'}
          onClose={() => setSelectedOppIndex(null)}
          onSaveRoadmap={(data, updatedOpp) => onUpdateOpportunity(selectedOppIndex, data, updatedOpp)}
        />
      )}
    </div>
  );
}
