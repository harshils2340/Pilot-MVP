# Gmail Add-on Verification Checklist

Use this checklist to verify your Gmail add-on is fully working.

## ✅ Pre-Deployment Checks

### Code Files
- [x] `Code.gs` exists and contains all functions
- [x] `appsscript.json` exists and is properly formatted
- [x] All API URLs point to correct endpoints
- [x] Error handling is in place for all API calls

### Functions Verification
- [x] `onGmailMessage(e)` - Main trigger function
- [x] `lookupClientOrLead(email)` - Client/lead lookup
- [x] `createClientLeadInfoSection(info, email)` - Info pane
- [x] `createAddToLeadsForm(...)` - Lead form
- [x] `handleAddToLeads(e)` - Form submission handler
- [x] `parseEmailContent(...)` - Email parsing
- [x] `openInPilot(e)` - Navigation handler
- [x] `markAsProcessed(e)` - Gmail actions

## ✅ API Endpoints Verification

### Required Endpoints (Must Exist)
- [x] `GET /api/gmail/lookup?email=<email>` - Client/lead lookup
- [x] `POST /api/gmail/lead-intake` - Create lead from add-on

### Optional Endpoints (Nice to Have)
- [ ] `POST /api/gmail/intake` - General intake (for permits/clients)
- [ ] `GET /api/gmail/link?messageId=<id>` - Link email to record

## ✅ Deployment Steps

1. [ ] Open [Google Apps Script](https://script.google.com)
2. [ ] Create new project
3. [ ] Copy `Code.gs` content → paste in editor
4. [ ] Enable `appsscript.json` in project settings
5. [ ] Copy `appsscript.json` content → paste in manifest
6. [ ] Save project
7. [ ] Deploy → New deployment → Add-on
8. [ ] Authorize permissions
9. [ ] Copy deployment ID

## ✅ Testing Checklist

### Basic Functionality
- [ ] Add-on appears in Gmail sidebar when opening emails
- [ ] "New Lead" form is visible with pre-filled fields
- [ ] Form fields can be edited
- [ ] "Add to Leads" button is clickable

### Add to Leads Feature
- [ ] Fill in name and email
- [ ] Click "Add to Leads"
- [ ] Success notification appears
- [ ] Lead appears in Pilot MVP Leads section
- [ ] Error handling works (try with duplicate email)

### Client/Lead Information Pane
- [ ] Open email from existing client → info pane shows
- [ ] Open email from existing lead → info pane shows
- [ ] "View Client in Pilot" button works
- [ ] "View Lead in Pilot" button works

### Error Handling
- [ ] Add-on works even if API is temporarily unavailable
- [ ] Error messages are user-friendly
- [ ] Add-on doesn't crash on malformed emails

### Notifications Section Integration
- [ ] "Add as lead" button appears on email notifications
- [ ] Clicking button creates lead successfully
- [ ] Toast notification appears
- [ ] Redirects to Leads section

## ✅ Common Issues & Solutions

### Issue: Add-on not appearing in Gmail
**Solution:**
- Wait 5-10 minutes after deployment
- Hard refresh Gmail (Ctrl+Shift+R)
- Check deployment authorization
- Verify add-on is installed in Gmail

### Issue: "Error: Failed to add lead"
**Solution:**
- Check API endpoint is accessible: `https://pilot-mvp.vercel.app/api/gmail/lead-intake`
- Verify backend is running
- Check browser console for CORS errors
- Verify email format is valid

### Issue: Form fields not pre-filling
**Solution:**
- This is normal for some email formats
- Manually fill in the fields
- Check email "From" field format

### Issue: Lookup not working
**Solution:**
- Check `/api/gmail/lookup` endpoint
- Verify database connection
- Check API logs for errors

## ✅ Performance Checks

- [ ] Add-on loads within 2-3 seconds
- [ ] Form submission completes within 5 seconds
- [ ] No timeout errors
- [ ] API calls are efficient

## ✅ Security Checks

- [ ] API endpoints require proper authentication (if needed)
- [ ] Email data is sanitized
- [ ] No sensitive data in logs
- [ ] CORS is properly configured

## ✅ Final Verification

Before considering the add-on "fully working":

1. [ ] Can add leads from Gmail add-on
2. [ ] Can add leads from Notifications section
3. [ ] Client/lead info pane displays correctly
4. [ ] All error cases are handled gracefully
5. [ ] Success notifications appear
6. [ ] Navigation buttons work
7. [ ] Leads appear in Leads section after creation

## 🎉 Success Criteria

Your add-on is **fully working** when:
- ✅ You can open any email in Gmail and see the add-on
- ✅ You can fill out the "Add to Leads" form
- ✅ Clicking "Add to Leads" successfully creates a lead
- ✅ The lead appears in your Pilot MVP Leads section
- ✅ You can also add leads from the Notifications section
- ✅ Error messages are clear and helpful

---

**If all items are checked, your Gmail add-on is fully functional!** 🚀
