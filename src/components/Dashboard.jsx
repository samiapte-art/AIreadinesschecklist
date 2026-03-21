import React, { useState, useEffect, useMemo, useRef } from 'react';
import { evaluateOpportunity, generateTags } from '../utils/EvaluationEngine';
import { getPriorityLabel } from '../utils/ScoringEngine';
import OpportunityDetailView from './OpportunityDetailView';
import { Download, FileText, FileSpreadsheet, Paperclip, ChevronRight, Brain, Calculator, Layout, Sparkles, Loader2, AlertTriangle, AlertCircle, Pencil } from 'lucide-react';
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

// Inline editable score cell for the Evaluation Dashboard table
function EditableScoreCell({ value, field, originalIndex, colorClasses, onScoreChange, editable }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const parsed = Math.round(Number(draft));
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      setDraft(value);
      setEditing(false);
      return;
    }
    if (parsed !== value) {
      onScoreChange(originalIndex, field, parsed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <td className="p-3">
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={100}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(value); setEditing(false); }
          }}
          onBlur={commit}
          className={`w-16 px-2 py-1 rounded-md font-medium text-center border-2 border-finivis-blue outline-none ${colorClasses}`}
        />
      </td>
    );
  }

  return (
    <td className="p-3">
      <span
        onClick={editable ? () => { setDraft(value); setEditing(true); } : undefined}
        className={`px-2 py-1 rounded-md font-medium ${colorClasses} ${editable ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-finivis-blue/40 transition-all' : ''}`}
        title={editable ? 'Click to edit' : undefined}
      >
        {value}
      </span>
    </td>
  );
}

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
  onUpdateScore,
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
  const [scoreOverrides, setScoreOverrides] = useState({});

  // Clear overrides when the source-of-truth (aiEvaluations) changes
  useEffect(() => {
    setScoreOverrides({});
  }, [aiEvaluations]);

  const isEditable = true;

  const handleScoreChange = (originalIndex, field, newValue) => {
    setScoreOverrides(prev => ({
      ...prev,
      [originalIndex]: { ...(prev[originalIndex] || {}), [field]: newValue }
    }));
    if (onUpdateScore) {
      onUpdateScore(originalIndex, field, newValue).then(success => {
        if (!success) {
          // Rollback on failure
          setScoreOverrides(prev => {
            const copy = { ...prev };
            if (copy[originalIndex]) {
              delete copy[originalIndex][field];
              if (Object.keys(copy[originalIndex]).length === 0) delete copy[originalIndex];
            }
            return copy;
          });
        }
      });
    }
  };

  const results = useMemo(() => {
    let base;
    if (scoringMode === 'ai' && aiEvaluations?.length) {
      base = aiEvaluations.map((evalOpp, idx) => ({
        ...evalOpp,
        persisted_roadmap: opportunities[idx]?.persisted_roadmap,
        originalIndex: idx
      }));
    } else {
      base = opportunities.map((opp, idx) => ({
        ...opp,
        ...evaluateOpportunity(opp),
        originalIndex: idx
      }));
    }

    // Apply persisted score_overrides from opportunities_json, then local scoreOverrides on top
    return base.map(r => {
      const persisted = opportunities[r.originalIndex]?.score_overrides;
      const local = scoreOverrides[r.originalIndex];
      const merged = { ...persisted, ...local };
      if (!merged || Object.keys(merged).length === 0) return r;

      const newScores = { ...r.scores, ...merged };
      newScores.overall = Math.round(
        (newScores.value * 0.30) + (newScores.data * 0.25) +
        (newScores.feasibility * 0.25) + (newScores.risk * 0.20)
      );
      const newPriority = getPriorityLabel(newScores.overall);
      const newTags = generateTags(newScores, newPriority, r.complexity || 'MEDIUM');
      return { ...r, scores: newScores, priority: newPriority, tags: newTags };
    });
  }, [opportunities, aiEvaluations, scoringMode, scoreOverrides]);

  // Bubble chart: X=feasibility, Y=value, radius=dataReadiness, color=risk
  const chartData = {
    datasets: [
      {
        label: 'Opportunities',
        data: results.map(r => ({
          x: r.scores.feasibility,
          y: r.scores.value,
          r: Math.max(6, Math.min(18, (r.scores.data || 0) / 5)), // Capped bubble scaling (6-18px)
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

  // Collision-aware label placement: assigns each bubble a unique direction to minimize overlap
  const labelPlacements = useMemo(() => {
    if (!results.length) return [];

    const allData = results.map(r => ({
      x: r.scores.feasibility,
      y: r.scores.value,
    }));

    const directions = [
      { align: 'right',  anchor: 'end',   dx: 1,  dy: 0  },
      { align: 'left',   anchor: 'start', dx: -1, dy: 0  },
      { align: 'bottom', anchor: 'start', dx: 0,  dy: -1 },
      { align: 'top',    anchor: 'end',   dx: 0,  dy: 1  },
    ];

    // For each bubble, rank all directions by viability
    const placements = allData.map((item, idx) => {
      // Filter out directions that would push label off-chart edge
      const viable = directions.filter(d => {
        if (d.align === 'right'  && item.x > 80) return false;
        if (d.align === 'left'   && item.x < 15) return false;
        if (d.align === 'top'    && item.y > 92) return false;
        if (d.align === 'bottom' && item.y < 8)  return false;
        return true;
      });
      const candidates = viable.length > 0 ? viable : directions;

      // Score each direction: higher = more space from neighbors AHEAD in that direction
      const scored = candidates.map(dir => {
        let minDist = Infinity;
        for (let i = 0; i < allData.length; i++) {
          if (i === idx) continue;
          const other = allData[i];
          const perp = Math.abs((other.x - item.x) * dir.dy - (other.y - item.y) * dir.dx);
          // Only consider neighbors within a perpendicular band (could overlap the label)
          if (perp < 25) {
            // Signed distance: positive means neighbor is AHEAD in label direction
            const signedDist = (other.x - item.x) * dir.dx + (other.y - item.y) * dir.dy;
            if (signedDist > 0) {
              minDist = Math.min(minDist, signedDist);
            }
          }
        }
        return { ...dir, score: minDist };
      });

      // Sort by score descending — best direction first
      scored.sort((a, b) => b.score - a.score);
      return scored;
    });

    // Greedy assignment: iterate through bubbles, assign best available direction
    // avoiding the same direction for bubbles within 25 units of each other
    const assigned = new Array(allData.length).fill(null);
    const usedDirs = []; // [{ idx, align, x, y }]

    // Process bubbles with most constrained positions first (near edges)
    const order = allData.map((_, i) => i).sort((a, b) => {
      const edgeA = Math.min(allData[a].x, 100 - allData[a].x, allData[a].y, 100 - allData[a].y);
      const edgeB = Math.min(allData[b].x, 100 - allData[b].x, allData[b].y, 100 - allData[b].y);
      return edgeA - edgeB; // most constrained first
    });

    for (const idx of order) {
      const item = allData[idx];
      const candidates = placements[idx];
      let picked = candidates[0]; // fallback

      for (const cand of candidates) {
        // Check if a nearby bubble already uses this direction
        const conflict = usedDirs.some(u => {
          if (u.align !== cand.align) return false;
          const dist = Math.sqrt((u.x - item.x) ** 2 + (u.y - item.y) ** 2);
          return dist < 25;
        });
        if (!conflict) {
          picked = cand;
          break;
        }
      }
      assigned[idx] = picked;
      usedDirs.push({ idx, align: picked.align, x: item.x, y: item.y });
    }

    return assigned;
  }, [results]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.6,
    clip: false,
    layout: {
      padding: {
        top: 30,
        right: 30,
        bottom: 10,
        left: 20
      }
    },
    scales: {
      x: {
        min: -5,
        max: 105,
        grid: {
          color: 'rgba(0, 0, 0, 0.03)',
          drawBorder: false,
          borderDash: [5, 5]
        },
        title: {
          display: true,
          text: 'IMPLEMENTATION FEASIBILITY (%)',
          color: '#94A3B8',
          font: { size: 10, weight: 'bold', family: 'Inter' },
          padding: { top: 8 }
        },
        ticks: {
          color: '#94A3B8',
          font: { size: 10 },
          stepSize: 20,
          callback: (val) => val >= 0 && val <= 100 ? val : ''
        }
      },
      y: {
        min: -5,
        max: 105,
        grid: {
          color: 'rgba(0, 0, 0, 0.03)',
          drawBorder: false,
          borderDash: [5, 5]
        },
        title: {
          display: true,
          text: 'BUSINESS IMPACT / VALUE (%)',
          color: '#94A3B8',
          font: { size: 10, weight: 'bold', family: 'Inter' },
          padding: { bottom: 8 }
        },
        ticks: {
          color: '#94A3B8',
          font: { size: 10 },
          stepSize: 20,
          callback: (val) => val >= 0 && val <= 100 ? val : ''
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        anchor: (context) => {
          const placement = labelPlacements[context.dataIndex];
          return placement ? placement.anchor : 'end';
        },
        align: (context) => {
          const placement = labelPlacements[context.dataIndex];
          return placement ? placement.align : 'right';
        },
        offset: 8,
        display: true,
        clamp: true,
        formatter: (value, context) => {
          const item = context.dataset.data[context.dataIndex];
          const name = item.name || '';
          return name.length > 30 ? name.substring(0, 28) + '…' : name;
        },
        font: { family: 'Inter', weight: '700', size: 10 },
        color: '#1E293B',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 4,
        padding: { top: 3, bottom: 3, left: 6, right: 6 },
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

    // Color palette
    const NAVY = '1E293B';
    const DARK_BG = '0F172A';
    const SLATE = '64748B';
    const LIGHT_SLATE = '94A3B8';
    const ACCENT_BLUE = '3B82F6';
    const WHITE = 'FFFFFF';
    const OFF_WHITE = 'F8FAFC';
    const BORDER = 'E2E8F0';
    const ALT_ROW = 'F1F5F9';
    const GREEN = '16A34A';
    const AMBER = 'D97706';
    const RED = 'DC2626';

    // Helper: get priority color
    const getPriorityColor = (priority) => {
      const p = (priority || '').toUpperCase();
      if (p === 'HIGH' || p === 'CRITICAL') return GREEN;
      if (p === 'MEDIUM') return AMBER;
      return RED;
    };

    // Helper: get score color
    const getScoreColor = (score) => {
      const s = parseInt(score);
      if (s >= 70) return GREEN;
      if (s >= 50) return AMBER;
      return RED;
    };

    // Helper: format date professionally
    const formatDate = () => {
      const d = new Date();
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Set presentation properties
    pptx.layout = 'LAYOUT_WIDE';
    pptx.defineSlideMaster({
      title: 'MASTER_SLIDE',
      background: { color: WHITE },
      objects: [
        { image: { x: 11.5, y: 0.2, w: 1.2, h: 0.8, path: '/logo.png', sizing: { type: 'contain' } } },
        { text: { text: "Private & Confidential", options: { x: 0, y: 7.1, w: '100%', align: 'center', fontSize: 10, color: LIGHT_SLATE, fontFace: 'Arial' } } },
      ]
    });
    pptx.defineSlideMaster({
      title: 'DARK_SLIDE',
      background: { color: DARK_BG },
      objects: [
        { image: { x: 11.5, y: 0.2, w: 1.2, h: 0.8, path: '/logo.png', sizing: { type: 'contain' } } },
      ]
    });

    let slideCounter = 1;
    const addPageNum = (slide) => {
      slide.addText(`${slideCounter}`, { x: 12.2, y: 7.1, w: 1.0, align: 'right', fontSize: 10, color: LIGHT_SLATE, fontFace: 'Arial' });
      slideCounter++;
    };

    // ========================================
    // SLIDE 1: TITLE (Dark Background)
    // ========================================
    const titleSlide = pptx.addSlide({ masterName: 'DARK_SLIDE' });
    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: 3.1, w: 2.5, h: 0.05, fill: { color: ACCENT_BLUE }
    });
    titleSlide.addText("AI Opportunity\nAssessment", {
      x: 0.8, y: 1.5, w: 8, fontSize: 48, fontFace: 'Arial', color: WHITE, bold: true, lineSpacingMultiple: 1.1
    });
    titleSlide.addText(`Prepared for ${clientName || 'Client'}`, {
      x: 0.8, y: 3.4, w: 8, fontSize: 22, fontFace: 'Arial', color: ACCENT_BLUE
    });
    titleSlide.addText(formatDate(), {
      x: 0.8, y: 4.2, w: 8, fontSize: 14, fontFace: 'Arial', color: LIGHT_SLATE
    });
    titleSlide.addText("Prepared by Finivis  |  Prepare for Tomorrow", {
      x: 0.8, y: 6.5, w: 8, fontSize: 12, fontFace: 'Arial', color: SLATE, italic: true
    });
    titleSlide.addText("CONFIDENTIAL", {
      x: 0.8, y: 7.0, w: 4, fontSize: 9, fontFace: 'Arial', color: LIGHT_SLATE
    });
    addPageNum(titleSlide);

    // ========================================
    // SLIDE 2: EXECUTIVE SUMMARY
    // ========================================
    const execSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    execSlide.addText("EXECUTIVE SUMMARY", {
      x: 0.5, y: 0.6, w: '80%', fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
    });
    addPageNum(execSlide);

    const totalOpps = results.length;
    const approvedOpps = results.filter(r => r.decision?.verdict === 'Approved');
    const highPriority = results.filter(r => (r.priority || '').toUpperCase() === 'HIGH' || (r.priority || '').toUpperCase() === 'CRITICAL').length;
    const avgScore = totalOpps > 0 ? Math.round(results.reduce((s, r) => s + (r.scores?.overall || 0), 0) / totalOpps) : 0;

    // Stat boxes row
    const statBoxes = [
      { label: 'Opportunities Evaluated', value: `${totalOpps}`, color: ACCENT_BLUE, x: 0.5 },
      { label: 'Approved for Deep-Dive', value: `${approvedOpps.length}`, color: GREEN, x: 3.7 },
      { label: 'High Priority', value: `${highPriority}`, color: AMBER, x: 6.9 },
      { label: 'Avg. Readiness Score', value: `${avgScore}%`, color: NAVY, x: 10.1 }
    ];

    statBoxes.forEach(box => {
      execSlide.addShape(pptx.ShapeType.roundRect, {
        x: box.x, y: 1.5, w: 2.9, h: 1.3,
        fill: { color: OFF_WHITE },
        border: { type: 'solid', color: BORDER, pt: 0.5 },
        rectRadius: 0.08
      });
      // Metric Value (Centered in the upper portion)
      execSlide.addText(box.value, {
        x: box.x, y: 1.5, w: 2.9, h: 0.9, align: 'center', valign: 'middle',
        fontSize: 32, fontFace: 'Arial', color: box.color, bold: true
      });
      // Metric Label (Positioned in the lower portion)
      execSlide.addText(box.label, {
        x: box.x, y: 2.3, w: 2.9, h: 0.4, align: 'center', valign: 'top',
        fontSize: 9, fontFace: 'Arial', color: SLATE
      });
    });

    // Key findings as individual rows with left accent bars
    execSlide.addText("KEY FINDINGS", {
      x: 0.5, y: 3.15, w: 12, fontSize: 14, fontFace: 'Arial', color: NAVY, bold: true
    });

    const findings = [];
    if (approvedOpps.length > 0) {
      findings.push(`${approvedOpps.length} of ${totalOpps} opportunities have been approved for detailed analysis and readiness planning.`);
    }
    const topOpp = [...results].sort((a, b) => (b.scores?.overall || 0) - (a.scores?.overall || 0))[0];
    if (topOpp) {
      findings.push(`Highest-scoring opportunity: "${topOpp.opportunityName}" at ${topOpp.scores?.overall}% overall readiness.`);
    }
    if (avgScore < 60) {
      findings.push(`Average readiness score of ${avgScore}% indicates significant preparation work is needed before AI implementation.`);
    } else {
      findings.push(`Average readiness score of ${avgScore}% shows a solid foundation for AI adoption with targeted improvements.`);
    }
    findings.push('Each approved opportunity includes a detailed challenge matrix, readiness schedule, document checklist, and stakeholder map.');

    findings.forEach((f, idx) => {
      const fy = 3.6 + (idx * 0.55);
      execSlide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: fy, w: 0.06, h: 0.35, fill: { color: ACCENT_BLUE }
      });
      execSlide.addText(f, {
        x: 0.8, y: fy, w: 12.0, h: 0.4, fontSize: 11, fontFace: 'Arial', color: '475569', valign: 'middle'
      });
    });

    // Methodology note
    const methY = 3.6 + (findings.length * 0.55) + 0.3;
    execSlide.addShape(pptx.ShapeType.roundRect, {
      x: 0.5, y: methY, w: 12.3, h: 0.7,
      fill: { color: OFF_WHITE },
      border: { type: 'solid', color: BORDER, pt: 0.5 },
      rectRadius: 0.05
    });
    execSlide.addText("Methodology: Each opportunity was evaluated across three dimensions \u2014 Data Pipeline Readiness, Value Realization Potential, and Implementation Feasibility \u2014 using Finivis\u2019s proprietary DVF Assessment Framework.", {
      x: 0.7, y: methY + 0.05, w: 11.9, h: 0.6, fontSize: 10, fontFace: 'Arial', color: SLATE, italic: true, valign: 'middle', lineSpacingMultiple: 1.2
    });


    // ========================================
    // SLIDE 3: EVALUATION DASHBOARD (Color-Coded)
    // ========================================
    const tableSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    tableSlide.addText("EVALUATION DASHBOARD", {
      x: 0.5, y: 0.6, w: '80%', fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
    });
    tableSlide.addText(`${totalOpps} Identified Opportunities`, {
      x: 0.5, y: 1.1, w: '80%', fontSize: 13, fontFace: 'Arial', color: SLATE, italic: true
    });
    addPageNum(tableSlide);

    const rows = [
      [
        { text: 'Opportunity Name', options: { fill: NAVY, color: WHITE, bold: true } },
        { text: 'Data %', options: { fill: NAVY, color: WHITE, bold: true } },
        { text: 'Value %', options: { fill: NAVY, color: WHITE, bold: true } },
        { text: 'Feas. %', options: { fill: NAVY, color: WHITE, bold: true } },
        { text: 'Score %', options: { fill: NAVY, color: WHITE, bold: true } },
        { text: 'Priority', options: { fill: NAVY, color: WHITE, bold: true } }
      ]
    ];
    results.forEach((r, idx) => {
      const rowFill = idx % 2 === 0 ? WHITE : ALT_ROW;
      rows.push([
        { text: r.opportunityName, options: { bold: true, fill: rowFill } },
        { text: r.scores.data + '%', options: { fill: rowFill, color: getScoreColor(r.scores.data) } },
        { text: r.scores.value + '%', options: { fill: rowFill, color: getScoreColor(r.scores.value) } },
        { text: r.scores.feasibility + '%', options: { fill: rowFill, color: getScoreColor(r.scores.feasibility) } },
        { text: r.scores.overall + '%', options: { fill: rowFill, color: getScoreColor(r.scores.overall), bold: true } },
        { text: r.priority, options: { fill: rowFill, color: getPriorityColor(r.priority), bold: true } }
      ]);
    });

    tableSlide.addTable(rows, {
      x: 0.4, y: 1.6, w: 12.5,
      border: { pt: 0.5, color: BORDER },
      fontSize: 11,
      fontFace: 'Arial',
      autoPage: true,
      colW: [5.5, 1.2, 1.2, 1.2, 1.2, 2.2],
      headerRow: true
    });

    // Score legend
    tableSlide.addText("\u25CF 70%+  Strong    \u25CF 50\u201369%  Moderate    \u25CF <50%  Needs Work", {
      x: 0.5, y: 6.5, w: 12, fontSize: 9, fontFace: 'Arial', color: SLATE
    });


    // ========================================
    // SLIDE 4: AI OPPORTUNITY QUADRANT
    // ========================================
    const chartSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    chartSlide.addText("AI OPPORTUNITY QUADRANT", {
      x: 0.5, y: 0.6, w: '80%', fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
    });
    chartSlide.addText("Feasibility vs. Value Mapping", {
      x: 0.5, y: 1.1, w: '80%', fontSize: 13, fontFace: 'Arial', color: SLATE, italic: true
    });
    addPageNum(chartSlide);

    if (chartRef.current) {
      const chartBase64 = chartRef.current.toBase64Image();
      const canvas = chartRef.current.canvas;
      const aspectRatio = canvas.width / canvas.height;
      const maxW = 11.3;
      const maxH = 5.0;
      let imgW, imgH;
      if (maxW / maxH > aspectRatio) {
        imgH = maxH;
        imgW = imgH * aspectRatio;
      } else {
        imgW = maxW;
        imgH = imgW / aspectRatio;
      }
      const imgX = 1 + (maxW - imgW) / 2;
      const imgY = 1.6 + (maxH - imgH) / 2;
      chartSlide.addImage({
        data: chartBase64,
        x: imgX, y: imgY, w: imgW, h: imgH
      });
    } else {
      chartSlide.addText("Chart visual not available for export.", {
        x: 1, y: 3, w: 11, align: 'center', color: LIGHT_SLATE, fontFace: 'Arial'
      });
    }


    // ========================================
    // OPPORTUNITY DEEP-DIVE SLIDES
    // ========================================
    if (approvedOpps.length === 0) {
      const noOppSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      noOppSlide.addText("OPPORTUNITY DEEP-DIVE", {
        x: 0.5, y: 0.6, w: '80%', fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
      });
      noOppSlide.addText("All evaluated opportunities are currently in discovery phase. No approved opportunities are available for detailed analysis at this time.", {
        x: 1.5, y: 3, w: 10, align: 'center', fontSize: 14, fontFace: 'Arial', color: SLATE
      });
      addPageNum(noOppSlide);
    }

    approvedOpps.forEach((opp, oppIdx) => {
      const roadmap = opp.persisted_roadmap || {};
      const oppName = (opp.opportunityName || opp.name).toUpperCase();
      const oppScore = opp.scores?.overall || 0;

      // --- SECTION DIVIDER SLIDE (Dark) ---
      const dividerSlide = pptx.addSlide({ masterName: 'DARK_SLIDE' });
      dividerSlide.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: 3.55, w: 2.0, h: 0.04, fill: { color: ACCENT_BLUE }
      });
      dividerSlide.addText(`Opportunity ${oppIdx + 1} of ${approvedOpps.length}`, {
        x: 0.8, y: 2.2, w: 10, fontSize: 14, fontFace: 'Arial', color: ACCENT_BLUE
      });
      dividerSlide.addText(oppName, {
        x: 0.8, y: 2.7, w: 11, fontSize: 36, fontFace: 'Arial', color: WHITE, bold: true
      });
      dividerSlide.addText(`Overall Readiness Score: ${oppScore}%  |  Priority: ${opp.priority || 'N/A'}`, {
        x: 0.8, y: 3.8, w: 10, fontSize: 16, fontFace: 'Arial', color: LIGHT_SLATE
      });
      dividerSlide.addText("The following slides present the challenge analysis, readiness schedule,\ndocument requirements, and stakeholder mapping for this opportunity.", {
        x: 0.8, y: 4.6, w: 10, fontSize: 12, fontFace: 'Arial', color: SLATE, lineSpacingMultiple: 1.4
      });
      addPageNum(dividerSlide);

      // --- SLIDE A: CRITICAL CHALLENGE MATRIX ---
      const matrixSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      matrixSlide.addText("CRITICAL CHALLENGE MATRIX", {
        x: 0.5, y: 0.6, w: '80%', fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
      });
      matrixSlide.addText(oppName, {
        x: 0.5, y: 1.1, w: '80%', fontSize: 13, fontFace: 'Arial', color: SLATE, italic: true
      });
      addPageNum(matrixSlide);

      const challenges = opp.challenges || {};
      const cardIcons = ['\u26A0', '\u2191', '\u26A1']; // warning, arrow up, lightning
      const cardConfigs = [
        { title: "DATA PIPELINE", challenges: challenges.data, icon: cardIcons[0], x: 0.4, insight: roadmap.dataInsight || opp.ai_insight },
        { title: "VALUE REALIZATION", challenges: challenges.value, icon: cardIcons[1], x: 4.6, insight: roadmap.valueInsight },
        { title: "IMPLEMENTATION FEASIBILITY", challenges: (challenges.feasibility || []).concat(challenges.process || []), icon: cardIcons[2], x: 8.8, insight: roadmap.feasibilityInsight }
      ];

      // Calculate auto-height: estimate lines per card, use tallest
      const charsPerLine = 52;
      const lineH = 0.22;
      const headerH = 0.5;
      const insightH = 0.5;
      const cardPadding = 0.6;

      const cardContentLines = cardConfigs.map(conf => {
        const items = conf.challenges || [];
        if (items.length === 0) return 1;
        return items.reduce((total, c) => total + Math.ceil((`\u2022 ${c}`).length / charsPerLine), 0);
      });
      const maxLines = Math.max(...cardContentLines);
      const calcH = Math.min(Math.max(headerH + (maxLines * lineH) + insightH + cardPadding, 2.0), 5.0);

      const availTop = 1.6;
      const availBottom = 6.8;
      const cardY = availTop + ((availBottom - availTop) - calcH) / 2;

      cardConfigs.forEach(conf => {
        matrixSlide.addShape(pptx.ShapeType.roundRect, {
          x: conf.x, y: cardY, w: 4.1, h: calcH,
          fill: { color: OFF_WHITE },
          border: { type: 'solid', color: BORDER, pt: 0.5 },
          rectRadius: 0.1
        });
        // Header with accent bar
        matrixSlide.addShape(pptx.ShapeType.rect, {
          x: conf.x, y: cardY, w: 4.1, h: 0.04, fill: { color: NAVY }
        });
        matrixSlide.addText(`${conf.icon}  ${conf.title}`, {
          x: conf.x + 0.2, y: cardY + 0.2, w: 3.7, fontSize: 13, bold: true, color: NAVY, fontFace: 'Arial'
        });
        const bulletH = calcH - headerH - insightH - cardPadding + 0.1;
        const bulletTxt = (conf.challenges || []).length > 0
          ? conf.challenges.map(c => `\u2022 ${c}`).join('\n')
          : "Standard discovery ongoing";
        matrixSlide.addText(bulletTxt, {
          x: conf.x + 0.2, y: cardY + 0.6, w: 3.7, h: bulletH, fontSize: 10, color: '475569', valign: 'top', breakLine: true, fontFace: 'Arial', lineSpacingMultiple: 1.5
        });
        if (conf.insight) {
          matrixSlide.addText(`AI Insight: ${conf.insight}`, {
            x: conf.x + 0.2, y: cardY + calcH - 0.5, w: 3.7, fontSize: 9, color: SLATE, italic: true, fontFace: 'Arial'
          });
        }
      });

      // --- SLIDE B: STEP-BY-STEP READINESS SCHEDULE ---
      const scheduleSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      scheduleSlide.addText("STEP-BY-STEP READINESS SCHEDULE", {
        x: 0.5, y: 0.6, w: '80%', fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
      });
      scheduleSlide.addText(oppName, {
        x: 0.5, y: 1.1, w: '80%', fontSize: 13, fontFace: 'Arial', color: SLATE, italic: true
      });
      addPageNum(scheduleSlide);

      const tasks = roadmap.preAutomationTasks || [];
      const scheduleRows = [
        [
          { text: 'Readiness Activity', options: { fill: NAVY, color: WHITE, bold: true } },
          { text: 'Owner', options: { fill: NAVY, color: WHITE, bold: true } },
          { text: 'Importance', options: { fill: NAVY, color: WHITE, bold: true } },
          { text: 'Outcome Required', options: { fill: NAVY, color: WHITE, bold: true } }
        ]
      ];

      tasks.forEach((t, idx) => {
        const rowFill = idx % 2 === 0 ? WHITE : ALT_ROW;
        const importance = t.importance || t.priority || 'Standard';
        const impColor = importance.toLowerCase() === 'critical' ? RED : importance.toLowerCase() === 'high' ? AMBER : '475569';
        scheduleRows.push([
          { text: t.task || t.item || '', options: { bold: true, fill: rowFill } },
          { text: t.owner || 'Client Team', options: { fill: rowFill } },
          { text: importance, options: { fill: rowFill, color: impColor, bold: true } },
          { text: t.description || t.reason || '', options: { fill: rowFill } }
        ]);
      });

      if (scheduleRows.length > 1) {
        scheduleSlide.addTable(scheduleRows, {
          x: 0.4, y: 1.6, w: 12.5,
          border: { pt: 0.5, color: BORDER },
          fontSize: 10,
          fontFace: 'Arial',
          autoPage: true,
          colW: [3.5, 2, 1.5, 5.5]
        });
      } else {
        scheduleSlide.addText("No readiness activities have been defined for this opportunity.", {
          x: 1.5, y: 3, w: 10, align: 'center', fontSize: 12, fontFace: 'Arial', color: LIGHT_SLATE, italic: true
        });
      }

      const timelineTxt = roadmap.kickoffReadiness?.suggestedTimeline || opp.roiTimeline || "TBD";
      scheduleSlide.addShape(pptx.ShapeType.roundRect, {
        x: 0.4, y: 6.2, w: 12.5, h: 0.6,
        fill: { color: OFF_WHITE },
        border: { type: 'solid', color: BORDER, pt: 0.5 },
        rectRadius: 0.05
      });
      scheduleSlide.addText(`STRATEGIC TIMELINE:  ${timelineTxt}`, {
        x: 0.6, y: 6.25, w: 12.1, h: 0.5, fontSize: 10, fontFace: 'Arial', color: NAVY, bold: true, valign: 'middle'
      });

      // --- SLIDE C: DOCUMENTS REQUIRED FROM CLIENT ---
      const docsSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      docsSlide.addText("DOCUMENTS REQUIRED FROM CLIENT", {
        x: 0.5, y: 0.6, w: '80%', fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
      });
      docsSlide.addText(oppName, {
        x: 0.5, y: 1.1, w: '80%', fontSize: 13, fontFace: 'Arial', color: SLATE, italic: true
      });
      addPageNum(docsSlide);

      const docs = roadmap.documentChecklist || roadmap.documentRequirements || [];
      const docRows = [
        [
          { text: 'Asset / Document Name', options: { fill: NAVY, color: WHITE, bold: true } },
          { text: 'Format', options: { fill: NAVY, color: WHITE, bold: true } },
          { text: 'Strategic Importance / Logic', options: { fill: NAVY, color: WHITE, bold: true } }
        ]
      ];

      docs.forEach((d, idx) => {
        const rowFill = idx % 2 === 0 ? WHITE : ALT_ROW;
        docRows.push([
          { text: d.documentName || d.item || '', options: { bold: true, fill: rowFill } },
          { text: d.format || 'Digital', options: { fill: rowFill } },
          { text: d.reason || d.description || '', options: { fill: rowFill } }
        ]);
      });

      if (docRows.length > 1) {
        docsSlide.addTable(docRows, {
          x: 0.4, y: 1.6, w: 12.5,
          border: { pt: 0.5, color: BORDER },
          fontSize: 10,
          fontFace: 'Arial',
          autoPage: true,
          colW: [4, 1.5, 7]
        });
      } else {
        docsSlide.addText("No document requirements have been defined for this opportunity.", {
          x: 1.5, y: 3, w: 10, align: 'center', fontSize: 12, fontFace: 'Arial', color: LIGHT_SLATE, italic: true
        });
      }

      // --- SLIDE D: STAKEHOLDER CHECKLIST ---
      const stakeSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      stakeSlide.addText("STAKEHOLDER CHECKLIST", {
        x: 0.5, y: 0.6, w: '80%', fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
      });
      stakeSlide.addText(oppName, {
        x: 0.5, y: 1.1, w: '80%', fontSize: 13, fontFace: 'Arial', color: SLATE, italic: true
      });
      addPageNum(stakeSlide);

      const stakeholders = roadmap.stakeholderChecklist || [];
      const stakeRows = [
        [
          { text: 'Role / Designation', options: { fill: NAVY, color: WHITE, bold: true } },
          { text: 'Involvement Stage', options: { fill: NAVY, color: WHITE, bold: true } },
          { text: 'Purpose of Engagement', options: { fill: NAVY, color: WHITE, bold: true } }
        ]
      ];

      stakeholders.forEach((s, idx) => {
        const rowFill = idx % 2 === 0 ? WHITE : ALT_ROW;
        stakeRows.push([
          { text: s.role || '', options: { bold: true, fill: rowFill } },
          { text: s.involvement || 'Ongoing', options: { fill: rowFill } },
          { text: s.reason || '', options: { fill: rowFill } }
        ]);
      });

      if (stakeRows.length > 1) {
        stakeSlide.addTable(stakeRows, {
          x: 0.4, y: 1.6, w: 12.5,
          border: { pt: 0.5, color: BORDER },
          fontSize: 10,
          fontFace: 'Arial',
          autoPage: true,
          colW: [3.5, 2.5, 6.5]
        });
      } else {
        stakeSlide.addText("No stakeholder information has been defined for this opportunity.", {
          x: 1.5, y: 3, w: 10, align: 'center', fontSize: 12, fontFace: 'Arial', color: LIGHT_SLATE, italic: true
        });
      }
    });


    // ========================================
    // RECOMMENDATIONS & NEXT STEPS SLIDE
    // ========================================
    const recoSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    recoSlide.addText("RECOMMENDATIONS & NEXT STEPS", {
      x: 0.5, y: 0.6, w: '80%', fontSize: 28, fontFace: 'Arial', color: NAVY, bold: true
    });
    addPageNum(recoSlide);

    // Build dynamic recommendations
    const recoItems = [];
    if (approvedOpps.length > 0) {
      const topApproved = [...approvedOpps].sort((a, b) => (b.scores?.overall || 0) - (a.scores?.overall || 0))[0];
      recoItems.push({
        title: 'Prioritize Highest-Readiness Opportunity',
        desc: `Begin with "${topApproved.opportunityName}" (${topApproved.scores?.overall}% readiness) as the pilot initiative to demonstrate early value.`
      });
    }
    recoItems.push({
      title: 'Complete Document Collection',
      desc: 'Each approved opportunity has a detailed document checklist. Initiating collection immediately will prevent delays in the discovery phase.'
    });
    recoItems.push({
      title: 'Engage Key Stakeholders Early',
      desc: 'Stakeholder buy-in is critical for AI adoption. Schedule kickoff meetings with identified roles to align expectations and secure data access.'
    });
    recoItems.push({
      title: 'Address Data Pipeline Gaps',
      desc: 'Data readiness is the most common bottleneck. Invest in data cleanup and standardization before automation development begins.'
    });

    // Calculate spacing based on item count to fill available space (1.4 to 5.9)
    const recoAvailH = 4.5;
    const recoItemH = recoAvailH / recoItems.length;

    recoItems.forEach((item, idx) => {
      const yPos = 1.4 + (idx * recoItemH);

      // Card background
      recoSlide.addShape(pptx.ShapeType.roundRect, {
        x: 0.5, y: yPos, w: 12.3, h: recoItemH - 0.15,
        fill: { color: idx % 2 === 0 ? OFF_WHITE : WHITE },
        border: { type: 'solid', color: BORDER, pt: 0.5 },
        rectRadius: 0.06
      });

      // Number badge
      recoSlide.addShape(pptx.ShapeType.ellipse, {
        x: 0.7, y: yPos + (recoItemH - 0.15) / 2 - 0.2, w: 0.4, h: 0.4,
        fill: { color: NAVY }
      });
      recoSlide.addText(`${idx + 1}`, {
        x: 0.7, y: yPos + (recoItemH - 0.15) / 2 - 0.2, w: 0.4, h: 0.4,
        align: 'center', valign: 'middle',
        fontSize: 14, fontFace: 'Arial', color: WHITE, bold: true
      });

      // Title
      recoSlide.addText(item.title, {
        x: 1.3, y: yPos + 0.1, w: 11.2, h: 0.3,
        fontSize: 13, fontFace: 'Arial', color: NAVY, bold: true, valign: 'middle'
      });
      // Description
      recoSlide.addText(item.desc, {
        x: 1.3, y: yPos + 0.42, w: 11.2, h: recoItemH - 0.7,
        fontSize: 11, fontFace: 'Arial', color: '475569', valign: 'top', lineSpacingMultiple: 1.3
      });
    });

    // Proposed timeline bar
    recoSlide.addShape(pptx.ShapeType.roundRect, {
      x: 0.5, y: 6.15, w: 12.3, h: 0.55,
      fill: { color: NAVY },
      rectRadius: 0.05
    });
    recoSlide.addText("PROPOSED ENGAGEMENT:   Discovery (Weeks 1\u20132)   \u2192   Data Preparation (Weeks 3\u20134)   \u2192   Development Sprint (Weeks 5\u20138)   \u2192   UAT & Go-Live (Weeks 9\u201310)", {
      x: 0.7, y: 6.15, w: 11.9, h: 0.55, fontSize: 10, fontFace: 'Arial', color: WHITE, bold: true, valign: 'middle'
    });


    // ========================================
    // THANK YOU / CONTACT SLIDE (Dark)
    // ========================================
    const thanksSlide = pptx.addSlide({ masterName: 'DARK_SLIDE' });
    thanksSlide.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: 3.65, w: 2.0, h: 0.04, fill: { color: ACCENT_BLUE }
    });
    thanksSlide.addText("Thank You", {
      x: 0.8, y: 2.2, w: 10, fontSize: 48, fontFace: 'Arial', color: WHITE, bold: true
    });
    thanksSlide.addText("We look forward to partnering with you on your AI transformation journey.", {
      x: 0.8, y: 3.9, w: 10, fontSize: 16, fontFace: 'Arial', color: LIGHT_SLATE, lineSpacingMultiple: 1.4
    });
    thanksSlide.addText("Finivis  |  Prepare for Tomorrow\nwww.finivis.com", {
      x: 0.8, y: 5.0, w: 10, fontSize: 14, fontFace: 'Arial', color: ACCENT_BLUE, lineSpacingMultiple: 1.5
    });
    thanksSlide.addText("CONFIDENTIAL \u2014 This document contains proprietary information prepared exclusively for the intended recipient.", {
      x: 0.8, y: 6.8, w: 11, fontSize: 9, fontFace: 'Arial', color: SLATE
    });
    addPageNum(thanksSlide);


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
                    <EditableScoreCell value={r.scores.data} field="data" originalIndex={r.originalIndex} colorClasses="bg-purple-50 text-purple-700" onScoreChange={handleScoreChange} editable={isEditable} />
                    <EditableScoreCell value={r.scores.value} field="value" originalIndex={r.originalIndex} colorClasses="bg-blue-50 text-blue-700" onScoreChange={handleScoreChange} editable={isEditable} />
                    <EditableScoreCell value={r.scores.feasibility} field="feasibility" originalIndex={r.originalIndex} colorClasses="bg-orange-50 text-orange-700" onScoreChange={handleScoreChange} editable={isEditable} />
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
          <div className="w-full overflow-visible">
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
