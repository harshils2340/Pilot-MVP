# Document Syncing Between Client and Consultant Portals

## ✅ Implementation Complete

### What Was Fixed

1. **API Endpoint Updated** - Returns ALL documents for a client
2. **Real-time Polling** - Both portals poll for updates every 10 seconds
3. **Notifications** - Both portals notify when documents are uploaded by the other party
4. **Immediate Refresh** - Documents refresh after upload to ensure sync
5. **Folder Structure** - Consistent folder structure between portals

---

## 🔄 How Document Syncing Works

### 1. Document Fetching

**Before**: 
- Consultant portal filtered by `consultantId` → might miss client-uploaded docs
- Client portal fetched all docs → worked but no real-time updates

**After**:
- **Both portals fetch ALL documents** for the client (regardless of who uploaded)
- API endpoint: `GET /api/documents?clientId=[id]` returns all documents
- No filtering by `consultantId` - ensures both sides see everything

### 2. Real-time Polling

**Both portals poll every 10 seconds** for new documents:
- Consultant portal: Polls for client uploads
- Client portal: Polls for consultant uploads
- Silent polling (doesn't show loading spinner)

### 3. Notifications

**When a new document is uploaded by the other party**:
- Shows toast notification with document name, size, type, and folder
- "View" button navigates to the document's folder
- Only notifies for documents uploaded by the other party (not your own uploads)

### 4. Folder Structure

**Consistent folders across both portals**:
- `General` (with subfolders: Onboarding, Brand Assets)
- `Permits` (with subfolders: Applications, Plans, City Feedback)
- `Contracts` (with subfolders: Engagement, Amendments)
- `Invoices`

Documents uploaded to a folder appear in the **same folder** on both portals.

---

## 📋 Files Modified

### 1. `/api/documents/route.ts`
- **Removed** `consultantId` filter
- **Returns ALL documents** for a client (both consultant and client uploaded)

### 2. `DocumentsView.tsx`
- **Added polling** for client portal (was only consultant before)
- **Updated notifications** to work for both portals
- **Added refresh** after upload to ensure sync
- **Removed** `consultantId` from fetch params

### 3. `client-portal/page.tsx`
- **Fetches consultantId** from client data
- **Passes consultantId** to DocumentsView component

---

## 🧪 Testing

### Test Case 1: Upload from Consultant Portal
1. Open consultant portal: `/clients/[clientId]?tab=documents`
2. Upload a document to `Permits/Applications`
3. Open client portal: `/client-portal?clientId=[clientId]`
4. **Expected**: Document appears in `Permits/Applications` folder
5. **Expected**: Notification shows "New Document Received from Consultant"

### Test Case 2: Upload from Client Portal
1. Open client portal: `/client-portal?clientId=[clientId]`
2. Upload a document to `General/Onboarding`
3. Open consultant portal: `/clients/[clientId]?tab=documents`
4. **Expected**: Document appears in `General/Onboarding` folder within 10 seconds
5. **Expected**: Notification shows "New Document Received from Client"

### Test Case 3: Folder Consistency
1. Upload document to `Permits/City Feedback` from consultant portal
2. Check client portal
3. **Expected**: Document appears in `Permits/City Feedback` folder
4. Upload document to same folder from client portal
5. **Expected**: Both documents appear in the same folder on both portals

---

## 🔍 How It Works Technically

### Document Upload Flow

```
1. User uploads document
   ↓
2. POST /api/documents/upload
   - Saves document with clientId, folder, uploadedBy.isClient
   ↓
3. Document saved to MongoDB
   ↓
4. Component refreshes document list (immediate)
   ↓
5. Polling detects new document (within 10 seconds)
   ↓
6. Other portal shows notification
```

### Document Fetching Flow

```
1. Component mounts
   ↓
2. fetchDocuments() called
   ↓
3. GET /api/documents?clientId=[id]
   - Returns ALL documents for client
   ↓
4. Documents filtered by selected folder
   ↓
5. Displayed in UI
   ↓
6. Polling continues every 10 seconds
```

---

## ✅ Success Criteria

- ✅ Documents uploaded in consultant portal appear in client portal
- ✅ Documents uploaded in client portal appear in consultant portal
- ✅ Documents appear in the same folder on both portals
- ✅ Real-time notifications when documents are uploaded
- ✅ Polling works for both portals
- ✅ No duplicate documents
- ✅ Folder structure is consistent

---

## 🚀 Next Steps (Optional Enhancements)

1. **WebSocket Support** - Replace polling with WebSocket for instant updates
2. **Document Permissions** - Add fine-grained permissions (who can see what)
3. **Folder Permissions** - Restrict certain folders to consultant or client only
4. **Document Versioning** - Show version history in both portals
5. **Activity Feed** - Show document activity timeline

---

## 📝 Notes

- Documents are synced **automatically** - no manual refresh needed
- Polling interval: **10 seconds** (configurable)
- Maximum file size: **10MB** (base64 storage limitation)
- Folder structure is **hardcoded** but consistent across portals
- Documents are stored in **MongoDB** with base64 encoding

**Document syncing is now fully functional!** 🎉
