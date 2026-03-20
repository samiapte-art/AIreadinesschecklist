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
import pptxgen from 'pptxgenjs';

// Custom plugin to draw quadrant labels in the background
const quadrantLabelsPlugin = {
  id: 'quadrantLabels',
  beforeDraw(chart) {
    const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    ctx.save();
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)'; // Faint gray

    // Quadrant 1 (Top Right): Strategic / Quick Wins
    ctx.fillText('STRATEGIC QUICK WINS', left + width * 0.75, top + height * 0.25);
    
    // Quadrant 2 (Top Left): High Value / Implementation Challenge
    ctx.fillText('EXPERIMENTAL / HIGH VALUE', left + width * 0.25, top + height * 0.25);

    // Quadrant 3 (Bottom Left): Not Recommended
    ctx.fillText('LONG-TERM / LOW PRIORITY', left + width * 0.25, top + height * 0.75);

    // Quadrant 4 (Bottom Right): Feasible / Lower Value
    ctx.fillText('OPERATIONAL EFFICIENCY', left + width * 0.75, top + height * 0.75);

    // Draw center lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX, top);
    ctx.lineTo(centerX, bottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(left, centerY);
    ctx.lineTo(right, centerY);
    ctx.stroke();
    ctx.restore();
  }
};

ChartJS.register(LinearScale, PointElement, BubbleController, Tooltip, Legend, ChartDataLabels, quadrantLabelsPlugin);

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
  const chartRef = React.useRef(null);

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

  // Bubble chart: X=feasibility, Y=value, radius=dataReadiness, color=risk
  const chartData = {
    datasets: [
      {
        label: 'Opportunities',
        data: results.map(r => ({
          x: r.scores.feasibility,
          y: r.scores.value,
          r: Math.max(6, (r.scores.data || 0) / 4), // Improved bubble scaling
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
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 40,
        right: 40,
        bottom: 20,
        left: 20
      }
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.03)',
          drawBorder: false,
          borderDash: [5, 5]
        },
        title: { 
          display: true, 
          text: 'IMPLEMENTATION FEASIBILITY (%)',
          color: '#94A3B8',
          font: { size: 10, weight: 'bold', family: 'Inter' }
        },
        ticks: { color: '#94A3B8', font: { size: 10 } }
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.03)',
          drawBorder: false,
          borderDash: [5, 5]
        },
        title: { 
          display: true, 
          text: 'BUSINESS IMPACT / VALUE (%)',
          color: '#94A3B8',
          font: { size: 10, weight: 'bold', family: 'Inter' }
        },
        ticks: { color: '#94A3B8', font: { size: 10 } }
      }
    },
    plugins: {
      legend: {
        display: false // Use custom legend or none for cleaner look
      },
      datalabels: {
        anchor: 'end', // Shift anchor to edges of bubbles
        align: 'top',
        offset: 12, // Increased offset for better separation
        display: 'auto', 
        clamp: true,
        formatter: (value, context) => {
          const item = context.dataset.data[context.dataIndex];
          // Only show labels for bubbles with some score or significant size
          return item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name;
        },
        font: {
          family: 'Inter',
          weight: '800',
          size: 10
        },
        color: '#1E293B',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 4,
        padding: 4,
        textAlign: 'center'
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13, weight: 'bold', family: 'Inter' },
        bodyFont: { size: 11, family: 'Inter' },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: (ctx) => {
            const d = ctx.raw;
            return [
              `Value: ${d.y}%`,
              `Feasibility: ${d.x}%`,
              `Data Readiness: ${d.dataScore}%`,
              `Risk: ${d.risk}%`,
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

  const exportPPT = () => {
    const pptx = new pptxgen();
    
    // Set presentation properties
    pptx.layout = 'LAYOUT_WIDE';
    pptx.defineSlideMaster({
      title: 'MASTER_SLIDE',
      background: { color: 'FFFFFF' },
      objects: [
        // Logo at Top-Right
        { image: { x: 11.4, y: 0.2, w: 1.5, h: 0.5, path: '/logo.png' } },
        // Footer: Center
        { text: { text: "Private & Confidential", options: { x: 0, y: 7.1, w: '100%', align: 'center', fontSize: 10, color: '94A3B8', fontFace: 'Arial' } } },
        // Footer: Page Number (Handled by pptxgen logic or manual)
        { text: { text: "Page ", options: { x: 12.2, y: 7.1, w: 0.6, align: 'right', fontSize: 10, color: '94A3B8' } } }
      ]
    });

    // 1. Title Slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText("AI OPPORTUNITY ASSESSMENT", {
      x: 0, y: '35%', w: '100%', align: 'center',
      fontSize: 48, fontFace: 'Arial', color: '1E293B', bold: true
    });
    titleSlide.addText(clientName || "Executive Strategy Report", {
      x: 0, y: '50%', w: '100%', align: 'center',
      fontSize: 24, fontFace: 'Arial', color: '64748B'
    });
    titleSlide.addText(new Date().toLocaleDateString('en-GB'), {
      x: 0, y: '62%', w: '100%', align: 'center',
      fontSize: 14, fontFace: 'Arial', color: '94A3B8'
    });
    // Add "Private & Confidential" to title slide too
    titleSlide.addText("Private & Confidential", {
      x: 0, y: '92%', w: '100%', align: 'center', fontSize: 10, color: '94A3B8'
    });


    // 2. Evaluation Table Slide
    const tableSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    tableSlide.addText("EVALUATION DASHBOARD", {
      x: 0.4, y: 0.3, w: '90%', fontSize: 32, fontFace: 'Arial', color: '1E293B', bold: false
    });
    // Add slide number to master or manually
    tableSlide.addText("2", { x: 12.8, y: 7.1, fontSize: 10, color: '94A3B8' });

    const rows = [
      [
        { text: 'Opportunity Name', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
        { text: 'Data %', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
        { text: 'Value %', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
        { text: 'Feas. %', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
        { text: 'Score %', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
        { text: 'Priority', options: { fill: '1E293B', color: 'FFFFFF', bold: true } }
      ]
    ];
    results.forEach(r => {
      rows.push([
        r.opportunityName,
        r.scores.data + '%',
        r.scores.value + '%',
        r.scores.feasibility + '%',
        r.scores.overall + '%',
        r.priority
      ]);
    });

    tableSlide.addTable(rows, {
      x: 0.4, y: 1.2, w: 12.5,
      border: { pt: 1, color: 'E2E8F0' },
      fill: { color: 'FFFFFF' },
      fontSize: 10,
      fontFace: 'Arial',
      autoPage: true,
      colW: [5.5, 1.2, 1.2, 1.2, 1.2, 2.2],
      headerRow: true
    });

    // 3. AI Opportunity Quadrant Slide
    const chartSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    chartSlide.addText("AI OPPORTUNITY QUADRANT", {
      x: 0.4, y: 0.3, w: '90%', fontSize: 32, fontFace: 'Arial', color: '1E293B', bold: false
    });
    chartSlide.addText("3", { x: 12.8, y: 7.1, fontSize: 10, color: '94A3B8' });

    if (chartRef.current) {
      const chartBase64 = chartRef.current.toBase64Image();
      chartSlide.addImage({
        data: chartBase64,
        x: 1, y: 1.2, w: 11, h: 5.5
      });
    } else {
      chartSlide.addText("Chart visual not available for export.", {
        x: 1, y: 3, w: 11, align: 'center', color: '94A3B8'
      });
    }


    // 4. Individual Opportunity Deep-Dive Slides
    const approvedOpps = results.filter(r => r.decision?.verdict === 'Approved');
    let slideCounter = 4;
    
    approvedOpps.forEach((opp) => {
      const roadmap = opp.persisted_roadmap || {};
      const oppName = (opp.opportunityName || opp.name).toUpperCase();

      // --- SLIDE A: CRITICAL CHALLENGE MATRIX ---
      const matrixSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      matrixSlide.addText(oppName, {
        x: 0.4, y: 0.2, w: '90%', fontSize: 32, fontFace: 'Arial', color: '1E293B', bold: false
      });
      matrixSlide.addText("Critical Challenge Matrix", {
        x: 0.4, y: 0.7, w: '90%', fontSize: 14, fontFace: 'Arial', color: '64748B', italic: true
      });
      matrixSlide.addText(String(slideCounter++), { x: 12.8, y: 7.1, fontSize: 10, color: '94A3B8' });

      const challenges = opp.challenges || {};
      const matrixRows = [
        [
          { text: "DATA CHALLENGES", options: { fill: 'F8FAFC', color: '475569', bold: true, align: 'center' } },
          { text: "PROCESS CHALLENGES", options: { fill: 'F8FAFC', color: '475569', bold: true, align: 'center' } }
        ],
        [
          { text: (challenges.data || []).join('\n') || 'No critical data challenges identified', options: { fontSize: 11, valign: 'top', color: '475569' } },
          { text: (challenges.process || []).join('\n') || 'No critical process challenges identified', options: { fontSize: 11, valign: 'top', color: '475569' } }
        ],
        [
          { text: "VALUE REALIZATION", options: { fill: 'F8FAFC', color: '1E293B', bold: true, align: 'center' } },
          { text: "FEASIBILITY & TECH", options: { fill: 'F8FAFC', color: '475569', bold: true, align: 'center' } }
        ],
        [
          { text: (challenges.value || []).join('\n') || 'No critical value challenges identified', options: { fontSize: 11, valign: 'top', color: '475569' } },
          { text: (challenges.feasibility || []).join('\n') || 'No technical feasibility constraints noted', options: { fontSize: 11, valign: 'top', color: '475569' } }
        ]
      ];

      matrixSlide.addTable(matrixRows, {
        x: 0.4, y: 1.3, w: 12.5, h: 5.2,
        border: { pt: 0.5, color: 'CBD5E1' },
        colW: [6.25, 6.25],
        valign: 'middle'
      });

      // --- SLIDE B: STEP-BY-STEP READINESS SCHEDULE ---
      const scheduleSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      scheduleSlide.addText(oppName, {
        x: 0.4, y: 0.2, w: '90%', fontSize: 32, fontFace: 'Arial', color: '1E293B', bold: false
      });
      scheduleSlide.addText("Step-By-Step Readiness Schedule", {
        x: 0.4, y: 0.7, w: '90%', fontSize: 14, fontFace: 'Arial', color: '64748B', italic: true
      });
      scheduleSlide.addText(String(slideCounter++), { x: 12.8, y: 7.1, fontSize: 10, color: '94A3B8' });

      const tasks = roadmap.preAutomationTasks || [];
      const scheduleRows = [
        [
          { text: 'Readiness Activity', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
          { text: 'Owner', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
          { text: 'Importance', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
          { text: 'Outcome Required', options: { fill: '1E293B', color: 'FFFFFF', bold: true } }
        ]
      ];

      tasks.forEach(t => {
        scheduleRows.push([
          { text: t.task || t.item || '', options: { bold: true } },
          t.owner || 'Client Team',
          t.importance || t.priority || 'Standard',
          t.description || t.reason || ''
        ]);
      });

      if (scheduleRows.length > 1) {
        scheduleSlide.addTable(scheduleRows, {
          x: 0.4, y: 1.3, w: 12.5,
          border: { pt: 0.5, color: 'CBD5E1' },
          fontSize: 10,
          autoPage: true,
          colW: [3.5, 2, 1.5, 5.5]
        });
      }

      const timelineTxt = roadmap.kickoffReadiness?.suggestedTimeline || opp.roiTimeline || "TBD";
      scheduleSlide.addText(`STRATEGIC TIMELINE: ${timelineTxt}`, {
        x: 0.4, y: 6.7, w: 12.5, fontSize: 12, fontFace: 'Arial', color: '1E293B', bold: true
      });

      // --- SLIDE C: DOCUMENTS REQUIRED FROM CLIENT ---
      const docsSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      docsSlide.addText(oppName, {
        x: 0.4, y: 0.2, w: '90%', fontSize: 32, fontFace: 'Arial', color: '1E293B', bold: false
      });
      docsSlide.addText("Documents Required From Client", {
        x: 0.4, y: 0.7, w: '90%', fontSize: 14, fontFace: 'Arial', color: '64748B', italic: true
      });
      docsSlide.addText(String(slideCounter++), { x: 12.8, y: 7.1, fontSize: 10, color: '94A3B8' });

      const docs = roadmap.documentChecklist || roadmap.documentRequirements || [];
      const docRows = [
        [
          { text: 'Asset / Document Name', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
          { text: 'Format', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
          { text: 'Strategic Importance / Logic', options: { fill: '1E293B', color: 'FFFFFF', bold: true } }
        ]
      ];

      docs.forEach(d => {
        docRows.push([
          { text: d.documentName || d.item || '', options: { bold: true } },
          d.format || 'Digital',
          d.reason || d.description || ''
        ]);
      });

      if (docRows.length > 1) {
        docsSlide.addTable(docRows, {
          x: 0.4, y: 1.3, w: 12.5,
          border: { pt: 0.5, color: 'CBD5E1' },
          fontSize: 10,
          autoPage: true,
          colW: [4, 1.5, 7]
        });
      }

      // --- SLIDE D: STAKEHOLDER CHECKLIST ---
      const stakeSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      stakeSlide.addText(oppName, {
        x: 0.4, y: 0.2, w: '90%', fontSize: 32, fontFace: 'Arial', color: '1E293B', bold: false
      });
      stakeSlide.addText("Stakeholder Checklist", {
        x: 0.4, y: 0.7, w: '90%', fontSize: 14, fontFace: 'Arial', color: '64748B', italic: true
      });
      stakeSlide.addText(String(slideCounter++), { x: 12.8, y: 7.1, fontSize: 10, color: '94A3B8' });

      const stakeholders = roadmap.stakeholderChecklist || [];
      const stakeRows = [
        [
          { text: 'Role / Designation', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
          { text: 'Involvement Stage', options: { fill: '1E293B', color: 'FFFFFF', bold: true } },
          { text: 'Purpose of Engagement', options: { fill: '1E293B', color: 'FFFFFF', bold: true } }
        ]
      ];

      stakeholders.forEach(s => {
        stakeRows.push([
          { text: s.role || '', options: { bold: true } },
          s.involvement || 'Ongoing',
          s.reason || ''
        ]);
      });

      if (stakeRows.length > 1) {
        stakeSlide.addTable(stakeRows, {
          x: 0.4, y: 1.3, w: 12.5,
          border: { pt: 0.5, color: 'CBD5E1' },
          fontSize: 10,
          autoPage: true,
          colW: [3.5, 2.5, 6.5]
        });
      }
    });

    pptx.writeFile({ fileName: `Finivis_AI_Strategy_${clientName || 'Export'}_${Date.now()}.pptx` });
  };

  const isAI = scoringMode === 'ai';

  if (selectedOppIndex !== null) {
    return (
      <OpportunityDetailView
        evaluatedOpp={results[selectedOppIndex]}
        onClose={() => setSelectedOppIndex(null)}
        onSaveRoadmap={(data, updatedOpp) => onUpdateOpportunity(results[selectedOppIndex].originalIndex, data, updatedOpp)}
        clientName={clientName}
      />
    );
  }

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
              <button 
                onClick={exportPPT} 
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-orange-600 hover:bg-white rounded-lg transition-all text-[11px] font-bold"
                title="Export as PowerPoint"
              >
                <Layout size={14} /> PPT
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
          <div className="h-[450px]">
            <Bubble ref={chartRef} data={chartData} options={chartOptions} />
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

      {/* Detail View removed from here as it is now at the top-level return */}
    </div>
  );
}
