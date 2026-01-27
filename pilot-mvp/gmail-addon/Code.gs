/**
 * Enhanced Gmail Add-on for Pilot MVP
 * 
 * Clean sidebar UI with quick intake forms
 * Appears automatically when emails are opened
 */

/**
 * Triggered when Gmail message is opened - shows sidebar
 */
function onGmailMessage(e) {
  const messageId = e.gmail.messageId;
  const accessToken = e.gmail.accessToken;
  
  // Get message details
  const message = GmailApp.getMessageById(messageId);
  const subject = message.getSubject();
  const from = message.getFrom();
  const body = message.getPlainBody();
  const date = message.getDate();
  
  // Parse email using enhanced Odoo-style logic
  const parsedData = parseEmailContent(subject, body, from);
  
  // Lookup client/lead information by email
  const clientLeadInfo = lookupClientOrLead(parsedData.fromEmail);
  
  // Build main card with client/lead info pane first
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Pilot MVP')
      .setSubtitle('Client & Lead Information'));
  
  // Add client/lead information pane (if found)
  if (clientLeadInfo && clientLeadInfo.found) {
    card.addSection(createClientLeadInfoSection(clientLeadInfo, parsedData.fromEmail));
  }
  
  // Add parsed data and intake forms
  card.addSection(createParsedDataSection(parsedData))
    .addSection(createQuickIntakeSection(parsedData, messageId, subject, body, from))
    .addSection(createActionsSection(parsedData, messageId));
  
  return [card.build()];
}

/**
 * Lookup client or lead by email address
 */
function lookupClientOrLead(email) {
  if (!email) return null;
  
  try {
    const apiUrl = 'https://pilot-mvp.vercel.app/api/gmail/lookup?email=' + encodeURIComponent(email);
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'get',
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      return result;
    }
  } catch (error) {
    console.error('Error looking up client/lead:', error);
  }
  
  return null;
}

/**
 * Create information pane section for client/lead
 */
