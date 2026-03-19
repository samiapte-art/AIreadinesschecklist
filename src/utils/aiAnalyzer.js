import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

let openai;
if (apiKey && apiKey !== 'your_openai_api_key_here') {
  openai = new OpenAI({ 
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Allowed for demo purposes
  });
}

export const analyzeOpportunities = async (evaluatedOpportunities, clientName) => {
  if (!openai) {
    throw new Error("OpenAI API Key is missing or invalid. Please check your .env file.");
  }

  const promptStr = `
You are a Senior AI Strategist at Finivis, a top-tier technology consulting firm.
Your job is to analyze the following business processes evaluated under our proprietary AI Readiness Framework for the client "${clientName}".

We have already performed a deep-dive mathematical assessment of these opportunities. Use the provided scores, challenges, and suggested scopes as the GROUND TRUTH for your narrative.

Rich Assessment Data:
${JSON.stringify(evaluatedOpportunities, null, 2)}

Respond ONLY with a valid JSON object matching exactly this structure, with no markdown formatting around it:
{
  "executiveSummary": "A 2-4 sentence summary of the client's current AI automation portfolio and overall readiness level based on the weighted scores (Value, Data, Feasibility, Risk).",
  "topRecommendation": {
    "opportunityName": "Name of the highest-scoring/strategic 'Quick Win' to tackle first",
    "rationale": "Direct reference to the scores and why this is the strategic priority (max 2 sentences)"
  },
  "riskProfile": "Synthesis of the 'risk' scores and identified challenges across all opportunities.",
  "suggestedTechStack": ["Specific AI Technology", "Integration Layer", "Infrastructure"],
  "scopeOfWork": {
    "title": "A professional title for the AI Engagement",
    "duration": "Estimated timeframe based on the 'effort' fields provided",
    "estimatedHours": "Total estimated consulting hours",
    "phases": [
      { 
        "name": "Phase 1: Discovery & Technical Prep", 
        "description": "Narrative based on the 'challenges' identified in Rule Engine.",
        "deliverables": ["TRD", "Data Roadmap"] 
      },
      { 
        "name": "Phase 2: Build & Integration", 
        "description": "Narrative build out of the implementation 'scope' and 'automationType' provided in data.",
        "deliverables": ["Functioning AI Solution", "UAT Results"] 
      },
      { 
        "name": "Phase 3: Rollout & Governance", 
        "description": "Narrative on how to ensure the 'confidence' percentage is realized.",
        "deliverables": ["SOP Manual", "Governance Guide"] 
      }
    ],
    "assumptions": ["Client provides data access", "Key stakeholders available"],
    "outOfScope": ["Third-party hardware"],
    "acceptanceCriteria": "Define how the ROI timeline mentioned in SOW will be validated."
  },
  "draftEmail": {
    "subject": "Strategic AI Analysis: Path to Implementation",
    "body": "A professional, consultative email body (use \\n for line breaks) summarizing the high-scoring opportunities, praising their potential, and pitching the next sync."
  },
  "internalNextSteps": [
    "Finalize technical architecture",
    "Prepare SOW for Phase 1"
  ]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI consulting strategy JSON generator. Output pure JSON." },
        { role: "user", content: promptStr }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error("Failed to generate AI strategy:", err);
    throw err;
  }
};

/**
 * Generate a detailed solution blueprint for a single opportunity.
 */
export const getOpportunitySolution = async (evaluatedOpp, clientName) => {
  if (!openai) throw new Error("OpenAI API Key is missing.");

  const promptStr = `
You are a Senior Technical Architect at Finivis.
Provide a detailed Solution Blueprint for this specific AI opportunity:
${JSON.stringify(evaluatedOpp, null, 2)}

Client: ${clientName}

Respond ONLY with a JSON object:
{
  "solutionTitle": "A technical name for the solution",
  "executiveSummary": "1-2 sentence high-level overview of the proposed solution.",
  "technicalArchitecture": "Detailed description of how the AI will be integrated into the existing system mentioned.",
  "detailedChallenges": {
     "data": "Specific data-related hurdles based on the provided challenges.",
     "process": "Process-related hurdles and change management needs.",
     "technical": "Specific integration or feasibility hurdles."
  },
  "implementationRoadmap": [
    { "phase": "Discovery", "task": "Task description" },
    { "phase": "Pilot", "task": "Task description" },
    { "phase": "Scale", "task": "Task description" }
  ],
  "expectedROI": "Quantifiable ROI prediction (e.g. 30% reduction in X overhead)"
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a technical AI Architect. Output pure JSON." },
        { role: "user", content: promptStr }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error("Failed to generate opportunity solution:", err);
    throw err;
  }
};

