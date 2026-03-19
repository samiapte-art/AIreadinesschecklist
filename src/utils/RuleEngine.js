import rules from '../data/rules.json';

/**
 * Rule Engine to evaluate opportunity input against predefined rules.
 */

const evaluateCondition = (condition, context) => {
  // Simple parser/evaluator for conditions like "systems_count > 3"
  const parts = condition.split(' ');
  if (parts.length === 3) {
    const [left, operator, right] = parts;
    const value = context[left];
    const compareValue = isNaN(right) ? right.replace(/'/g, "") : Number(right);

    switch (operator) {
      case '>': return value > compareValue;
      case '<': return value < compareValue;
      case '==': return value == compareValue;
      case '!=': return value != compareValue;
      default: return false;
    }
  }
  
  // Boolean flags
  if (condition === 'no_documents') return !context.has_documents;
  if (condition === 'no_kpi') return !context.has_kpi;

  return false;
};

export const detectChallenges = (opp, scoringData) => {
  const systemsList = (opp.systems || '').split(',').map(s => s.trim()).filter(Boolean);
  
  // Built basic context for rules
  const context = {
    systems_count: systemsList.length,
    data_availability: scoringData.data_val || 0, // we'll pass the normalized value
    maturity: scoringData.maturity_val || 0,
    frequency: opp.frequency,
    has_documents: opp.documents && opp.documents.length > 0,
    has_kpi: !!opp.kpi
  };

  const results = {
    data: [],
    process: [],
    value: [],
    feasibility: []
  };

  // Run through rules
  rules.dataRules.forEach(r => {
    if (evaluateCondition(r.condition, context)) results.data.push(r.output);
  });
  rules.processRules.forEach(r => {
    if (evaluateCondition(r.condition, context)) results.process.push(r.output);
  });
  rules.valueRules.forEach(r => {
    if (evaluateCondition(r.condition, context)) results.value.push(r.output);
  });
  rules.feasibilityRules.forEach(r => {
    if (evaluateCondition(r.condition, context)) results.feasibility.push(r.output);
  });

  return results;
};
