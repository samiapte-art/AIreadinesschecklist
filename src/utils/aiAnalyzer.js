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
Opportunity Tracker Score = (0.30 × Value Score) + (0.25 × Data Score) + (0.25 × Feasibility Score) + (0.20 × Risk Adjusted Score)
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

decision: {
  "verdict": "Approved" or "Not Considered",
  "reasoning": "2-3 sentence explanation of why this decision was made, referencing specific scores and checklist inputs",
  "criteriaChecklist": [
    { "criterion": "Data Readiness", "met": true/false, "detail": "explanation" },
    { "criterion": "Business Value", "met": true/false, "detail": "explanation" },
    { "criterion": "Technical Feasibility", "met": true/false, "detail": "explanation" },
    { "criterion": "Risk Tolerance", "met": true/false, "detail": "explanation" },
    { "criterion": "Process Maturity", "met": true/false, "detail": "explanation" }
  ]
}
Rules for decision:
- Overall score >= 55 → "Approved"
- Overall score < 55 → "Not Considered"
- For "Not Considered": reasoning MUST reference specific checklist inputs that led to the low score
- For "Approved": reasoning should highlight strengths and note any conditions

alternativeRecommendation: If a better, more efficient, or more scalable solution approach exists for what the client is trying to achieve, include:
{
  "approach": "Description of the alternative approach",
  "rationale": "Why it is a stronger fit",
  "relationship": "replaces" or "complements"
}
If no alternative exists, set to null.

missingFields: Array of { "field": "field_name", "impact": "how this missing data affects the evaluation" } for any checklist fields that were empty or not provided. If all fields are filled, return empty array.

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
- notConsideredSummary: If ANY opportunities were marked "Not Considered", generate:
  {
    "count": number of not-considered opportunities,
    "overallReason": "Brief synthesis of why these opportunities didn't qualify",
    "pathToReconsideration": "What the client could change or improve to make these viable"
  }
  If all opportunities are approved, set to null.

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
      "roiTimeline": "string",
      "decision": {
        "verdict": "Approved|Not Considered",
        "reasoning": "string",
        "criteriaChecklist": [
          { "criterion": "string", "met": true, "detail": "string" }
        ]
      },
      "alternativeRecommendation": {
        "approach": "string",
        "rationale": "string",
        "relationship": "replaces|complements"
      },
      "missingFields": [{ "field": "string", "impact": "string" }]
    }
  ],
  "executiveSummary": "string",
  "topRecommendation": {
    "opportunityName": "string",
    "rationale": "string"
  },
  "riskProfile": "string",
  "suggestedTechStack": ["string", ...],
  "notConsideredSummary": {
    "count": 0,
    "overallReason": "string",
    "pathToReconsideration": "string"
  },
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
 * ═══════════════════════════════════════════════════════════════
 * DEDICATED PROMPT CHAIN — Quality-First Approach
 * ═══════════════════════════════════════════════════════════════
 * Instead of one monolithic prompt, we use 3 focused prompts:
 *   1. getDocumentChecklist() — Exact documents needed from client
 *   2. getClientReadinessTasks() — Pre-automation prep + requirements
 *   3. getKickoffReadiness() — Blockers, outstanding items, timeline
 * Each prompt is laser-focused on its specific job for maximum quality.
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * PROMPT 1: Document Checklist
 * Generates an exact, opportunity-specific list of documents needed from the client.
 * This prompt is deliberately narrow — it ONLY thinks about documents.
 */
