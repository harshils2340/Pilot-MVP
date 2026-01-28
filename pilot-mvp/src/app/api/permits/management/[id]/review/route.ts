import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitManagement } from '@/app/lib/permits/managementSchema';

interface ReviewError {
  field: string;
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string;
}

interface ReviewResult {
  isValid: boolean;
  errors: ReviewError[];
  warnings: ReviewError[];
  score: number; // 0-100
  summary: string;
}

/**
 * POST /api/permits/management/[id]/review
 * Review a permit before submission to validate completeness and readiness
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;

    const permit = await PermitManagement.findById(id).lean();

    if (!permit) {
      return NextResponse.json(
        { error: 'Permit not found' },
        { status: 404 }
      );
    }

    const errors: ReviewError[] = [];
    const warnings: ReviewError[] = [];
    let score = 100;

    // Required field validations (errors)
    if (!permit.name || permit.name.trim().length === 0) {
      errors.push({
        field: 'name',
        severity: 'error',
        message: 'Permit name is required',
        suggestion: 'Please provide a name for this permit',
      });
      score -= 20;
    }

    if (!permit.authority || permit.authority.trim().length === 0) {
      errors.push({
        field: 'authority',
        severity: 'error',
        message: 'Issuing authority is required',
        suggestion: 'Specify which government body or department issues this permit',
      });
      score -= 15;
    }

    // Critical field validations (warnings that should be addressed)
    if (!permit.description || permit.description.trim().length < 10) {
      warnings.push({
        field: 'description',
        severity: 'warning',
        message: 'Description is missing or too short',
        suggestion: 'Add a detailed description to help understand the permit requirements',
      });
      score -= 10;
    }

    if (!permit.requirements || permit.requirements.length === 0) {
      warnings.push({
        field: 'requirements',
        severity: 'warning',
        message: 'No requirements listed',
        suggestion: 'Add the required documents, qualifications, or prerequisites for this permit',
      });
      score -= 15;
    }

    if (!permit.contactInfo?.email && !permit.contactInfo?.phone) {
      warnings.push({
        field: 'contactInfo',
        severity: 'warning',
        message: 'Contact information is incomplete',
        suggestion: 'Add at least an email or phone number for the issuing authority',
      });
      score -= 10;
    }

    if (!permit.howToApply || permit.howToApply.trim().length < 10) {
      warnings.push({
        field: 'howToApply',
        severity: 'warning',
        message: 'Application instructions are missing or incomplete',
        suggestion: 'Provide clear instructions on how to apply for this permit',
      });
      score -= 10;
    }

    // Status validation
    if (permit.status === 'not-started') {
      warnings.push({
        field: 'status',
        severity: 'warning',
        message: 'Permit status is "not-started"',
        suggestion: 'Update the status to "in-progress" before submitting',
      });
      score -= 5;
    }

    // Additional quality checks
    if (!permit.category) {
      warnings.push({
        field: 'category',
        severity: 'warning',
        message: 'Category is not specified',
        suggestion: 'Categorize this permit for better organization',
      });
      score -= 5;
    }

    if (!permit.fees || permit.fees.trim().length === 0) {
      warnings.push({
        field: 'fees',
        severity: 'warning',
        message: 'Fee information is missing',
        suggestion: 'Add fee information if applicable, or mark as "No fee"',
      });
      score -= 5;
    }

    if (!permit.estimatedTime || permit.estimatedTime.trim().length === 0) {
      warnings.push({
        field: 'estimatedTime',
        severity: 'warning',
        message: 'Estimated processing time is missing',
        suggestion: 'Add an estimated time for permit processing',
      });
      score -= 5;
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    const isValid = errors.length === 0;
    const summary = isValid
      ? warnings.length === 0
        ? '✅ Permit is ready for submission. All required fields are complete and there are no warnings.'
        : `⚠️ Permit has ${warnings.length} warning(s) but can be submitted. Consider addressing them for better completeness.`
      : `❌ Permit has ${errors.length} error(s) that must be fixed before submission.`;

    const result: ReviewResult = {
      isValid,
      errors,
      warnings,
      score,
      summary,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error reviewing permit:', error);
    return NextResponse.json(
      { error: 'Failed to review permit', details: error.message },
      { status: 500 }
    );
  }
}
