# Document Request Workflow Fix

## ✅ Issue Fixed

**Problem**: When a consultant requests a document from their client, the client couldn't actually submit/upload documents in response to the request.

**Solution**: Added upload functionality to the DocumentRequestCard component in the client portal.

---

## 🔧 Changes Made

### 1. Client Portal - DocumentRequestCard Component

**File**: `src/app/client-portal/page.tsx`

**Changes**:
- ✅ Added file input with `useRef` hook
- ✅ Added `handleFileSelect` function to handle file selection
- ✅ Added `handleUpload` function to upload document and mark request as fulfilled
- ✅ Changed "Submit Response" button to "Upload Document" button
- ✅ Button only shows for pending requests
- ✅ Shows "✓ Request fulfilled" for completed requests

**How It Works**:
1. Client clicks "Upload Document" button
2. File picker opens
3. Client selects file
4. File is uploaded via `/api/documents/upload` with `requestId` in metadata
5. Request is marked as fulfilled via `/api/documents/requests/fulfill`
6. Page refreshes to show updated status

---

### 2. Document Upload API - Link to Requests

**File**: `src/app/api/documents/upload/route.ts`

**Changes**:
- ✅ Added import for `DocumentRequest` schema
- ✅ Fetches request details when `requestId` is provided in metadata
- ✅ Links document to request via `requestedBy` field
- ✅ Sets `consultantId` from request if not provided
- ✅ Sets `receivedVia` to 'request' when uploaded from request

**How It Works**:
```typescript
// If requestId in metadata, fetch request details
if (requestId) {
  requestDetails = await DocumentRequest.findById(requestId).lean();
}

// Link document to request
requestedBy: requestDetails ? {
  consultantId: requestDetails.consultantId,
  consultantName: requestDetails.consultantName,
  requestMessage: requestDetails.description,
  requestedAt: requestDetails.requestedAt,
  requestId: requestId,
} : undefined
```

---

### 3. Fulfill Request API - Support Specific RequestId

**File**: `src/app/api/documents/requests/fulfill/route.ts`

**Changes**:
- ✅ Updated to accept `requestId` parameter
- ✅ If `requestId` provided, updates that specific request
- ✅ Backward compatible - still supports updating all pending requests for client

**How It Works**:
```typescript
// If requestId provided, update specific request
if (requestId) {
  await DocumentRequest.updateOne(
    { _id: requestId, status: 'pending' },
    {
      status: 'fulfilled',
      fulfilledAt: new Date(),
      fulfilledByDocumentId: documentId,
    }
  );
}
```

---

## 🧪 Testing

### Test Case: Client Submits Document for Request

1. **Consultant creates request**:
   - Go to consultant portal
   - Request document from client
   - Request shows as "pending"

2. **Client uploads document**:
   - Go to client portal: `/client-portal?clientId=[id]`
   - Click "Requests" tab
   - See pending request
   - Click "Upload Document" button
   - Select file
   - File uploads successfully

3. **Verify**:
   - Request status changes to "fulfilled"
   - Document appears in Documents tab
   - Document is linked to request (`requestedBy.requestId`)
   - Consultant sees document in their portal

---

## 📋 Files Modified

1. ✅ `src/app/client-portal/page.tsx` - Added upload functionality
2. ✅ `src/app/api/documents/upload/route.ts` - Link documents to requests
3. ✅ `src/app/api/documents/requests/fulfill/route.ts` - Support specific requestId

---

## ✅ Success Criteria

- ✅ Client can upload documents in response to requests
- ✅ Documents are linked to requests (`requestedBy.requestId`)
- ✅ Requests are marked as fulfilled when document uploaded
- ✅ Request status updates in real-time
- ✅ Documents appear in both client and consultant portals

**Document request workflow is now fully functional!** 🎉