export const getDocumentChecklist = async (evaluatedOpp, clientName) => {
  if (!openai) throw new Error("OpenAI API Key is missing.");

  const prompt = `
You are a Senior AI Implementation Consultant at Finivis, preparing for a new automation project.
You are about to kick off this project and need to create a COMPREHENSIVE document request list for the client.

═══════════════════════════════════════════
YOUR SINGLE JOB: List every EXACT document you need from the client.
═══════════════════════════════════════════

Client: ${clientName}
Opportunity: ${evaluatedOpp.opportunityName || evaluatedOpp.name}
Description: ${evaluatedOpp.description || 'N/A'}
Pain Points: ${JSON.stringify(evaluatedOpp.painPoints || [])}
Systems Involved: ${evaluatedOpp.systems || 'N/A'}
Current Data Availability: ${evaluatedOpp.dataAvailability || 'N/A'}
Process Maturity: ${evaluatedOpp.maturity || 'N/A'}
Desired Future State: ${evaluatedOpp.futureState || 'N/A'}
KPI: ${evaluatedOpp.kpi || 'N/A'}
AI Components Planned: ${JSON.stringify(evaluatedOpp.scope?.aiComponents || [])}
Architecture Stack: ${JSON.stringify(evaluatedOpp.scope?.architectureStack || {})}

Think step by step:
1. What does the AI model need to LEARN from? → Sample data files
2. What reference data does the system need to LOOK UP? → Catalogs, price lists, master data
3. What TEMPLATES does the client currently use that we need to replicate? → Output templates
4. What BUSINESS RULES govern this process? → Decision criteria, approval thresholds, exception rules
5. What PROCESS documentation exists? → SOPs, workflow diagrams, training materials
6. What HISTORICAL OUTPUT can we use as ground truth? → Past completed work samples
7. What COMPLIANCE or regulatory requirements apply? → Industry standards, legal requirements
8. What SYSTEM documentation do we need? → API docs, database schemas, export guides
9. What STAKEHOLDER information is needed? → Org charts, RACI matrices, contact lists

For EACH document, provide:
- The EXACT name a consultant would use when requesting it from the client
- The expected file format
- The category it belongs to
- WHY specifically this document is needed for THIS project (not generic reasons)
- What the document should contain
- How many/how much is needed
- Priority level

DO NOT generate generic documents like "Process Documentation" or "Data Files".
Instead be SPECIFIC: "Invoice Processing SOP with Exception Handling Rules" or "SAP Purchase Order Export (last 12 months, CSV format)"

Respond ONLY with a JSON object:
{
  "documentChecklist": [
    {
      "documentName": "Exact name of the document",
      "format": "PDF/Excel/CSV/DWG/etc.",
      "category": "Sample Data|Reference Data|Business Logic|Process Documentation|Historical Output|Compliance|System Documentation|Stakeholder Info",
      "reason": "Specific reason why THIS document is needed for THIS project",
      "exampleDescription": "What this document should contain — be specific",
      "quantity": "e.g. 10-20 samples, or 12 months of history, or 1 master document",
      "priority": "Critical|High|Medium"
    }
  ]
}

Generate at least 8-15 documents. Be thorough — missing a critical document at project start causes delays.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert AI implementation consultant. Your ONLY job is to produce an exhaustive, opportunity-specific document checklist. Every document name must be specific enough that a client admin could search for it and find it. Output pure JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error("Failed to generate document checklist:", err);
    throw err;
  }
};

/**
 * PROMPT 2: Client Readiness Tasks & Requirements
 * Generates pre-automation preparation tasks, data requirements, access requirements,
 * and stakeholder checklist. Receives scope phases to avoid duplication.
 */
export const getClientReadinessTasks = async (evaluatedOpp, clientName, scopePhases = []) => {
  if (!openai) throw new Error("OpenAI API Key is missing.");

  const isNotConsidered = evaluatedOpp.decision?.verdict === 'Not Considered';

  const scopeDedup = scopePhases.length > 0 ? `
═══════════════════════════════════════════
CRITICAL — DUPLICATION PREVENTION
═══════════════════════════════════════════
These IMPLEMENTATION PHASES have already been planned. DO NOT repeat any of them as pre-automation tasks:
${scopePhases.map((p, i) => `  ${i + 1}. ${p.title || p.phase || p.name}: ${p.desc || p.description || ''}`).join('\n')}

Your tasks must be CLIENT-SIDE PREPARATION that happens BEFORE implementation begins.
Examples of valid pre-automation tasks: collecting data samples, provisioning system access,
identifying stakeholders, documenting business rules, cleaning existing data.
Examples of INVALID tasks (duplicated from scope): building AI models, system integration,
process documentation as a deliverable, deploying solutions.
═══════════════════════════════════════════` : '';

  const prompt = isNotConsidered ? `
You are a Senior AI Implementation Consultant at Finivis.
This opportunity was evaluated as "Not Considered" (score: ${evaluatedOpp.scores?.overall || 'N/A'}%).

Client: ${clientName}
Opportunity: ${evaluatedOpp.opportunityName || evaluatedOpp.name}
Description: ${evaluatedOpp.description || 'N/A'}
Scores: ${JSON.stringify(evaluatedOpp.scores || {})}
Challenges: ${JSON.stringify(evaluatedOpp.challenges || {})}
Decision: ${JSON.stringify(evaluatedOpp.decision || {})}

Generate a formal, professional response explaining why this opportunity is not being pursued,
and what the client could do to make it viable in the future.

Respond ONLY with a JSON object:
{
  "scheduleTitle": "Opportunity Tracker Assessment Summary",
  "clientExecutiveSummary": "1-2 sentence professional explanation of why this opportunity is not being pursued at this time.",
  "notConsideredDetails": {
    "formalJustification": "3-4 sentence professional, respectful explanation referencing specific checklist inputs and scores. Do not be dismissive — frame it as 'not yet ready' rather than 'rejected'.",
    "specificFailures": [
      { "area": "e.g. Data Readiness", "issue": "specific issue found", "checklistInput": "the actual client input that caused this" }
    ],
    "pathToReconsideration": [
      { "condition": "What needs to change", "description": "Detailed explanation of what the client should do", "priority": "Critical|High|Medium" }
    ],
    "scaledDownAlternative": "If a smaller version of this opportunity could work, describe it. Otherwise null."
  }
}
` : `
You are a Senior AI Implementation Consultant at Finivis, planning the pre-automation readiness phase.

═══════════════════════════════════════════
YOUR SINGLE JOB: List what the CLIENT must prepare before Finivis starts building.
═══════════════════════════════════════════

Client: ${clientName}
Opportunity: ${evaluatedOpp.opportunityName || evaluatedOpp.name}
Description: ${evaluatedOpp.description || 'N/A'}
Systems Involved: ${evaluatedOpp.systems || 'N/A'}
Current Data Availability: ${evaluatedOpp.dataAvailability || 'N/A'}
Process Maturity: ${evaluatedOpp.maturity || 'N/A'}
Pain Points: ${JSON.stringify(evaluatedOpp.painPoints || [])}
Challenges Identified: ${JSON.stringify(evaluatedOpp.challenges || {})}
KPI: ${evaluatedOpp.kpi || 'N/A'}
${scopeDedup}

Generate:
1. "preAutomationTasks" — Specific client-side preparation activities (NOT implementation work)
2. "dataRequirements" — Exact datasets/data access needed, with specific quantities and reasons
3. "accessRequirements" — System access, API keys, environments needed, with reasons
4. "stakeholderChecklist" — Specific roles and people who need to be identified/involved

Every item must reference THIS specific opportunity. No generic filler.

Respond ONLY with a JSON object:
{
  "scheduleTitle": "e.g. Pre-Automation Readiness Plan for [Opportunity Tracker Name]",
  "clientExecutiveSummary": "1-2 sentence overview of why these preparation steps are critical for THIS project.",
  "preAutomationTasks": [
    {
      "task": "Specific client-side action — NOT an implementation phase",
      "owner": "Specific team or role at the client",
      "importance": "Critical|High|Medium",
      "description": "Why this is needed for THIS project and what the ideal state looks like"
    }
  ],
  "dataRequirements": [
    {
      "item": "Specific dataset with quantity (e.g. '12 months of SAP purchase order exports')",
      "reason": "Why THIS data is specifically needed for the AI solution being built",
      "priority": "Critical|High|Medium"
    }
  ],
  "accessRequirements": [
    {
      "item": "Specific system access (e.g. 'Read-only SAP RFC/BAPI access to MM module')",
      "reason": "Why this access is needed and what it will be used for",
      "priority": "Critical|High|Medium"
    }
  ],
  "stakeholderChecklist": [
    {
      "role": "Specific role (e.g. 'AP Team Lead')",
      "reason": "Why this person is needed (e.g. 'Knows all exception handling rules for 3-way matching')",
      "involvement": "Discovery|Ongoing|Sign-off"
    }
  ]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `You are an AI implementation expert focused ONLY on client preparation. ${isNotConsidered ? 'Generate a professional Not Considered assessment.' : 'Every task and requirement must be specific to this exact opportunity — no generic items. Pre-automation tasks are CLIENT preparation, NOT implementation work.'} Output pure JSON.` },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error("Failed to generate readiness tasks:", err);
    throw err;
  }
};

