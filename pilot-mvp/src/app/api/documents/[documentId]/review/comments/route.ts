import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import DocumentModel from '@/app/lib/documents/schema';

/**
 * POST /api/documents/[documentId]/review/comments
 * Add a comment to a document review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    await connectToDB();
    const { documentId } = await params;
    const body = await request.json();
    const { content, position } = body;

    // Mock user (in real app, get from auth)
    const author = {
      userId: 'consultant-1',
      userName: 'John Doe',
      userEmail: 'john@consultant.com',
      role: 'consultant' as const,
    };

    const document = await DocumentModel.findById(documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // In a real implementation, you'd store comments separately
    // For now, we'll store them in metadata or a separate collection
    // This is a simplified version that returns the comment structure

    const comment = {
      id: `comment-${Date.now()}`,
      documentId: documentId,
      author,
      content,
      position,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    // Update document metadata to track comments (simplified)
    if (!document.metadata) {
      document.metadata = {};
    }
    
    // In production, use a separate Comment collection
    // For now, we'll just return the comment structure
    await document.save();

    // Fetch updated review
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
      comments: [comment], // In production, fetch from Comment collection
      version: document.currentVersion || document.version,
    };

    return NextResponse.json({ review, comment, message: 'Comment added successfully' });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment', details: error.message },
      { status: 500 }
    );
  }
}