function createClientLeadInfoSection(info, email) {
  const section = CardService.newCardSection()
    .setHeader('Client & Lead Information');
  
  // Show Client information if found
  if (info.client) {
    section.addWidget(CardService.newKeyValue()
      .setTopLabel('Type')
      .setContent('Client')
      .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/business_black_24dp.png'));
    
    section.addWidget(CardService.newKeyValue()
      .setTopLabel('Business Name')
      .setContent(info.client.businessName || 'N/A')
      .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/store_black_24dp.png'));
    
    if (info.client.jurisdiction) {
      section.addWidget(CardService.newKeyValue()
        .setTopLabel('Jurisdiction')
        .setContent(info.client.jurisdiction)
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/place_black_24dp.png'));
    }
    
    if (info.client.status) {
      const statusEmoji = info.client.status === 'approved' ? '✓' : 
                          info.client.status === 'action-required' ? '⚠' : '📋';
      section.addWidget(CardService.newKeyValue()
        .setTopLabel('Status')
        .setContent(statusEmoji + ' ' + info.client.status)
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/info_black_24dp.png'));
    }
    
    if (info.client.activePermits > 0) {
      section.addWidget(CardService.newKeyValue()
        .setTopLabel('Active Permits')
        .setContent(String(info.client.activePermits))
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/description_black_24dp.png'));
    }
    
    if (info.client.contactInfo && info.client.contactInfo.email) {
      section.addWidget(CardService.newKeyValue()
        .setTopLabel('Contact Email')
        .setContent(info.client.contactInfo.email)
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/email_black_24dp.png'));
    }
    
    // Add button to open client in Pilot
    section.addWidget(CardService.newTextButton()
      .setText('View Client in Pilot')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('openInPilot')
        .setParameters({ type: 'client', id: info.client._id })));
    
    section.addWidget(CardService.newDivider());
  }
  
  // Show Lead information if found
  if (info.lead) {
    section.addWidget(CardService.newKeyValue()
      .setTopLabel('Type')
      .setContent('Lead')
      .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/person_black_24dp.png'));
    
    section.addWidget(CardService.newKeyValue()
      .setTopLabel('Name')
      .setContent(info.lead.name || 'N/A')
      .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/person_black_24dp.png'));
    
    if (info.lead.email) {
      section.addWidget(CardService.newKeyValue()
        .setTopLabel('Email')
        .setContent(info.lead.email)
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/email_black_24dp.png'));
    }
    
    if (info.lead.company) {
      section.addWidget(CardService.newKeyValue()
        .setTopLabel('Company')
        .setContent(info.lead.company)
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/business_black_24dp.png'));
    }
    
    if (info.lead.stageName) {
      section.addWidget(CardService.newKeyValue()
        .setTopLabel('Stage')
        .setContent(info.lead.stageName)
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/timeline_black_24dp.png'));
    }
    
    if (info.lead.probability != null) {
      section.addWidget(CardService.newKeyValue()
        .setTopLabel('Probability')
        .setContent(String(info.lead.probability) + '%')
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/trending_up_black_24dp.png'));
    }
    
    if (info.lead.source) {
      section.addWidget(CardService.newKeyValue()
        .setTopLabel('Source')
        .setContent(info.lead.source)
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/link_black_24dp.png'));
    }
    
    if (info.lead.emailCount > 0) {
      section.addWidget(CardService.newKeyValue()
        .setTopLabel('Email Activity')
        .setContent(String(info.lead.emailCount) + ' email' + (info.lead.emailCount !== 1 ? 's' : ''))
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/mail_black_24dp.png'));
    }
    
    // Add button to open lead in Pilot
    section.addWidget(CardService.newTextButton()
      .setText('View Lead in Pilot')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('openInPilot')
        .setParameters({ type: 'lead', id: info.lead._id })));
  }
  
  // If neither found, show message
  if (!info.client && !info.lead) {
    section.addWidget(CardService.newTextParagraph()
      .setText('No existing client or lead found for this email address.'));
    section.addWidget(CardService.newTextParagraph()
      .setText('Use the forms below to create a new record.'));
  }
  
  return section;
}

/**
 * Open client or lead in Pilot dashboard
 */
function openInPilot(e) {
  const type = e.parameters.type;
  const id = e.parameters.id;
  
  let url = 'https://pilot-mvp.vercel.app';
  if (type === 'client') {
    url = 'https://pilot-mvp.vercel.app/clients/' + id;
  } else if (type === 'lead') {
    url = 'https://pilot-mvp.vercel.app/leads/' + id;
  }
  
  return CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
      .setUrl(url)
      .setOpenAs(CardService.OpenAs.FULL_SIZE))
    .build();
}

/**
 * Show parsed data from email (auto-detected)
 */
function createParsedDataSection(parsedData) {
  const section = CardService.newCardSection()
    .setHeader('âœ¨ Auto-Detected from Email');
  
  if (parsedData.permitName) {
    section.addWidget(CardService.newKeyValue()
      .setTopLabel('Permit')
      .setContent(parsedData.permitName)
      .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/description_black_24dp.png'));
  }
  
  if (parsedData.clientName) {
    section.addWidget(CardService.newKeyValue()
      .setTopLabel('Client')
      .setContent(parsedData.clientName)
      .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/business_black_24dp.png'));
  }
  
  if (parsedData.authority) {
    section.addWidget(CardService.newKeyValue()
      .setTopLabel('Authority')
      .setContent(parsedData.authority)
      .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/account_balance_black_24dp.png'));
  }
  
  if (parsedData.status) {
    const statusEmoji = parsedData.status === 'action-required' ? 'ðŸ”´' : 
                       parsedData.status === 'approved' ? 'âœ…' : 'ðŸŸ¡';
    section.addWidget(CardService.newKeyValue()
      .setTopLabel('Status')
      .setContent(statusEmoji + ' ' + parsedData.status)
      .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/info_black_24dp.png'));
  }
  
  if (parsedData.location) {
    section.addWidget(CardService.newKeyValue()
      .setTopLabel('Location')
      .setContent(parsedData.location)
      .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/place_black_24dp.png'));
  }
  
  if (!parsedData.permitName && !parsedData.clientName) {
    section.addWidget(CardService.newTextParagraph()
      .setText('No data auto-detected. Use forms below to enter manually.'));
  }
  
  return section;
}

/**
 * Quick intake forms - easy to fill out
 */
function createQuickIntakeSection(parsedData, messageId, subject, body, from) {
  const section = CardService.newCardSection()
    .setHeader('âš¡ Quick Intake Forms');
  
  // Create Permit Form
  section.addWidget(CardService.newTextInput()
    .setFieldName('permitName')
    .setTitle('Permit Name')
    .setValue(parsedData.permitName || '')
    .setHint('e.g., Health Department Plan Review'));
  
  section.addWidget(CardService.newTextInput()
    .setFieldName('authority')
    .setTitle('Issuing Authority')
    .setValue(parsedData.authority || '')
    .setHint('e.g., SF Dept. of Public Health'));
  
  section.addWidget(CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Status')
    .setFieldName('status')
    .addItem('Not Started', 'not-started', parsedData.status === 'not-started')
    .addItem('Action Required', 'action-required', parsedData.status === 'action-required')
    .addItem('Submitted', 'submitted', parsedData.status === 'submitted')
    .addItem('Approved', 'approved', parsedData.status === 'approved'));
  
  section.addWidget(CardService.newTextButton()
    .setText('âœ… Create Permit')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction()
      .setFunctionName('handleCreatePermit')
      .setParameters({ messageId: messageId })));
  
  // Divider
  section.addWidget(CardService.newDivider());
  
  // Create Client Form
  section.addWidget(CardService.newTextInput()
    .setFieldName('clientName')
    .setTitle('Client Name')
    .setValue(parsedData.clientName || parsedData.businessName || '')
    .setHint('Business or client name'));
  
  section.addWidget(CardService.newTextInput()
    .setFieldName('location')
    .setTitle('Location')
    .setValue(parsedData.location || '')
    .setHint('e.g., San Francisco, CA'));
  
  section.addWidget(CardService.newTextButton()
    .setText('ðŸ‘¤ Create Client')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction()
      .setFunctionName('handleCreateClient')
      .setParameters({ messageId: messageId })));
  
  // Add to Leads
  section.addWidget(CardService.newDivider());
  section.addWidget(CardService.newTextParagraph()
    .setText('Add sender to Leads'));
  section.addWidget(CardService.newTextInput()
    .setFieldName('leadName')
    .setTitle('Lead Name')
    .setValue(parsedData.clientName || parsedData.businessName || '')
    .setHint('From email sender'));
  section.addWidget(CardService.newTextInput()
    .setFieldName('leadEmail')
    .setTitle('Lead Email *')
    .setValue(parsedData.fromEmail || '')
    .setHint('From email sender'));
  section.addWidget(CardService.newTextInput()
    .setFieldName('leadCompany')
    .setTitle('Company')
    .setValue(parsedData.businessName || '')
    .setHint('Optional'));
  section.addWidget(CardService.newTextButton()
    .setText('Add to Leads')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction()
      .setFunctionName('handleAddToLeads')
      .setParameters({ messageId: messageId, subject: subject || '' })));
  
  return section;
}

/**
 * Additional actions section
 */
function createActionsSection(parsedData, messageId) {
  const section = CardService.newCardSection()
    .setHeader('ðŸ”— Additional Actions');
  
  // Link to existing
  section.addWidget(CardService.newTextButton()
    .setText('ðŸ”— Link to Existing Record')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('linkToExisting')
      .setParameters({ messageId: messageId })));
  
  // Open in Pilot
  section.addWidget(CardService.newTextButton()
    .setText('ðŸš€ Open in Pilot Dashboard')
    .setOpenLink(CardService.newOpenLink()
      .setUrl('https://pilot-mvp.vercel.app')
      .setOpenAs(CardService.OpenAs.FULL_SIZE)));
  
  // Mark as processed
  section.addWidget(CardService.newTextButton()
    .setText('âœ… Mark as Processed')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('markAsProcessed')
      .setParameters({ messageId: messageId })));
  
  return section;
}

/**
 * Enhanced email parsing (Odoo-style)
 */
function parseEmailContent(subject, body, from) {
  const parsed = {
    permitName: null,
    clientName: null,
    businessName: null,
    fromEmail: null,
    authority: null,
    status: null,
    location: null,
    priority: 'medium',
    deadline: null,
    fees: null
  };
  
  const subjectLower = subject.toLowerCase();
  const bodyLower = body.toLowerCase();
  const combined = subjectLower + ' ' + bodyLower;
  
  // Extract permit name (multiple patterns)
  const permitPatterns = [
    /(?:permit|license|application)\s+(?:for|#|number)?:?\s*([A-Z][A-Za-z\s&-]+(?:permit|license|application)?)/i,
    /([A-Z][A-Za-z\s]+(?:permit|license|approval|certificate))/i,
    /(?:re:|subject:)\s*([A-Z][A-Za-z\s]+)/i
  ];
  
  for (const pattern of permitPatterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      parsed.permitName = match[1].trim();
      break;
    }
  }
  
  if (!parsed.permitName && /permit|license|application/i.test(subject)) {
    parsed.permitName = subject.substring(0, 80).trim();
  }
  
  // Extract client name from "From" field
  const fromMatch = from.match(/([^<]+)\s*<(.+)>/);
  if (fromMatch) {
    parsed.clientName = fromMatch[1].trim();
    parsed.businessName = fromMatch[1].trim();
    parsed.fromEmail = fromMatch[2].trim();
  } else {
    const emailParts = from.split('@');
    if (emailParts.length > 1) {
      const domain = emailParts[1].toLowerCase();
      parsed.fromEmail = from.trim();
      if (!domain.includes('gov') && !domain.includes('city') && !domain.includes('department')) {
        parsed.clientName = emailParts[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        parsed.businessName = parsed.clientName;
      }
    }
  }
  
  // Extract authority (government emails)
  if (/@gov|@city|@department|@municipal|@state|@county/i.test(from)) {
    if (fromMatch) {
      parsed.authority = fromMatch[1].trim();
    } else {
      const domainParts = from.split('@')[1]?.split('.') || [];
      parsed.authority = domainParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
  }
  
  // Extract authority from body
  if (!parsed.authority) {
    const authorityPatterns = [
      /(?:from|issued by|authority):\s*([A-Z][A-Za-z\s&]+(?:Department|Authority|Office|Agency))/i,
      /([A-Z][A-Za-z\s&]+(?:Department of|City of|State of))/i
    ];
    for (const pattern of authorityPatterns) {
      const match = body.match(pattern);
      if (match && match[1]) {
        parsed.authority = match[1].trim();
        break;
      }
    }
  }
  
  // Extract status
  if (/(?:action required|attention needed|correction|revision|needs|missing|incomplete)/i.test(combined)) {
    parsed.status = 'action-required';
    parsed.priority = 'high';
  } else if (/(?:approved|accept|accepted|granted)/i.test(combined)) {
    parsed.status = 'approved';
    parsed.priority = 'low';
  } else if (/(?:submitted|received|acknowledged)/i.test(combined)) {
    parsed.status = 'submitted';
  } else {
    parsed.status = 'not-started';
  }
  
  // Extract location
  const locationPatterns = [
    /(?:in|at|located in|jurisdiction):\s*([A-Z][a-z]+(?:\s*,\s*[A-Z]{2})?)/i,
    /([A-Z][a-z]+(?:\s*,\s*[A-Z]{2}))/,
    /(?:city|municipality):\s*([A-Z][a-z]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      parsed.location = match[1].trim();
      break;
    }
  }
  
  // Extract deadline
  const deadlinePatterns = [
    /(?:due|deadline|by|before):\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /(?:due|deadline|by|before):\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i
  ];
  
  for (const pattern of deadlinePatterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      parsed.deadline = match[1].trim();
      break;
    }
  }
  
  // Extract fees
  const feeMatch = body.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (feeMatch) {
    parsed.fees = '$' + feeMatch[1];
  }
  
  return parsed;
}

/**
 * Handle create permit with form data
 */
function handleCreatePermit(e) {
  const formInputs = e.formInputs;
  const messageId = e.parameters.messageId;
  
  const permitName = formInputs.permitName?.[0] || '';
  const authority = formInputs.authority?.[0] || '';
  const status = formInputs.status?.[0] || 'not-started';
  
  if (!permitName.trim()) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('âŒ Please enter a permit name'))
      .build();
  }
  
  // Call Pilot MVP API (enhanced intake endpoint)
  const apiUrl = 'https://pilot-mvp.vercel.app/api/gmail/intake';
  const payload = {
    messageId: messageId,
    type: 'permit',
    permitName: permitName,
    authority: authority,
    status: status
  };
  
  try {
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.success) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText('âœ… Permit created: ' + result.permit.name))
        .setOpenLink(CardService.newOpenLink()
          .setUrl('https://pilot-mvp.vercel.app/clients/' + (result.permit.clientId || ''))
          .setOpenAs(CardService.OpenAs.FULL_SIZE))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText('âŒ Error: ' + (result.error || 'Failed to create permit')))
        .build();
    }
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('âŒ Error: ' + error.toString()))
      .build();
  }
}

/**
 * Handle create client with form data
 */
function handleCreateClient(e) {
  const formInputs = e.formInputs;
  const messageId = e.parameters.messageId;
  
  const clientName = formInputs.clientName?.[0] || '';
  const location = formInputs.location?.[0] || '';
  
  if (!clientName.trim()) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('âŒ Please enter a client name'))
      .build();
  }
  
  // Call Pilot MVP API (enhanced intake endpoint)
  const apiUrl = 'https://pilot-mvp.vercel.app/api/gmail/intake';
  const payload = {
    messageId: messageId,
    type: 'client',
    clientName: clientName,
    location: location
  };
  
  try {
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.success) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText('âœ… Client created: ' + result.client.businessName))
        .setOpenLink(CardService.newOpenLink()
          .setUrl('https://pilot-mvp.vercel.app/clients/' + result.client.id)
          .setOpenAs(CardService.OpenAs.FULL_SIZE))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText('âŒ Error: ' + (result.error || 'Failed to create client')))
        .build();
    }
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('âŒ Error: ' + error.toString()))
      .build();
  }
}

