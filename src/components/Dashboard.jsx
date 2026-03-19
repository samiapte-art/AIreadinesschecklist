import React, { useState, useMemo } from 'react';
import { evaluateOpportunity } from '../utils/EvaluationEngine';
import OpportunityDetailView from './OpportunityDetailView';
import { Download, FileText, FileSpreadsheet, Paperclip, ChevronRight } from 'lucide-react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as xlsx from 'xlsx';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, ChartDataLabels);

export default function Dashboard({ opportunities, processName, onUpdateOpportunity }) {
  const [selectedOppIndex, setSelectedOppIndex] = useState(null);
  
  const results = useMemo(() => opportunities.map((opp, idx) => ({
    ...opp,
    ...evaluateOpportunity(opp),
    originalIndex: idx
  })), [opportunities]);

  // Derive the active opportunity from results to ensure it stays in sync with parent updates
  const activeOpp = useMemo(() => 
    selectedOppIndex !== null ? results[selectedOppIndex] : null, 
  [results, selectedOppIndex]);

  const chartData = {
    datasets: [
      {
        label: 'Opportunities',
        data: results.map(r => ({
          x: r.scores.feasibility,
          y: r.scores.value,
          name: r.opportunityName,
          priority: r.priority
        })),
        backgroundColor: results.map(r => {
          if (r.priority === 'HIGH') return '#10b981'; // Green
          if (r.priority === 'MEDIUM') return '#3b82f6'; // Blue
          if (r.priority === 'LOW') return '#f59e0b'; // Yellow
          if (r.priority === 'NOT RECOMMENDED') return '#ef4444'; // Red
          return '#6b7280'; // Gray
        }),
        pointRadius: 8,
        pointHoverRadius: 10,
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
        color: '#4B5563', // gray-600
        offset: 4
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const dataPoint = ctx.raw;
            return `${dataPoint.name} [Priority: ${dataPoint.priority}]`;
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
    
    // Summary Table
    const tableData = results.map((r, i) => [
      i + 1,
      r.opportunityName,
      r.scores.value,
      r.scores.data,
      r.scores.feasibility,
      r.scores.overall,
      r.priority
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['#', 'Name', 'Value %', 'Data %', 'Feasibility %', 'Overall %', 'Priority']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [26, 86, 204] }, // Finivis Blue
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
      "Risk Score": r.scores.risk,
      "Overall Score %": r.scores.overall,
      "Priority": r.priority,
      "Implementation Effort": r.effort,
      "Automation Type": r.automationType
    }));
    
    const ws = xlsx.utils.json_to_sheet(sheetData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Opportunities");
    xlsx.writeFile(wb, `Finivis_AI_Opportunities_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-fade-in fade-in-up">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-apple border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-finivis-dark">Evaluation Dashboard</h2>
          <div className="flex gap-3">
            <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-finivis-blue text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <FileText size={16} /> Export PDF
            </button>
            <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 border border-finivis-blue text-finivis-blue rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
              <FileSpreadsheet size={16} /> Export Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-finivis-light/50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="p-3 font-semibold rounded-tl-lg">Opportunity Name</th>
                <th className="p-3 font-semibold">Value %</th>
                <th className="p-3 font-semibold">Data %</th>
                <th className="p-3 font-semibold">Feasibility %</th>
                <th className="p-3 font-semibold">Overall %</th>
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
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">{r.scores.value}</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md font-medium">{r.scores.data}</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md font-medium">{r.scores.feasibility}</span></td>
                    <td className="p-3 font-bold text-lg text-finivis-dark">{r.scores.overall}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                        r.priority === 'HIGH' ? 'bg-green-50 text-green-700 border-green-100' :
                        r.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        r.priority === 'LOW' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                       <button 
                         onClick={() => setSelectedOppIndex(r.originalIndex)}
                         className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-finivis-blue/5 text-finivis-blue hover:bg-finivis-blue hover:text-white rounded-lg transition-all text-xs font-bold"
                       >
                         View Blueprint <ChevronRight size={14} />
                       </button>
                    </td>
                  </tr>
                  {/* Documents sub-row */}
                  {(r.documents || []).length > 0 && (
                    <tr className="bg-[#fafbfc]">
                      <td colSpan={6} className="px-4 py-3">
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

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-apple border border-gray-100">
          <h3 className="text-xl font-bold text-finivis-dark mb-2">Priority Quadrant</h3>
          <p className="text-sm text-gray-500 mb-4">Top Right = Highest Value and Easiest to Implement.</p>
          <div className="aspect-square">
            <Scatter data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-apple border border-gray-100">
          <h3 className="text-xl font-bold text-finivis-dark mb-6">Implementation Guidance</h3>
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
              <div className="w-1.5 h-12 rounded-full bg-emerald-500 shrink-0"></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">HIGH PRIORITY</h4>
                <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">High value impact. Look for 'Quick Win' tags for immediate ROI or 'Strategic Initiative' for long-term transformation.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
              <div className="w-1.5 h-12 rounded-full bg-finivis-blue shrink-0"></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">MEDIUM PRIORITY</h4>
                <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">Solid efficiency plays. Good for building momentum and reducing standard manual overhead.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
              <div className="w-1.5 h-12 rounded-full bg-amber-500 shrink-0"></div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">LOW PRIORITY</h4>
                <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">Lower ROI or higher complexity relative to value. Evaluate further or wait for process optimization.</p>
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
          onSaveRoadmap={(data) => onUpdateOpportunity(selectedOppIndex, data)}
        />
      )}
    </div>
  );
}
