import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

let openai;
if (apiKey && apiKey !== 'your_openai_api_key_here') {
  openai = new OpenAI({ 
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Allowed for demo purposes
  });
}

export const analyzeOpportunities = async (opportunities, scores, clientName) => {
  if (!openai) {
    throw new Error("OpenAI API Key is missing or invalid. Please check your .env file.");
  }

  const promptStr = `
You are a Senior AI Strategist at Finivis, a top-tier technology consulting firm.
Your job is to analyze the following business processes evaluated under a Data x Value x Feasibility (DVF) framework for the client "${clientName}".

Raw Opportunity Data:
${JSON.stringify(opportunities, null, 2)}

Calculated Scores:
${JSON.stringify(scores, null, 2)}

Respond ONLY with a valid JSON object matching exactly this structure, with no markdown formatting around it:
{
  "executiveSummary": "A 2-4 sentence summary of the client's current automation opportunities and overall maturity.",
  "topRecommendation": {
    "opportunityName": "Name of the best process to tackle first",
    "rationale": "Why this is the strategic priority (max 2 sentences)"
  },
  "riskProfile": "Identified systemic risks based on data availability and system complexity across the board.",
  "suggestedTechStack": ["Technology 1", "Technology 2", "Technology 3"],
  "scopeOfWork": {
    "title": "A professional title for the consulting engagement",
    "duration": "Estimated timeframe (e.g. 6-8 Weeks)",
    "estimatedHours": "Total estimated consulting hours",
    "phases": [
      { 
        "name": "Phase 1: Discovery & Architecture (Weeks 1-2)", 
        "description": "A detailed 2-3 sentence paragraph explaining exactly what the Finivis consulting team will do during this phase, who they will speak with, and what systems they will audit.",
        "deliverables": [
          "Detailed Current State Process Map", 
          "Data Architecture & Security Gap Analysis",
          "Technical Requirements Document (TRD)"
        ] 
      },
      { 
        "name": "Phase 2: MVP Development (Weeks 3-5)", 
        "description": "A detailed 2-3 sentence paragraph explaining the build process for the top recommended automation, including integration points and testing methodology.",
        "deliverables": [
          "Functional MVP Automation Script/Integration", 
          "UAT Test Scripts & Results",
          "Initial End-User Documentation"
        ] 
      },
      { 
        "name": "Phase 3: Training & Handover (Week 6)", 
        "description": "A detailed paragraph explaining how Finivis will ensure the client's team adopts the new technology, including active support and governance guardrails.",
        "deliverables": [
          "Standard Operating Procedure (SOP) Manual", 
          "Governance & Maintenance Guide",
          "2x Recorded Training Sessions"
        ] 
      }
    ],
    "assumptions": [
      "Assumption 1 (e.g., Client provides API access within 48 hours)",
      "Assumption 2"
    ],
    "outOfScope": [
      "Out of scope 1 (e.g., Third-party software licensing)",
      "Out of scope 2"
    ],
    "acceptanceCriteria": "A strict sentence defining how deliverables receive final sign-off."
  },
  "draftEmail": {
    "subject": "Strategic Analysis: Next Steps for AI Implementation",
    "body": "A professional, consultative email body (use \n for line breaks) summarizing the analysis, praising their forward-thinking, and pitching the SOW for our next sync. Do NOT use placeholders like [Your Name], use 'The Finivis Team'."
  },
  "internalNextSteps": [
    "Pull case study for similar industry implementation",
    "Schedule technical architect review of current CRM",
    "Draft pricing proposal for Phase 1 MVP"
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
