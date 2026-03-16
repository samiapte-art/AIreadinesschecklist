export const SCORE_WEIGHTS = {
  value: 0.5,
  data: 0.3,
  feasibility: 0.2
};

export const evaluateOpportunity = (opp) => {
  let valueScore = 0;
  let dataScore = 0;
  let feasibilityScore = 0;

  // 1. Value Score (1-5)
  // Based on value tags
  const valueMult = opp.businessValue?.length || 0;
  const frequencyMap = {
    'Daily': 5,
    'Weekly': 4,
    'Monthly': 3,
    'Occasionally': 1
  };
  const freqScore = frequencyMap[opp.frequency] || 1;
  valueScore = Math.min(5, Math.ceil((valueMult * 0.8) + (freqScore * 0.4)));
  valueScore = Math.max(1, valueScore);

  // 2. Data Readiness (1-5)
  const dataMap = {
    'High (clean, structured data available)': 5,
    'Medium (some data available but messy)': 3,
    'Low (little or no data)': 1
  };
  dataScore = dataMap[opp.dataAvailability] || 1;

  // 3. Feasibility (1-5)
  const maturityMap = {
    'Well documented and standardized': 5,
    'Partially documented': 3,
    'Not documented': 1
  };
  feasibilityScore = maturityMap[opp.maturity] || 1;

  // Final AI Score
  const score = (
    (valueScore * SCORE_WEIGHTS.value) + 
    (dataScore * SCORE_WEIGHTS.data) + 
    (feasibilityScore * SCORE_WEIGHTS.feasibility)
  ).toFixed(2);

  const numScore = parseFloat(score);

  // Determine Category
  let category = '';
  if (numScore >= 3.8 && dataScore >= 4 && feasibilityScore >= 4) {
    category = 'Quick Win';
  } else if (numScore >= 3.5 && feasibilityScore < 3) {
    category = 'Strategic Initiative';
  } else if (numScore < 3.0 && valueScore < 3 && feasibilityScore >= 3) {
    category = 'Efficiency Play';
  } else if (dataScore <= 2) {
    category = 'Long-Term Bet';
  } else {
    category = 'Evaluate Further';
  }

  return {
    valueScore,
    dataScore,
    feasibilityScore,
    finalScore: numScore,
    category
  };
};
