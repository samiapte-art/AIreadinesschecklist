/**
 * Scoring Engine for AI Opportunities
 * Implements the professional-grade assessment logic.
 */

const NORM_MAPS = {
  frequency: {
    'Daily': 5,
    'Weekly': 4,
    'Monthly': 3,
    'Quarterly': 2,
    'Rare': 1
  },
  maturity: {
    'Adhoc': 1,
    'Defined': 3,
    'Standardized': 5,
    'Optimized': 7,
    'Automated': 10
  },
  dataAvailability: {
    'No data': 1,
    'Manual data': 3,
    'Digital unstructured': 5,
    'Structured systems': 8,
    'Data warehouse ready': 10
  }
};

const normalizeLabel = (label, type) => {
  if (!label) return 0;
  const keyMatch = Object.keys(NORM_MAPS[type]).find(k => label.startsWith(k));
  return keyMatch ? NORM_MAPS[type][keyMatch] : 0;
};

const normalizeTo100 = (score, max) => Math.min(100, Math.round((score / max) * 100));

/**
 * 1. Calculate Value Score
 */
export const calculateValueScore = (opp) => {
  let painScore = 0;
  const painPoints = opp.painPoints || [];
  if (painPoints.includes('Manual work')) painScore += 15;
  if (painPoints.includes('Errors or rework')) painScore += 15;
  if (painPoints.includes('Slow turnaround')) painScore += 10;
  if (painPoints.includes('High cost')) painScore += 12;
  if (painPoints.includes('Poor customer experience')) painScore += 8;
  if (painPoints.includes('Data scattered across systems')) painScore += 10;

  let businessScore = 0;
  const values = opp.businessValue || [];
  if (values.includes('Revenue growth')) businessScore += 20;
  if (values.includes('Cost reduction')) businessScore += 18;
  if (values.includes('Productivity / efficiency')) businessScore += 15;
  if (values.includes('Better customer experience')) businessScore += 12;
  if (values.includes('Compliance / risk reduction')) businessScore += 14;

  const freqMapping = {
    'Daily': 1.5,
    'Weekly': 1.3,
    'Monthly': 1.1,
    'Quarterly': 0.9,
    'Rare': 0.8
  };
  const freqMultiplier = freqMapping[Object.keys(freqMapping).find(k => opp.frequency?.startsWith(k))] || 1.0;

  const rawScore = (painScore + businessScore) * freqMultiplier;
  return normalizeTo100(rawScore, 100); // Max possible is around 100-110 before mult, but we normalize
};

/**
 * 2. Calculate Data Score
 */
export const calculateDataScore = (opp) => {
  const availabilityScore = normalizeLabel(opp.dataAvailability, 'dataAvailability');
  
  // System complexity
  const systemsList = (opp.systems || '').split(',').map(s => s.trim()).filter(Boolean);
  const sysCount = systemsList.length;
  let systemComplexity = 2;
  if (sysCount === 1) systemComplexity = 10;
  else if (sysCount === 2) systemComplexity = 8;
  else if (sysCount === 3) systemComplexity = 6;
  else if (sysCount === 4) systemComplexity = 4;

  const documentationBonus = (opp.documents && opp.documents.length > 0) ? 5 : 0;
  
  const maturityVal = normalizeLabel(opp.maturity, 'maturity');
  let maturityFactor = 3;
  if (maturityVal >= 7) maturityFactor = 10;
  else if (maturityVal >= 4) maturityFactor = 6;

  const rawScore = availabilityScore + systemComplexity + documentationBonus + maturityFactor;
  return normalizeTo100(rawScore, 35); // 10+10+5+10 = 35 max
};

/**
 * 3. Calculate Feasibility Score
 */
export const calculateFeasibilityScore = (opp) => {
  const maturityVal = normalizeLabel(opp.maturity, 'maturity');
  let processStandardization = 6;
  if (maturityVal >= 7) processStandardization = 20;
  else if (maturityVal >= 4) processStandardization = 12;

  const systemsList = (opp.systems || '').split(',').map(s => s.trim()).filter(Boolean);
  let integrationDifficulty = 5;
  if (systemsList.length <= 2) integrationDifficulty = 18;
  else if (systemsList.length <= 4) integrationDifficulty = 10;

  // AI Suitability (Heuristic based on keywords in description)
  let aiSuitability = 12; // Default
  const desc = (opp.description || '').toLowerCase();
  const highSuitabilityKeywords = ['invoice', 'document', 'form', 'email', 'classify', 'extract', 'predict'];
  if (highSuitabilityKeywords.some(k => desc.includes(k))) aiSuitability = 20;

  const freqVal = normalizeLabel(opp.frequency, 'frequency');
  let frequencyImpact = 10;
  if (freqVal === 5) frequencyImpact = 20;
  else if (freqVal === 4) frequencyImpact = 15;

  const rawScore = processStandardization + integrationDifficulty + aiSuitability + frequencyImpact;
  return normalizeTo100(rawScore, 78); // 20+18+20+20 = 78 max
};

/**
 * 4. Calculate Risk Score
 */
export const calculateRiskScore = (opp) => {
  let riskBase = 100;
  const values = opp.businessValue || [];
  
  if (values.includes('Compliance / risk reduction')) riskBase -= 25;
  if (values.includes('Better customer experience')) riskBase -= 15;
  
  const desc = (opp.description || '').toLowerCase();
  if (desc.includes('financial') || desc.includes('payment') || desc.includes('money')) {
    riskBase -= 20;
  }
  
  if (desc.includes('internal')) riskBase -= 5;

  return Math.max(0, riskBase);
};

/**
 * Final Weighted Score
 */
export const calculateOpportunityScore = (opp) => {
  const val = calculateValueScore(opp);
  const dat = calculateDataScore(opp);
  const fea = calculateFeasibilityScore(opp);
  const rsk = calculateRiskScore(opp);

  const finalScore = (val * 0.30) + (dat * 0.25) + (fea * 0.25) + (rsk * 0.20);
  
  return {
    value: val,
    data: dat,
    feasibility: fea,
    risk: rsk,
    overall: Math.round(finalScore)
  };
};

/**
 * Priority classification
 */
export const getPriorityLabel = (overallScore) => {
  if (overallScore >= 80) return 'HIGH';
  if (overallScore >= 60) return 'MEDIUM';
  if (overallScore >= 40) return 'LOW';
  return 'NOT RECOMMENDED';
};

/**
 * Complexity Estimation
 */
export const getComplexityLabel = (opp) => {
  const systemsList = (opp.systems || '').split(',').map(s => s.trim()).filter(Boolean);
  const sysCount = systemsList.length;
  const dataVal = normalizeLabel(opp.dataAvailability, 'dataAvailability');
  
  if (sysCount > 4 || dataVal <= 3) return 'HIGH';
  if (sysCount >= 2) return 'MEDIUM';
  return 'LOW';
};
