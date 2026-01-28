import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Permit } from '@/app/lib/permits/schema';
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
 * POST /api/permits/[id]/review
 * Review a permit (from master library) before submission to validate completeness
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;

    // Try to find in PermitManagement first (client-specific permits)
    let permit = await PermitManagement.findById(id).lean();
    let isManagementPermit = true;

    // If not found, try the master Permit collection
    if (!permit) {
      permit = await Permit.findById(id).lean();
      isManagementPermit = false;
    }

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
    if (!permit.name || (typeof permit.name === 'string' && permit.name.trim().length === 0)) {
      errors.push({
        field: 'name',
        severity: 'error',
        message: 'Permit name is required',
        suggestion: 'Please provide a name for this permit',
      });
      score -= 20;
    }

    if (!permit.authority || (typeof permit.authority === 'string' && permit.authority.trim().length === 0)) {
      errors.push({
        field: 'authority',
        severity: 'error',
        message: 'Issuing authority is required',
        suggestion: 'Specify which government body or department issues this permit',
      });
      score -= 15;
    }

    // For PermitManagement entries, check additional fields
    if (isManagementPermit) {
      const mgmtPermit = permit as any;

      if (!mgmtPermit.description || mgmtPermit.description.trim().length < 10) {
        warnings.push({
          field: 'description',
          severity: 'warning',
          message: 'Description is missing or too short',
          suggestion: 'Add a detailed description to help understand the permit requirements',
        });
        score -= 10;
      }

      if (!mgmtPermit.requirements || mgmtPermit.requirements.length === 0) {
        warnings.push({
          field: 'requirements',
          severity: 'warning',
          message: 'No requirements listed',
          suggestion: 'Add the required documents, qualifications, or prerequisites for this permit',
        });
        score -= 15;
      }

      if (!mgmtPermit.contactInfo?.email && !mgmtPermit.contactInfo?.phone) {
        warnings.push({
          field: 'contactInfo',
          severity: 'warning',
          message: 'Contact information is incomplete',
          suggestion: 'Add at least an email or phone number for the issuing authority',
        });
        score -= 10;
      }

      if (!mgmtPermit.howToApply || mgmtPermit.howToApply.trim().length < 10) {
        warnings.push({
          field: 'howToApply',
          severity: 'warning',
          message: 'Application instructions are missing or incomplete',
          suggestion: 'Provide clear instructions on how to apply for this permit',
        });
        score -= 10;
      }

      if (!mgmtPermit.category) {
        warnings.push({
          field: 'category',
          severity: 'warning',
          message: 'Category is not specified',
          suggestion: 'Categorize this permit for better organization',
        });
        score -= 5;
      }

      if (!mgmtPermit.fees || mgmtPermit.fees.trim().length === 0) {
        warnings.push({
          field: 'fees',
          severity: 'warning',
          message: 'Fee information is missing',
          suggestion: 'Add fee information if applicable, or mark as "No fee"',
        });
        score -= 5;
      }

      if (!mgmtPermit.estimatedTime || mgmtPermit.estimatedTime.trim().length === 0) {
        warnings.push({
          field: 'estimatedTime',
          severity: 'warning',
          message: 'Estimated processing time is missing',
          suggestion: 'Add an estimated time for permit processing',
        });
        score -= 5;
      }
    } else {
      // For master Permit entries, check different fields
      const masterPermit = permit as any;

      if (!masterPermit.activities || masterPermit.activities.length === 0) {
        warnings.push({
          field: 'activities',
          severity: 'warning',
          message: 'No activities or requirements listed',
          suggestion: 'Add activities or requirements for this permit',
        });
        score -= 15;
      }

      if (!masterPermit.contactInfo?.email && !masterPermit.contactInfo?.phone) {
        warnings.push({
          field: 'contactInfo',
          severity: 'warning',
          message: 'Contact information is incomplete',
          suggestion: 'Add at least an email or phone number for the issuing authority',
        });
        score -= 10;
      }

      if (!masterPermit.applyUrl || masterPermit.applyUrl === 'https://beta.bizpal-perle.ca/en') {
        warnings.push({
          field: 'applyUrl',
          severity: 'warning',
          message: 'Application URL is missing or generic',
          suggestion: 'Add a specific application URL for this permit',
        });
        score -= 10;
      }

      if (!masterPermit.jurisdiction?.province) {
        warnings.push({
          field: 'jurisdiction',
          severity: 'warning',
          message: 'Jurisdiction information is incomplete',
          suggestion: 'Specify the province where this permit applies',
        });
        score -= 10;
      }
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
