import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
  try {
    const body = await request.json();
    const permitName = String(body.permitName || body.name || '').trim();
    const authority = String(body.authority || body.department || '').trim();
    const municipality = String(body.municipality || '').trim();

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

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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
  } catch (err) {
    console.error('[required-documents] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch required documents', documents: [] },
      { status: 200 }
    );
  }
}