/**
 * PROMPT 3: Kickoff Readiness Assessment
 * Synthesizes outputs from Prompt 1 & 2 to generate the final kickoff readiness report:
 * outstanding items, internal actions, blockers, and timeline.
 */
export const getKickoffReadiness = async (evaluatedOpp, clientName, documentChecklist, readinessTasks) => {
  if (!openai) throw new Error("OpenAI API Key is missing.");

  const prompt = `
You are a Senior AI Project Manager at Finivis, conducting a kickoff readiness assessment.
You have already gathered the document requirements and client preparation tasks.
Now synthesize everything into a final kickoff readiness report.

═══════════════════════════════════════════
YOUR SINGLE JOB: Assess kickoff readiness and identify what's still outstanding.
═══════════════════════════════════════════

Client: ${clientName}
Opportunity: ${evaluatedOpp.opportunityName || evaluatedOpp.name}
Description: ${evaluatedOpp.description || 'N/A'}
Overall Score: ${evaluatedOpp.scores?.overall || 'N/A'}%
Decision: ${evaluatedOpp.decision?.verdict || 'N/A'}
Challenges: ${JSON.stringify(evaluatedOpp.challenges || {})}

Documents Required (${documentChecklist?.length || 0} items):
${(documentChecklist || []).map((d, i) => `  ${i + 1}. [${d.priority}] ${d.documentName} (${d.format})`).join('\n')}

Client Preparation Tasks (${readinessTasks?.preAutomationTasks?.length || 0} items):
${(readinessTasks?.preAutomationTasks || []).map((t, i) => `  ${i + 1}. [${t.importance}] ${t.task} — Owner: ${t.owner}`).join('\n')}

Data Requirements: ${JSON.stringify(readinessTasks?.dataRequirements || [])}
Access Requirements: ${JSON.stringify(readinessTasks?.accessRequirements || [])}

Based on ALL of the above, generate a kickoff readiness assessment:

1. "outstandingClientItems" — Prioritized list of what the client MUST complete before kickoff
   (synthesize from documents + tasks + access needs)
2. "internalActions" — What Finivis must prepare internally before kickoff
3. "blockers" — Risks or dependencies that could delay the project
4. "suggestedTimeline" — Realistic timeline including requirements gathering, document collection, and project start

Respond ONLY with a JSON object:
{
  "kickoffReadiness": {
    "readinessScore": "Low|Medium|High",
    "readinessSummary": "1-2 sentence assessment of how ready this project is to kick off",
    "outstandingClientItems": [
      { "item": "Specific outstanding item", "status": "Pending", "owner": "Client team/role", "estimatedDays": 5 }
    ],
    "internalActions": [
      { "item": "Specific Finivis action", "status": "Pending", "owner": "Finivis role/team", "estimatedDays": 3 }
    ],
    "blockers": [
      { "blocker": "Specific risk or dependency", "severity": "High|Medium|Low", "mitigation": "How to resolve this", "impact": "What happens if not resolved" }
    ],
    "suggestedTimeline": "Detailed timeline (e.g. 'Weeks 1-2: Document collection and data provisioning. Week 3: Discovery workshops. Week 4: Project kickoff.')"
  }
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI project management expert. Synthesize the document requirements and readiness tasks into a comprehensive kickoff readiness assessment. Be specific about timelines and blockers. Output pure JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error("Failed to generate kickoff readiness:", err);
    throw err;
  }
};

/**
 * ORCHESTRATOR: Runs the 3-prompt chain sequentially and merges results.
 * This is the main entry point called by OpportunityDetailView.
 * @param {Object} evaluatedOpp - The evaluated opportunity
 * @param {string} clientName - Client name
 * @param {Array} scopePhases - Implementation scope phases (for dedup)
 * @param {Function} onProgress - Optional callback for progress updates
 */
export const getOpportunityPreReqs = async (evaluatedOpp, clientName, scopePhases = [], onProgress) => {
  const isNotConsidered = evaluatedOpp.decision?.verdict === 'Not Considered';

  // For Not Considered opportunities, only run the readiness tasks prompt (which handles the justification)
  if (isNotConsidered) {
    if (onProgress) onProgress('Generating assessment summary...');
    const readinessResult = await getClientReadinessTasks(evaluatedOpp, clientName, scopePhases);
    return {
      ...readinessResult,
      documentChecklist: [],
      kickoffReadiness: null
    };
  }

  // For Approved opportunities, run the full 3-prompt chain
  // Step 1: Document Checklist
  if (onProgress) onProgress('Analyzing required documents...');
  const docResult = await getDocumentChecklist(evaluatedOpp, clientName);

  // Step 2: Client Readiness Tasks
  if (onProgress) onProgress('Generating preparation tasks...');
  const readinessResult = await getClientReadinessTasks(evaluatedOpp, clientName, scopePhases);

  // Step 3: Kickoff Readiness (uses outputs from 1 & 2)
  if (onProgress) onProgress('Assessing kickoff readiness...');
  const kickoffResult = await getKickoffReadiness(evaluatedOpp, clientName, docResult.documentChecklist, readinessResult);

  // Merge all results into a single object (backward-compatible with existing UI)
  return {
    scheduleTitle: readinessResult.scheduleTitle || `Pre-Automation Readiness Plan for ${evaluatedOpp.opportunityName || evaluatedOpp.name}`,
    clientExecutiveSummary: readinessResult.clientExecutiveSummary,
    preAutomationTasks: readinessResult.preAutomationTasks || [],
    documentChecklist: docResult.documentChecklist || [],
    dataRequirements: readinessResult.dataRequirements || [],
    accessRequirements: readinessResult.accessRequirements || [],
    stakeholderChecklist: readinessResult.stakeholderChecklist || [],
    kickoffReadiness: kickoffResult.kickoffReadiness || null,
    // Keep documentRequirements for backward compat (map from documentChecklist)
    documentRequirements: (docResult.documentChecklist || []).map(d => ({
      item: `${d.documentName} (${d.format})`,
      reason: d.reason,
      priority: d.priority
    }))
  };
};
