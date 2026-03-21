import * as Scoring from './ScoringEngine';
import * as RuleEngine from './RuleEngine';
import * as ScopeGen from './ScopeGenerator';
import { evaluateOpportunitiesWithDVF } from './aiAnalyzer';

/**
 * Professional Evaluation Engine Master Controller.
 * Supports two modes:
 *   - Deterministic (instant, local) via evaluateOpportunity()
 *   - AI-powered DVF (GPT-4o) via evaluateOpportunitiesAI()
 */

const DECISION_THRESHOLD = 55;

/**
 * Decision Logic — Approved vs Not Considered
 */
export const getDecision = (overallScore, priority, challenges) => {
  const isApproved = overallScore >= DECISION_THRESHOLD;
  
  let reasoning;
  if (isApproved) {
    reasoning = overallScore >= 80
      ? `Strong candidate with an overall readiness score of ${overallScore}%. The opportunity demonstrates high value and feasibility.`
      : overallScore >= 60
        ? `Good candidate with an overall readiness score of ${overallScore}%. The opportunity meets qualification criteria with some areas for improvement.`
        : `Borderline candidate with an overall readiness score of ${overallScore}%. Approved with conditions — several areas need attention before kickoff.`;
  } else {
    const failReasons = [];
    if (challenges?.data?.length > 0) failReasons.push('significant data readiness gaps');
    if (challenges?.feasibility?.length > 0) failReasons.push('technical feasibility concerns');
    if (challenges?.value?.length > 0) failReasons.push('unclear value realization path');
    if (challenges?.process?.length > 0) failReasons.push('process maturity gaps');
    reasoning = `The opportunity scored ${overallScore}% overall, falling below the qualification threshold of ${DECISION_THRESHOLD}%. Key concerns include: ${failReasons.length > 0 ? failReasons.join(', ') : 'insufficient overall readiness'}.`;
  }

  return {
    verdict: isApproved ? 'Approved' : 'Not Considered',
    threshold: DECISION_THRESHOLD,
    overallScore,
    reasoning
  };
};

/**
 * Detect missing checklist fields that impact scoring confidence.
 */
export const detectMissingFields = (opp) => {
  const missing = [];
  const checks = [
    { field: 'name', label: 'Opportunity Name', impact: 'Cannot identify the opportunity' },
    { field: 'description', label: 'Description', impact: 'AI suitability and scope generation are unreliable without context' },
    { field: 'painPoints', label: 'Pain Points', impact: 'Value score may be underestimated', check: (v) => !v || v.length === 0 },
    { field: 'businessValue', label: 'Business Value', impact: 'Value score and risk assessment are incomplete', check: (v) => !v || v.length === 0 },
    { field: 'maturity', label: 'Process Maturity', impact: 'Feasibility and data consistency scores default to worst-case' },
    { field: 'dataAvailability', label: 'Data Availability', impact: 'Data readiness score defaults to lowest level' },
    { field: 'frequency', label: 'Process Frequency', impact: 'Value multiplier defaults to neutral — ROI estimate may be inaccurate' },
    { field: 'systems', label: 'Systems Involved', impact: 'Integration complexity cannot be assessed' },
    { field: 'kpi', label: 'KPI for Success', impact: 'Automation success measurement criteria undefined' },
    { field: 'futureState', label: 'Desired Future State', impact: 'Scope generation may not align with client expectations' },
  ];

  checks.forEach(({ field, label, impact, check }) => {
    const value = opp[field];
    const isMissing = check ? check(value) : (!value || (typeof value === 'string' && value.trim() === ''));
    if (isMissing) {
      missing.push({ field, label, impact });
    }
  });

  return missing;
};

export const evaluateOpportunity = (opp) => {
  // 1. Calculate Core Scores
  const scores = Scoring.calculateOpportunityScore(opp);

  // 2. Classify Priority & Complexity
  const priority = Scoring.getPriorityLabel(scores.overall);
  const complexity = Scoring.getComplexityLabel(opp);

  // 3. Detect Challenges
  const challenges = RuleEngine.detectChallenges(opp, scores);

  // 4. Generate Implementation Scope
  const scopeData = ScopeGen.generateScopeDetails(opp);

  // 5. Gold Standard Estimations
  const effort = ScopeGen.getImplementationEffort(complexity);
  const confidence = ScopeGen.calculateAutomationConfidence(scores);

  // 6. Decision Layer
  const decision = getDecision(scores.overall, priority, challenges);

  // 7. Missing Fields
  const missingFields = detectMissingFields(opp);

  // 8. Return comprehensive report object
  return {
    opportunityName: opp.name || 'Unnamed Opportunity',
    scores,
    priority,
    complexity,
    challenges,
    scope: scopeData,
    effort,
    confidence,
    decision,
    missingFields,
    tags: generateTags(scores, priority, complexity),
    automationType: scopeData.templateName,
    scoringMode: 'local'
  };
};

/**
 * AI-powered DVF evaluation. Calls GPT-4o with the full framework.
 * Falls back to deterministic scoring if the API call fails.
 */
export const evaluateOpportunitiesAI = async (opportunities, clientName) => {
  try {
    const result = await evaluateOpportunitiesWithDVF(opportunities, clientName);

    // Merge raw opportunity data into each AI evaluation for UI compatibility
    const aiEvaluations = result.opportunities.map((aiOpp, idx) => {
      const opp = opportunities[idx];
      const mergedOpp = {
        ...opp,
        ...aiOpp,
        opportunityName: aiOpp.opportunityName || opp.name || 'Unnamed Opportunity',
        scoringMode: 'ai'
      };

      // Ensure decision exists (AI should provide it, but fallback to deterministic)
      if (!mergedOpp.decision) {
        const challenges = mergedOpp.challenges || RuleEngine.detectChallenges(opp, mergedOpp.scores || {});
        mergedOpp.decision = getDecision(mergedOpp.scores?.overall || 0, mergedOpp.priority, challenges);
      }

      // Ensure missingFields exists
      if (!mergedOpp.missingFields) {
        mergedOpp.missingFields = detectMissingFields(opp);
      }

      return mergedOpp;
    });

    return {
      evaluations: aiEvaluations,
      narrative: {
        executiveSummary: result.executiveSummary,
        topRecommendation: result.topRecommendation,
        riskProfile: result.riskProfile,
        suggestedTechStack: result.suggestedTechStack,
        scopeOfWork: result.scopeOfWork,
        draftEmail: result.draftEmail,
        internalNextSteps: result.internalNextSteps,
        notConsideredSummary: result.notConsideredSummary || null
      },
      scoringMode: 'ai'
    };
  } catch (err) {
    console.error("AI evaluation failed, falling back to deterministic scoring:", err);

    // Fallback: run deterministic evaluation per opportunity
    const fallbackEvaluations = opportunities.map(opp => ({
      ...opp,
      ...evaluateOpportunity(opp),
      scoringMode: 'local'
    }));

    return {
      evaluations: fallbackEvaluations,
      narrative: null,
      scoringMode: 'fallback',
      error: err.message
    };
  }
};

/**
 * Generate logical tags for the opportunity.
 */
export function generateTags(scores, priority, complexity) {
  const tags = [];

  if (priority === 'HIGH' && complexity === 'LOW') tags.push('Quick Win');
  if (priority === 'HIGH' && complexity === 'HIGH') tags.push('Strategic Initiative');
  if (scores.value >= 80) tags.push('High ROI');
  if (scores.data < 40) tags.push('Data Improvement Needed');
  if (scores.feasibility >= 80) tags.push('AI Ready');
  if (priority === 'LOW') tags.push('Evaluate Further');

  return tags;
}
