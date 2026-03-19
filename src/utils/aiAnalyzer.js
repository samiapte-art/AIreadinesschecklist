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
 * Generate a detailed pre-automation readiness schedule for the client.
 */
export const getOpportunityPreReqs = async (evaluatedOpp, clientName) => {
  if (!openai) throw new Error("OpenAI API Key is missing.");

  const promptStr = `
You are a Senior AI Implementation Consultant at Finivis.
Provide a detailed "Pre-Automation Readiness Schedule" for this specific AI opportunity:
${JSON.stringify(evaluatedOpp, null, 2)}

Client: ${clientName}

The goal is to list exactly what the CLIENT must do and prepare BEFORE Finivis starts the automation build.

Respond ONLY with a JSON object:
{
  "scheduleTitle": "e.g. Data & Process Readiness Roadmap",
  "clientExecutiveSummary": "1-2 sentence overview of why these steps are critical for success.",
  "preAutomationTasks": [
    { 
      "task": "e.g. Centralize Invoice PDFs", 
      "owner": "e.g. Finance IT Team", 
      "importance": "Critical",
      "description": "Why this is needed and what the ideal state looks like." 
    },
    { "task": "...", "owner": "...", "importance": "...", "description": "..." }
  ],
  "dataRequirements": [
     "Specific dataset 1 (e.g. 500+ historical invoices)",
     "Specific access 2 (e.g. Read-only API access to ERP)"
  ],
  "stakeholderChecklist": [
     "Identify Business Process Owner",
     "Assign technical point of contact"
  ]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI Implementation Expert. Output pure JSON." },
        { role: "user", content: promptStr }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error("Failed to generate readiness schedule:", err);
    throw err;
  }
};

