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

  // 6. Return comprehensive report object
  return {
    opportunityName: opp.name || 'Unnamed Opportunity',
    scores,
    priority,
    complexity,
    challenges,
    scope: scopeData,
    effort,
    confidence,
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
    const aiEvaluations = result.opportunities.map((aiOpp, idx) => ({
      ...opportunities[idx],
      ...aiOpp,
      opportunityName: aiOpp.opportunityName || opportunities[idx].name || 'Unnamed Opportunity',
      scoringMode: 'ai'
    }));

    return {
      evaluations: aiEvaluations,
      narrative: {
        executiveSummary: result.executiveSummary,
        topRecommendation: result.topRecommendation,
        riskProfile: result.riskProfile,
        suggestedTechStack: result.suggestedTechStack,
        scopeOfWork: result.scopeOfWork,
        draftEmail: result.draftEmail,
        internalNextSteps: result.internalNextSteps
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
function generateTags(scores, priority, complexity) {
  const tags = [];

  if (priority === 'HIGH' && complexity === 'LOW') tags.push('Quick Win');
  if (priority === 'HIGH' && complexity === 'HIGH') tags.push('Strategic Initiative');
  if (scores.value >= 80) tags.push('High ROI');
  if (scores.data < 40) tags.push('Data Improvement Needed');
  if (scores.feasibility >= 80) tags.push('AI Ready');
  if (priority === 'LOW') tags.push('Evaluate Further');

  return tags;
}
