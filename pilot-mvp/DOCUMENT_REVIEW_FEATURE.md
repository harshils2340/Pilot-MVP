# Document Review Feature (PR-Style)

A GitHub Pull Request-style review system for documents, allowing consultants and clients to review paperwork before submission.

## Features

### 1. **Request Review**
- Click "Review" from the document menu
- Creates a review request for the document
- Document status changes to "pending-review"
- Review badge appears on the document

### 2. **Review Interface**
- **Side-by-side view**: Document preview on the left, review panel on the right
- **Document preview**: Supports PDFs, images, and other file types
- **Review panel**: Shows review status, reviewers, comments, and actions

### 3. **Comments**
- Add comments on the document
- Comments appear in chronological order
- Support for threaded replies (future enhancement)
- Comments can reference specific positions in the document

### 4. **Review Actions**
- **Approve**: Approve the document for submission
- **Request Changes**: Request specific changes with feedback
- **Add Comments**: Provide general feedback

### 5. **Review Status**
- **Open**: Review is in progress
- **Approved**: All reviewers approved
- **Changes Requested**: At least one reviewer requested changes
- **Closed**: Review is complete

## How to Use

### For Consultants/Reviewers:

1. **Open a document** from the Documents tab
2. **Click the menu** (three dots) on any document
3. **Select "Review"** to open the review modal
4. **If no review exists**: Click "Request Review" to start
5. **View the document** in the left panel
6. **Add comments** in the right panel
7. **Approve or Request Changes** with optional feedback

### For Clients:

1. Upload a document
2. Request a review (or consultant can request)
3. View review comments and feedback
4. Make changes based on feedback
5. Upload a new version if needed

## Visual Indicators

- **Review Badge**: Documents in review show a blue "Review" badge with a PR icon
- **Status Colors**:
  - Green: Approved
  - Red: Changes Requested
  - Blue: Open/In Progress

## API Endpoints

### GET `/api/documents/[documentId]/review`
Get review information for a document

### POST `/api/documents/[documentId]/review`
Request a review for a document

### PATCH `/api/documents/[documentId]/review`
Submit a review (approve/request changes)

### POST `/api/documents/[documentId]/review/comments`
Add a comment to a review

## Database Schema

The review system uses the existing `Document` schema's `workflow` field:

```typescript
workflow: {
  stage: 'draft' | 'review' | 'approval' | 'signed' | 'submitted' | 'archived',
  reviewedBy: [{
    userId: string,
    userName: string,
    reviewedAt: Date,
    status: 'approved' | 'rejected' | 'needs-revision',
    comments: string
  }]
}
```

## Future Enhancements

1. **Threaded Comments**: Reply to specific comments
2. **Document Annotations**: Highlight and comment on specific parts of PDFs/images
3. **Version Comparison**: Compare document versions side-by-side
4. **Review Assignments**: Assign specific reviewers
5. **Review Deadlines**: Set due dates for reviews
6. **Email Notifications**: Notify when reviews are requested/completed
7. **Review Templates**: Pre-defined review checklists
8. **Bulk Review**: Review multiple documents at once

## Components

- `DocumentReviewModal.tsx`: Main review interface component
- `DocumentsView.tsx`: Updated to include review functionality
- API routes in `/api/documents/[documentId]/review/`

## Example Workflow

1. **Client uploads** a permit application document
2. **Consultant opens** the document and clicks "Review"
3. **Consultant requests review** - document status changes to "pending-review"
4. **Consultant adds comments** pointing out missing information
5. **Consultant requests changes** with detailed feedback
6. **Client sees** the review comments and feedback
7. **Client uploads** a new version with corrections
8. **Consultant reviews** again and approves
9. **Document is ready** for submission

This creates a collaborative, transparent review process similar to code reviews in software development!

