import * as Scoring from './ScoringEngine';
import * as RuleEngine from './RuleEngine';
import * as ScopeGen from './ScopeGenerator';

/**
 * Professional Evaluation Engine Master Controller.
 * Consolidates normalization, scoring, challenge detection, and scope generation.
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
    automationType: scopeData.templateName
  };
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
