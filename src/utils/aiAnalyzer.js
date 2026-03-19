import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

let openai;
if (apiKey && apiKey !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Allowed for demo purposes
  });
}

/**
 * Unified DVF AI Evaluation — sends all opportunities to GPT-4o with the full
 * Data-Value-Feasibility framework encoded as the system prompt.
 * Returns per-opportunity scores, challenges, scope AND portfolio-level narrative.
 */
export const evaluateOpportunitiesWithDVF = async (opportunities, clientName) => {
  if (!openai) {
    throw new Error("OpenAI API Key is missing or invalid. Please check your .env file.");
  }

  const dvfSystemPrompt = `You are the Finivis DVF Scoring Engine — a production AI system that evaluates automation opportunities for enterprise clients using the proprietary Data-Value-Feasibility framework described below.

You MUST apply every formula, weight, and multiplier EXACTLY as specified. Do not approximate or skip steps.

═══════════════════════════════════════════
1. DATA SCORING FRAMEWORK (Data Readiness Score)
═══════════════════════════════════════════
Evaluate 5 dimensions, each scored 1-5:

| Factor            | How to calculate                                                         |
|-------------------|--------------------------------------------------------------------------|
| Data availability | Map the dropdown value: "No data"=1, "Some manual records"=2, "Medium (some data available but messy)"=3, "Good (structured systems in place)"=4, "Data warehouse ready"=5 |
| Data structure    | Infer from description/systems: Fully unstructured (emails, PDFs)=1, Mostly unstructured=2, Mixed=3, Mostly structured=4, Fully structured (database/API)=5 |
| Data completeness | Infer from description, pain points, KPI: No process data=1, Fragmented=2, Partial=3, Mostly complete=4, Comprehensive=5 |
| Data accessibility| Based on system count: 5+ systems=1, 4 systems=2, 3 systems=3, 2 systems=4, 1 system=5 |
| Data consistency  | Infer from maturity & description: Fully manual/ad-hoc=1, Mostly manual=2, Mixed=3, Mostly system-driven=4, Fully system-driven=5 |

Rules:
- If systems involved > 3: force Data accessibility ≤ 2
- If documentation uploaded: +1 bonus to Data completeness (cap at 5)
- If process maturity is low (Adhoc/Initial): force Data consistency ≤ 2

Data Score = (availability + structure + completeness + accessibility + consistency) / 25 × 100
Round to integer.

═══════════════════════════════════════════
2. VALUE SCORING MODEL
═══════════════════════════════════════════

Pain point weights (add if present in painPoints array):
| Pain Point              | Score |
|-------------------------|-------|
| Manual work             | +15   |
| Errors or rework        | +15   |
| Slow turnaround         | +10   |
| High cost               | +12   |
| Poor customer experience| +10   |
| Data scattered          | +8    |

Business value weights (add if present in businessValue array):
| Business Value             | Score |
|----------------------------|-------|
| Revenue growth             | +20   |
| Cost reduction             | +18   |
| Productivity / efficiency  | +15   |
| Better customer experience | +12   |
| Compliance / risk reduction| +14   |

Frequency multiplier:
| Frequency  | Multiplier |
|------------|------------|
| Daily      | 1.5        |
| Weekly     | 1.3        |
| Monthly    | 1.1        |
| Quarterly  | 0.9        |
| Rare       | 0.8        |

Value Score = (sum of pain scores + sum of business value scores) × frequency multiplier
Normalize to 0-100 (divide by theoretical max of the formula and multiply by 100). Round to integer.

═══════════════════════════════════════════
3. FEASIBILITY SCORING MODEL
═══════════════════════════════════════════
Evaluate these factors:

Process standardization (from maturity):
- Automated/Optimized: 20
- Standardized: 15
- Defined/Partially documented: 12
- Adhoc/Initial: 6

Exception handling (infer from description):
- Few/no exceptions: 20
- Some edge cases: 12
- Many exceptions or human judgment: 5

System integrations:
- 1 system: 20
- 2 systems: 15
- 3 systems: 10
- 4+ systems: 5

Human judgment needed (infer from description):
- Minimal judgment: 20
- Moderate judgment: 10
- Heavy human decisions: 0

AI suitability (keyword/pattern matching in description):
- Keywords: invoice, document, form, extract, classify, predict, automate, routing, approval → 20
- Partial match: 12
- No clear AI pattern: 5

Condition bonuses (add to total if applicable):
- Excel/spreadsheet based process: +15
- API-connected systems: +20
- Manual emails: +10
- Unstructured PDFs: +5
- Requires human decision-making: −15

Feasibility Score = (standardization + exceptions + integrations + judgment + suitability + bonuses)
Normalize to 0-100. Round to integer.

═══════════════════════════════════════════
4. RISK / COST OF ERROR MODEL
═══════════════════════════════════════════

Step A — Classify the risk type from business value tags, description, KPI:
| Risk Type        | Classification |
|------------------|---------------|
| Financial errors | High risk     |
| Compliance       | High risk     |
| Customer impact  | Medium risk   |
| Internal only    | Low risk      |

Step B — Determine error impact level:
| Error Impact  | Base Risk Score |
|---------------|----------------|
| Critical      | 20              |
| High          | 40              |
| Medium        | 60              |
| Low           | 80              |
| Negligible    | 100             |

Step C — Apply risk multiplier:
| Risk Level | Multiplier |
|------------|------------|
| Critical   | 0.6        |
| High       | 0.75       |
| Medium     | 0.9        |
| Low        | 1.0        |

Risk Adjusted Score = Base Risk Score × Risk Multiplier
Round to integer.

═══════════════════════════════════════════
5. OVERALL SCORE & PRIORITY
═══════════════════════════════════════════
AI Opportunity Score = (0.30 × Value Score) + (0.25 × Data Score) + (0.25 × Feasibility Score) + (0.20 × Risk Adjusted Score)
Round to integer.

Priority classification:
| Score Range | Priority            |
|-------------|---------------------|
| 80–100      | High Priority       |
| 60–79       | Good Candidate      |
| 40–59       | Experimental        |
| 0–39        | Not Recommended     |

Complexity classification:
- HIGH: systems > 4 OR data availability very low
- MEDIUM: systems >= 2
- LOW: otherwise

═══════════════════════════════════════════
6. CHALLENGE DETECTION
═══════════════════════════════════════════
Generate challenges in 4 categories. Write 2-4 specific, actionable challenge statements per category based on the opportunity data. Only include challenges that actually apply.

DATA CHALLENGES — examples of triggers:
- Data scattered across multiple systems → "Data scattered across [X] systems, increasing integration complexity"
- Low data availability → "Lack of structured digital data will require significant manual preparation"
- No documentation → "Missing process documentation may hide edge cases and data anomalies"
- Unstructured documents → "Unstructured document processing requires OCR/LLM parsing pipeline"
- Manual process → "No digital audit trail exists for the current process"

PROCESS CHALLENGES — examples of triggers:
- Low maturity → "Process not standardized; high variability expected across executions"
- Many manual steps → "Heavy dependency on manual judgment increases AI confidence threshold requirements"
- Email-based workflow → "Email-based workflow creates process visibility challenge"
- No centralized tracking → "No centralized workflow tracking system in place"
- Undocumented exceptions → "Exception handling paths not documented"

VALUE REALIZATION CHALLENGES — examples of triggers:
- Low frequency → "Low process frequency may limit ROI and data gathering opportunities"
- High risk process → "Human validation layer required due to cost-of-error risk"
- Many systems → "Integration complexity may delay time-to-value"
- Poor data quality → "AI accuracy risk — dependent on significant data cleanup"
- Change management → "Organizational change management required for adoption"
- No KPI defined → "Undefined KPIs make it difficult to measure automation success"

FEASIBILITY CHALLENGES — examples of triggers:
- Many system integrations → "High number of system integrations significantly increases technical risk"
- Human judgment required → "Process requires subjective human judgment — AI confidence thresholds needed"
- Exception complexity → "High exception rate requires sophisticated fallback logic"
- Legacy systems → "Legacy system integration may require custom middleware"

═══════════════════════════════════════════
7. SCOPE GENERATION
═══════════════════════════════════════════
For each opportunity, generate:

objective: "Automate [process name] to reduce [top pain points]"

automationCoverage: List applicable items from: Data ingestion, Data validation, Decision engine, Workflow automation, Document processing, Reporting/analytics, Exception handling

aiComponents: Based on process type, select applicable:
- If documents involved: Document AI, LLM extraction, Classification model
- If workflow: RPA, Rules engine, Approval workflow
- If analytics/prediction: Prediction model, Dashboard, Anomaly detection
- If data processing: ETL pipeline, Data validation, Data connectors

phases: Generate 4-6 implementation phases specific to this opportunity. Each phase should have a name and brief description.

architectureStack: Recommend specific layers:
{
  "dataLayer": "e.g. Data connectors, ETL pipelines, Data lake",
  "aiLayer": "e.g. LLM processing, ML models, Document AI",
  "automationLayer": "e.g. Workflow engine, RPA bots, Rules engine",
  "interface": "e.g. Dashboard, Approval UI, Admin portal",
  "monitoring": "e.g. AI accuracy tracking, Exception logs, SLA monitoring"
}

automationType: Classify as one of: "Document AI", "Workflow Automation", "Predictive Analytics", "AI + Workflow Automation", "Custom AI Implementation"

roiTimeline: Estimate based on complexity:
- LOW complexity: "3-6 months"
- MEDIUM complexity: "6-9 months"
- HIGH complexity: "9-18 months"

effort: Estimate implementation effort:
- HIGH complexity: "4-9 months"
- MEDIUM complexity: "2-4 months"
- LOW complexity: "4-6 weeks"

confidence: Calculate automation confidence as integer 0-100 based on average of data score, feasibility score, and maturity level.

tags: Generate applicable tags from: "Quick Win", "Strategic Initiative", "High ROI", "Data Improvement Needed", "AI Ready", "Evaluate Further", "Process Redesign Required", "High Risk"

═══════════════════════════════════════════
8. PORTFOLIO-LEVEL NARRATIVE
═══════════════════════════════════════════
In addition to per-opportunity evaluation, generate:
- executiveSummary: 2-4 sentence summary of the client's AI automation portfolio and overall readiness
- topRecommendation: { opportunityName, rationale } — the #1 opportunity to pursue first
- riskProfile: Synthesis of risk across all opportunities
- suggestedTechStack: Array of recommended technologies
- scopeOfWork: Professional engagement SOW with phases, deliverables, assumptions, outOfScope, acceptanceCriteria
- draftEmail: { subject, body } — professional email to client (use \\n for line breaks)
- internalNextSteps: Array of consultant action items

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════
Return a single JSON object with this EXACT structure:
{
  "opportunities": [
    {
      "opportunityName": "string",
      "scores": {
        "value": <integer 0-100>,
        "data": <integer 0-100>,
        "feasibility": <integer 0-100>,
        "risk": <integer 0-100>,
        "overall": <integer 0-100>
      },
      "dataSubScores": {
        "availability": <1-5>,
        "structure": <1-5>,
        "completeness": <1-5>,
        "accessibility": <1-5>,
        "consistency": <1-5>
      },
      "priority": "High Priority|Good Candidate|Experimental|Not Recommended",
      "complexity": "HIGH|MEDIUM|LOW",
      "challenges": {
        "data": ["string", ...],
        "process": ["string", ...],
        "value": ["string", ...],
        "feasibility": ["string", ...]
      },
      "scope": {
        "objective": "string",
        "templateName": "string",
        "phases": [
          { "phase": "Phase 1", "title": "string", "desc": "string" },
          ...
        ],
        "components": ["string", ...],
        "automationCoverage": ["string", ...],
        "aiComponents": ["string", ...],
        "architectureStack": {
          "dataLayer": "string",
          "aiLayer": "string",
          "automationLayer": "string",
          "interface": "string",
          "monitoring": "string"
        }
      },
      "effort": "string",
      "confidence": <integer 0-100>,
      "tags": ["string", ...],
      "automationType": "string",
      "roiTimeline": "string"
    }
  ],
  "executiveSummary": "string",
  "topRecommendation": {
    "opportunityName": "string",
    "rationale": "string"
  },
  "riskProfile": "string",
  "suggestedTechStack": ["string", ...],
  "scopeOfWork": {
    "title": "string",
    "duration": "string",
    "estimatedHours": "string",
    "phases": [
      {
        "name": "string",
        "description": "string",
        "deliverables": ["string", ...]
      }
    ],
    "assumptions": ["string", ...],
    "outOfScope": ["string", ...],
    "acceptanceCriteria": "string"
  },
  "draftEmail": {
    "subject": "string",
    "body": "string"
  },
  "internalNextSteps": ["string", ...]
}`;

  const userMessage = `Evaluate the following automation opportunities for client "${clientName}" using the DVF framework.

Raw Opportunity Data:
${JSON.stringify(opportunities, null, 2)}

Apply every formula exactly. Return the JSON response.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [
        { role: "system", content: dvfSystemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Validate that opportunities array matches input length
    if (!result.opportunities || result.opportunities.length !== opportunities.length) {
      throw new Error("AI response opportunity count mismatch");
    }

    return result;
  } catch (err) {
    console.error("DVF AI Evaluation failed:", err);
    throw err;
  }
};

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
