import templates from '../data/scopeTemplates.json';

/**
 * Scope Generator - predicts the project scope based on keywords.
 */

export const generateScopeDetails = (opp) => {
  const desc = (opp.description || '').toLowerCase();
  const name = (opp.name || '').toLowerCase();
  
  const docKeywords = ['invoice', 'pdf', 'document', 'form', 'scan', 'extraction', 'ocr'];
  const dataKeywords = ['predict', 'forecast', 'analytics', 'report', 'trend', 'data'];
  const workflowKeywords = ['approval', 'routing', 'steps', 'process', 'workflow', 'manual work', 'bottleneck'];

  let templateKey = 'DEFAULT';
  
  if (docKeywords.some(k => desc.includes(k) || name.includes(k))) {
    templateKey = 'DOCUMENT_AI';
  } else if (dataKeywords.some(k => desc.includes(k) || name.includes(k))) {
    templateKey = 'DATA_PREDICTION';
  } else if (workflowKeywords.some(k => desc.includes(k) || name.includes(k))) {
    templateKey = 'WORKFLOW_AUTOMATION';
  }

  const template = templates[templateKey];
  
  return {
    templateName: template.name,
    phases: template.phases,
    components: template.components,
    type: templateKey
  };
};

/**
 * Gold Standard Estimations
 */

export const getImplementationEffort = (complexity) => {
  if (complexity === 'HIGH') return '4–9 months';
  if (complexity === 'MEDIUM') return '2–4 months';
  return '4–6 weeks';
};

export const calculateAutomationConfidence = (scoringData) => {
  // Confidence = (Data score + Feasibility + Process maturity) / 3
  // Normalized as a percentage
  const avg = (scoringData.data + scoringData.feasibility + (scoringData.maturity_val || 50)) / 3;
  return Math.round(avg);
};