/**
 * Add email sender to Pilot Leads (Gmail add-on)
 */
function handleAddToLeads(e) {
  const formInputs = e.formInputs;
  const messageId = e.parameters.messageId || '';
  const subject = (e.parameters.subject || '').substring(0, 200);
  const name = (formInputs.leadName && formInputs.leadName[0]) ? String(formInputs.leadName[0]).trim() : '';
  const email = (formInputs.leadEmail && formInputs.leadEmail[0]) ? String(formInputs.leadEmail[0]).trim() : '';
  const company = (formInputs.leadCompany && formInputs.leadCompany[0]) ? String(formInputs.leadCompany[0]).trim() : '';

  if (!email) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Lead email is required'))
      .build();
  }
  if (!name) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Lead name is required'))
      .build();
  }

  const apiUrl = 'https://pilot-mvp.vercel.app/api/gmail/lead-intake';
  const payload = {
    name: name,
    email: email,
    company: company || undefined,
    notes: subject ? 'From email: ' + subject : undefined,
    messageId: messageId || undefined,
    subject: subject || undefined
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const result = JSON.parse(response.getContentText());

    if (result.success) {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText('Lead added: ' + result.lead.name + ' -> ' + (result.lead.stageName || 'New')))
        .setOpenLink(CardService.newOpenLink()
          .setUrl('https://pilot-mvp.vercel.app')
          .setOpenAs(CardService.OpenAs.FULL_SIZE))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText((result.error || 'Failed to add lead')))
        .build();
    }
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Error: ' + (error.message || error.toString())))
      .build();
  }
}

/**
 * Link email to existing record
 */
function linkToExisting(e) {
  const messageId = e.parameters.messageId;
  
  return CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
      .setUrl('https://pilot-mvp.vercel.app/gmail/link?messageId=' + messageId)
      .setOpenAs(CardService.OpenAs.FULL_SIZE))
    .build();
}

/**
 * Mark email as processed
 */
function markAsProcessed(e) {
  const messageId = e.parameters.messageId;
  const message = GmailApp.getMessageById(messageId);
  
  message.markRead();
  
  // Optionally add a label
  const label = GmailApp.getUserLabelByName('Pilot - Processed') || 
                GmailApp.createLabel('Pilot - Processed');
  message.addLabel(label);
  
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText('âœ… Email marked as processed'))
    .build();
}
