import React from 'react';
import { evaluateOpportunity } from '../utils/EvaluationEngine';
import { Download, FileText, FileSpreadsheet, Paperclip } from 'lucide-react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as xlsx from 'xlsx';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

export default function Dashboard({ opportunities, processName }) {
  
  // Calculate specific scores
  const results = opportunities.map(opp => ({
    ...opp,
    ...evaluateOpportunity(opp)
  }));

  const chartData = {
    datasets: [
      {
        label: 'Opportunities',
        data: results.map(r => ({
          x: r.feasibilityScore,
          y: r.valueScore,
          name: r.name,
          category: r.category
        })),
        backgroundColor: results.map(r => {
          if (r.category === 'Quick Win') return '#10b981'; // Green
          if (r.category === 'Strategic Initiative') return '#3b82f6'; // Blue
          if (r.category === 'Efficiency Play') return '#f59e0b'; // Yellow
          if (r.category === 'Long-Term Bet') return '#ef4444'; // Red
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
        min: 0, max: 6,
        title: { display: true, text: 'Feasibility Score (Ease of Implementation)' },
      },
      y: {
        min: 0, max: 6,
        title: { display: true, text: 'Business Value Score' }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const dataPoint = ctx.raw;
            return `${dataPoint.name} (${dataPoint.category})`;
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
      r.name || 'Unnamed',
      r.valueScore,
      r.dataScore,
      r.feasibilityScore,
      r.finalScore,
      r.category
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['#', 'Name', 'Value', 'Data', 'Feasibility', 'Final Score', 'Category']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [26, 86, 204] }, // Finivis Blue
    });
    
    doc.save(`Finivis_AI_Opportunities_${Date.now()}.pdf`);
  };

  const exportExcel = () => {
    const sheetData = results.map(r => ({
      "Name": r.name,
      "Description": r.description,
      "Pain Points": r.painPoints?.join(', '),
      "Maturity": r.maturity,
      "Data Availability": r.dataAvailability,
      "Frequency": r.frequency,
      "Business Value Labels": r.businessValue?.join(', '),
      "Future State": r.futureState,
      "KPI": r.kpi,
      "Systems": r.systems,
      "Value Score": r.valueScore,
      "Data Score": r.dataScore,
      "Feasibility Score": r.feasibilityScore,
      "Final AI Score": r.finalScore,
      "Priority Category": r.category
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
                <th className="p-3 font-semibold">Value (1-5)</th>
                <th className="p-3 font-semibold">Data (1-5)</th>
                <th className="p-3 font-semibold">Feasibility (1-5)</th>
                <th className="p-3 font-semibold">AI Score</th>
                <th className="p-3 font-semibold rounded-tr-lg">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((r, i) => (
                <React.Fragment key={i}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-finivis-dark">
                      <div className="flex items-center gap-2">
                        {r.name || 'Unnamed Opportunity'}
                        {(r.documents || []).length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            <Paperclip size={10} />{(r.documents || []).length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md">{r.valueScore}</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md">{r.dataScore}</span></td>
                    <td className="p-3"><span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md">{r.feasibilityScore}</span></td>
                    <td className="p-3 font-bold">{r.finalScore}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        r.category === 'Quick Win' ? 'bg-green-100 text-green-800' :
                        r.category === 'Strategic Initiative' ? 'bg-blue-100 text-blue-800' :
                        r.category === 'Efficiency Play' ? 'bg-yellow-100 text-yellow-800' :
                        r.category === 'Long-Term Bet' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {r.category}
                      </span>
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
                <h4 className="font-bold text-gray-900">Quick Wins</h4>
                <p className="text-[14px] text-gray-500 mt-1 leading-relaxed">High value, high feasibility, good data. Prioritize these for immediate ROI.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
              <div className="w-1.5 h-12 rounded-full bg-finivis-blue shrink-0"></div>
              <div>
                <h4 className="font-bold text-gray-900">Strategic Initiatives</h4>
                <p className="text-[14px] text-gray-500 mt-1 leading-relaxed">High value but complex to implement. Require careful planning and phased delivery.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
              <div className="w-1.5 h-12 rounded-full bg-amber-500 shrink-0"></div>
              <div>
                <h4 className="font-bold text-gray-900">Efficiency Plays</h4>
                <p className="text-[14px] text-gray-500 mt-1 leading-relaxed">Medium value, relatively easy. Good for building momentum and reducing simple manual work.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-start gap-4">
              <div className="w-1.5 h-12 rounded-full bg-red-500 shrink-0"></div>
              <div>
                <h4 className="font-bold text-gray-900">Long-Term Bets</h4>
                <p className="text-[14px] text-gray-500 mt-1 leading-relaxed">Low data readiness or extremely complex. Need data architecture or process standardization first.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
