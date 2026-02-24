import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Allow up to 60s for LLM call (Vercel Pro default)
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const SYSTEM_PROMPT = `You are a permit/licensing specialist. Given a permit name and its issuing authority, suggest the documents typically required to complete the application.

Return a JSON object only, no other text:
{
  "documents": [
    { "name": "Document Name", "description": "Brief description of what this document is and why it's needed" }
  ]
}

Rules:
- Return 0-8 documents. Only include documents commonly required for this permit type.
- Be specific to the permit and jurisdiction (e.g., "Floor plan with equipment layout" for food permits).
- If the permit is very generic or unknown, return 2-4 common documents.
- Never make up permit-specific details. Use general regulatory knowledge.
- Each description should be 1 short sentence.`;

export async function POST(request: NextRequest) {
  let permitName = '';
  let authority = '';
  let municipality = '';

  try {
    const body = await request.json();
    permitName = String(body.permitName || body.name || '').trim();
    authority = String(body.authority || body.department || '').trim();
    municipality = String(body.municipality || '').trim();

    if (!permitName) {
      return NextResponse.json(
        { error: 'permitName is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { documents: [] },
        { status: 200 }
      );
    }

    const userPrompt = `Permit: ${permitName}
Issuing Authority: ${authority || 'Unknown'}
Municipality/Location: ${municipality || 'Not specified'}

List the documents typically required. Return JSON only.`;

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ documents: [] }, { status: 200 });
    }

    const parsed = JSON.parse(content) as { documents?: Array<{ name?: string; description?: string }> };
    const documents = Array.isArray(parsed.documents)
      ? parsed.documents
          .filter((d) => d && typeof d.name === 'string' && d.name.trim())
          .map((d) => ({
            name: String(d.name).trim(),
            description: typeof d.description === 'string' ? d.description.trim() : '',
          }))
      : [];

    return NextResponse.json({ documents }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[required-documents] Error:', err);
    // If model invalid, timeout, or rate limit, try fallback model
    if ((msg.includes('model') || msg.includes('timeout') || msg.includes('rate')) && permitName) {
      try {
        const userPrompt = `Permit: ${permitName}\nIssuing Authority: ${authority || 'Unknown'}\nMunicipality: ${municipality || 'Not specified'}\n\nList the documents typically required. Return JSON only.`;
        const fallback = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 800,
        });
        const content = fallback.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as { documents?: Array<{ name?: string; description?: string }> };
          const docs = Array.isArray(parsed?.documents)
            ? parsed.documents.filter((d) => d && typeof d.name === 'string').map((d) => ({ name: String(d.name).trim(), description: typeof d.description === 'string' ? d.description.trim() : '' }))
            : [];
          return NextResponse.json({ documents: docs }, { status: 200 });
        }
      } catch (fallbackErr) {
        console.error('[required-documents] Fallback failed:', fallbackErr);
      }
    }
    return NextResponse.json(
      { error: 'Failed to fetch required documents', documents: [] },
      { status: 200 }
    );
  }
}
