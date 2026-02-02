import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import DocumentModel from '@/app/lib/documents/schema';

/**
 * GET /api/documents/[documentId]/review
 * Get review information for a document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    await connectToDB();
    const { documentId } = await params;

    const document = await DocumentModel.findById(documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if review exists in workflow
    const review = {
      id: `review-${documentId}`,
      documentId: documentId,
      requestedBy: {
        userId: document.uploadedBy.userId,
        userName: document.uploadedBy.userName,
        userEmail: document.uploadedBy.userEmail,
      },
      requestedAt: document.workflow?.reviewedBy?.[0]?.reviewedAt || document.createdAt,
      status: document.workflow?.stage === 'review' ? 'open' : 
              document.workflow?.reviewedBy?.some((r: any) => r.status === 'approved') ? 'approved' :
              document.workflow?.reviewedBy?.some((r: any) => r.status === 'needs-revision') ? 'changes-requested' :
              'closed',
      reviewers: document.workflow?.reviewedBy?.map((r: any) => ({
        userId: r.userId,
        userName: r.userName,
        status: r.status === 'approved' ? 'approved' : 
                r.status === 'needs-revision' ? 'changes-requested' : 
                'pending',
        reviewedAt: r.reviewedAt,
        comment: r.comments,
      })) || [],
      comments: [], // Comments would be stored separately or in metadata
      version: document.currentVersion || document.version,
    };

    return NextResponse.json({ review });
  } catch (error: any) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/[documentId]/review
 * Request a review for a document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    await connectToDB();
    const { documentId } = await params;
    const body = await request.json();

    const document = await DocumentModel.findById(documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update workflow to review stage
    if (!document.workflow) {
      document.workflow = {
        stage: 'review',
        reviewedBy: [],
      };
    } else {
      document.workflow.stage = 'review';
    }

    document.status = 'pending-review';
    await document.save();

    const review = {
      id: `review-${documentId}`,
      documentId: documentId,
      requestedBy: {
        userId: document.uploadedBy.userId,
        userName: document.uploadedBy.userName,
        userEmail: document.uploadedBy.userEmail,
      },
      requestedAt: new Date().toISOString(),
      status: 'open',
      reviewers: [],
      comments: [],
      version: document.currentVersion || document.version,
    };

    return NextResponse.json({ review, message: 'Review requested successfully' });
  } catch (error: any) {
    console.error('Error requesting review:', error);
    return NextResponse.json(
      { error: 'Failed to request review', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/[documentId]/review
 * Submit a review (approve, request changes, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    await connectToDB();
    const { documentId } = await params;
    const body = await request.json();
    const { action, comment } = body;

    // Mock user (in real app, get from auth)
    const reviewer = {
      userId: 'consultant-1',
      userName: 'John Doe',
      userEmail: 'john@consultant.com',
    };

    const document = await DocumentModel.findById(documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.workflow) {
      document.workflow = {
        stage: 'review',
        reviewedBy: [],
      };
    }

    // Add review
    const reviewEntry = {
      userId: reviewer.userId,
      userName: reviewer.userName,
      reviewedAt: new Date(),
      status: action === 'approve' ? 'approved' : 'needs-revision',
      comments: comment || '',
    };

    document.workflow.reviewedBy = document.workflow.reviewedBy || [];
    document.workflow.reviewedBy.push(reviewEntry);

    // Update workflow stage based on reviews
    const allApproved = document.workflow.reviewedBy.every((r: any) => r.status === 'approved');
    const anyChangesRequested = document.workflow.reviewedBy.some((r: any) => r.status === 'needs-revision');

    if (allApproved && document.workflow.reviewedBy.length > 0) {
      document.workflow.stage = 'approval';
      document.status = 'shared';
    } else if (anyChangesRequested) {
      document.workflow.stage = 'review';
      document.status = 'pending-review';
    }

    await document.save();

    const review = {
      id: `review-${documentId}`,
      documentId: documentId,
      requestedBy: {
        userId: document.uploadedBy.userId,
        userName: document.uploadedBy.userName,
        userEmail: document.uploadedBy.userEmail,
      },
      requestedAt: document.workflow.reviewedBy[0]?.reviewedAt || document.createdAt,
      status: allApproved ? 'approved' : anyChangesRequested ? 'changes-requested' : 'open',
      reviewers: document.workflow.reviewedBy.map((r: any) => ({
        userId: r.userId,
        userName: r.userName,
        status: r.status === 'approved' ? 'approved' : 
                r.status === 'needs-revision' ? 'changes-requested' : 
                'pending',
        reviewedAt: r.reviewedAt,
        comment: r.comments,
      })),
      comments: [],
      version: document.currentVersion || document.version,
    };

    return NextResponse.json({ review, message: 'Review submitted successfully' });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review', details: error.message },
      { status: 500 }
    );
  }
}

