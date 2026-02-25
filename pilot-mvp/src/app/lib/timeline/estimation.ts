/**
 * Timeline estimation service for permits
 * Uses LLM to estimate processing times based on permit details
 */

import type { IPermitManagement } from '../permits/managementSchema';
import type { IPermit } from '../permits/schema';

export interface TimelineEstimate {
  estimatedDays: number;
  estimatedStartDate?: Date;
  estimatedCompletionDate: Date;
  confidence: 'low' | 'medium' | 'high';
  reasoning?: string;
  factors?: string[];
}

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Estimates permit processing timeline using LLM
 */
export async function estimatePermitTimeline(
  permitManagement: IPermitManagement,
  permitCatalog?: IPermit | null,
  clientInfo?: { businessName?: string; jurisdiction?: string } | null
): Promise<TimelineEstimate> {
  console.log(`[Timeline Estimation] Estimating for permit: ${permitManagement.name}, status: ${permitManagement.status}`);
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log(`[Timeline Estimation] No OpenAI API key, using fallback estimation`);
    // Fallback to rule-based estimation if no API key
    return estimateTimelineFallback(permitManagement);
  }

  try {
    // Build context about the permit
    const context = buildPermitContext(permitManagement, permitCatalog);
    
    const systemPrompt = `You are an expert in Canadian government permit processing timelines. Your task is to provide REALISTIC, SPECIFIC estimates for how long it takes government authorities to process permits.

You have knowledge of:
- Actual processing times for different permit types across Canadian jurisdictions
- How complexity, jurisdiction, and permit type affect processing times
- Typical government review cycles and approval timelines
- Real-world processing times based on permit characteristics

Be SPECIFIC and REALISTIC. Base estimates on actual government processing times, not generic ranges.`;

    const userPrompt = `I need you to estimate the ACTUAL government processing time for this specific permit:

${context}
${clientInfo ? `\nClient Information:\nBusiness: ${clientInfo.businessName || 'N/A'}\nJurisdiction: ${clientInfo.jurisdiction || 'N/A'}` : ''}

CRITICAL REQUIREMENTS:
1. Research and provide SPECIFIC processing times for THIS EXACT permit type in THIS jurisdiction
2. Consider the permit's complexity level, authority level (municipal/provincial/federal), and specific characteristics
3. Account for AI-assisted form filling (reduces application prep to 1-3 days vs weeks manually)
4. The MAIN variable is GOVERNMENT PROCESSING TIME - how long the government takes to review and approve

BREAKDOWN:
- Application prep with AI: 1-3 days (already optimized)
- Government processing: [YOUR SPECIFIC ESTIMATE based on permit type and jurisdiction]
- Total = prep + processing

Provide a JSON response with:
- estimatedDays: number (TOTAL days: AI prep time + government processing time)
- confidence: "low" | "medium" | "high"
- reasoning: string (MUST include: "AI prep: X days" + "Government processing: Y days" + specific factors for THIS permit)
- factors: string[] (specific factors like "Municipal permit in [city]", "High complexity", "Requires inspection", etc.)

IMPORTANT: Give DIFFERENT estimates for different permit types. A "Business License" should have a different timeline than a "Liquor Sales License" or "Fire Safety Inspection". Base your estimate on the ACTUAL permit type and its typical processing time in Canadian jurisdictions.`;

    console.log(`[Timeline LLM] Calling OpenAI with model: ${MODEL}`);
    console.log(`[Timeline LLM] Permit: ${permitManagement.name}, Context length: ${userPrompt.length} chars`);

    const response = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`OpenAI request failed (${response.status}): ${text.slice(0, 300)}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    console.log(`[Timeline LLM] Got response from OpenAI`);

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('[Timeline] Failed to parse JSON response:', content);
      return estimateTimelineFallback(permitManagement);
    }

    // Validate and normalize response
    const estimatedDays = Math.max(1, Math.round(parsed.estimatedDays || 30));
    const confidence = ['low', 'medium', 'high'].includes(parsed.confidence) 
      ? parsed.confidence 
      : 'medium';

    console.log(`[Timeline LLM] Parsed estimate: ${estimatedDays} days, confidence: ${confidence}`);
    console.log(`[Timeline LLM] Reasoning: ${parsed.reasoning}`);
    console.log(`[Timeline LLM] Factors: ${Array.isArray(parsed.factors) ? parsed.factors.join(', ') : 'N/A'}`);

    const now = new Date();
    const estimatedCompletionDate = new Date(now);
    estimatedCompletionDate.setDate(now.getDate() + estimatedDays);

    return {
      estimatedDays,
      estimatedCompletionDate,
      confidence,
      reasoning: parsed.reasoning || `Estimated ${estimatedDays} days based on permit characteristics`,
      factors: Array.isArray(parsed.factors) ? parsed.factors : [],
    };
  } catch (error) {
    console.error('[Timeline] LLM estimation failed:', error);
    return estimateTimelineFallback(permitManagement);
  }
}

/**
 * Fallback estimation using rule-based logic
 * Accounts for AI form-filler speeding up application prep
 */
function estimateTimelineFallback(permitManagement: IPermitManagement): TimelineEstimate {
  // AI form-filler reduces application prep to 1-3 days
  const aiPrepDays = 2; // Average with AI assistance
  
  // Government processing time (main variable)
  let governmentProcessingDays = 30; // Default 30 days

  // Adjust based on complexity
  if (permitManagement.complexity === 'high') {
    governmentProcessingDays = 60;
  } else if (permitManagement.complexity === 'low') {
    governmentProcessingDays = 21;
  }

  // Adjust based on category/level (if available)
  if (permitManagement.category === 'Federal') {
    governmentProcessingDays = Math.max(governmentProcessingDays, 56); // 8 weeks
  } else if (permitManagement.category === 'Municipal') {
    governmentProcessingDays = Math.min(governmentProcessingDays, 28); // 4 weeks
  } else if (permitManagement.category === 'Provincial') {
    governmentProcessingDays = Math.max(governmentProcessingDays, 42); // 6 weeks
  }

  // Permit-type specific adjustments to avoid flat estimates and better reflect reality.
  const permitName = (permitManagement.name || '').toLowerCase();
  if (permitName.includes('liquor') || permitName.includes('alcohol')) {
    governmentProcessingDays += 14;
  } else if (permitName.includes('fire') || permitName.includes('inspection')) {
    governmentProcessingDays += 7;
  } else if (permitName.includes('health') || permitName.includes('food')) {
    governmentProcessingDays += 5;
  } else if (permitName.includes('business license')) {
    governmentProcessingDays -= 5;
  }

  // Adjust based on status
  let totalDays = aiPrepDays + governmentProcessingDays;
  
  if (permitManagement.status === 'submitted') {
    // Already submitted, estimate remaining processing time only
    totalDays = Math.max(7, governmentProcessingDays * 0.6); // ~60% remaining
  } else if (permitManagement.status === 'action-required') {
    // Delays expected, add buffer
    totalDays = aiPrepDays + (governmentProcessingDays * 1.5);
  } else if (permitManagement.status === 'not-started') {
    // Full timeline: prep + processing
    totalDays = aiPrepDays + governmentProcessingDays;
  } else if (permitManagement.status === 'in-progress') {
    // Partially through prep, estimate remaining
    totalDays = (aiPrepDays * 0.5) + governmentProcessingDays;
  }

  const now = new Date();
  const estimatedCompletionDate = new Date(now);
  estimatedCompletionDate.setDate(now.getDate() + totalDays);

  console.log(`[Timeline Fallback] Estimated ${totalDays} days for ${permitManagement.name} (${permitManagement.status})`);
  
  return {
    estimatedDays: totalDays,
    estimatedCompletionDate,
    confidence: 'medium',
    reasoning: `AI-assisted application prep (~${aiPrepDays} days) + government processing (~${governmentProcessingDays} days)`,
    factors: [
      `Complexity: ${permitManagement.complexity}`,
      `Status: ${permitManagement.status}`,
      permitManagement.category ? `Category: ${permitManagement.category}` : undefined,
      'AI form-filler accelerates application prep',
    ].filter(Boolean) as string[],
  };
}

/**
 * Builds context string about the permit for LLM
 */
function buildPermitContext(
  permitManagement: IPermitManagement,
  permitCatalog?: IPermit | null
): string {
  const parts: string[] = [];

  parts.push(`PERMIT DETAILS:`);
  parts.push(`Name: ${permitManagement.name}`);
  parts.push(`Authority: ${permitManagement.authority}`);
  if (permitManagement.municipality) {
    parts.push(`Municipality: ${permitManagement.municipality}`);
  }
  parts.push(`Complexity Level: ${permitManagement.complexity}`);
  parts.push(`Current Status: ${permitManagement.status}`);
  if (permitManagement.category) {
    parts.push(`Category/Level: ${permitManagement.category}`);
  }
  if (permitManagement.description) {
    parts.push(`Description: ${permitManagement.description}`);
  }
  if (permitManagement.purpose) {
    parts.push(`Purpose: ${permitManagement.purpose}`);
  }
  if (permitManagement.requirements && permitManagement.requirements.length > 0) {
    parts.push(`Requirements: ${permitManagement.requirements.join(', ')}`);
  }

  // Add catalog permit info if available (more detailed)
  if (permitCatalog) {
    parts.push(`\nPERMIT CATALOG INFORMATION:`);
    parts.push(`Level: ${permitCatalog.level} (${permitCatalog.level === 'municipal' ? 'Municipal' : permitCatalog.level === 'provincial' ? 'Provincial' : 'Federal'})`);
    parts.push(`Jurisdiction: ${permitCatalog.jurisdiction.province}${permitCatalog.jurisdiction.city ? `, ${permitCatalog.jurisdiction.city}` : ''}`);
    if (permitCatalog.prerequisites) {
      parts.push(`Prerequisites: ${permitCatalog.prerequisites}`);
    }
    if (permitCatalog.businessTypes && permitCatalog.businessTypes.length > 0) {
      parts.push(`Business Types: ${permitCatalog.businessTypes.join(', ')}`);
    }
    if (permitCatalog.activities && permitCatalog.activities.length > 0) {
      parts.push(`Activities: ${permitCatalog.activities.join(', ')}`);
    }
  }

  if (permitManagement.lastActivity) {
    parts.push(`\nLast Activity: ${permitManagement.lastActivity}`);
  }

  return parts.join('\n');
}

/**
 * Updates timeline based on status changes and processing delays
 */
export function updateTimelineForStatusChange(
  permitManagement: IPermitManagement,
  newStatus: string,
  delayDays: number = 0
): Partial<IPermitManagement['timeline']> {
  const timeline = permitManagement.timeline || {};
  const now = new Date();

  // Update status history
  const statusHistory = timeline.statusHistory || [];
  statusHistory.push({
    status: newStatus,
    date: now,
  });

  // Calculate delays
  let processingDelays = timeline.processingDelays || 0;
  if (delayDays > 0) {
    processingDelays += delayDays;
  }

  // Update current estimated days if there are delays
  let currentEstimatedDays = timeline.currentEstimatedDays || timeline.initialEstimatedDays || 30;
  if (processingDelays > 0) {
    currentEstimatedDays += processingDelays;
  }

  // Update estimated completion date
  let baseDate = timeline.actualStartDate || timeline.estimatedStartDate || now;
  const currentEstimatedCompletionDate = new Date(baseDate);
  currentEstimatedCompletionDate.setDate(baseDate.getDate() + currentEstimatedDays);

  // Set actual dates based on status
  let actualStartDate = timeline.actualStartDate;
  let actualCompletionDate = timeline.actualCompletionDate;

  if (newStatus === 'in-progress' && !actualStartDate) {
    actualStartDate = now;
  } else if (newStatus === 'approved' && !actualCompletionDate) {
    actualCompletionDate = now;
  }

  return {
    ...timeline,
    currentEstimatedDays,
    currentEstimatedCompletionDate,
    processingDelays,
    statusHistory,
    lastUpdated: now,
    actualStartDate,
    actualCompletionDate,
  };
}
