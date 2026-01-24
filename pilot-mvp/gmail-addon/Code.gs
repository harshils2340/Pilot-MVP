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
  
  // Build main intake card
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('📋 Quick Intake')
      .setSubtitle('Create records from this email'))
    .addSection(createParsedDataSection(parsedData))
    .addSection(createQuickIntakeSection(parsedData, messageId, subject, body, from))
    .addSection(createActionsSection(parsedData, messageId))
    .build();
  
  return [card];
}

/**
 * Show parsed data from email (auto-detected)
 */
function createParsedDataSection(parsedData) {
  const section = CardService.newCardSection()
    .setHeader('✨ Auto-Detected from Email');
  
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
    const statusEmoji = parsedData.status === 'action-required' ? '🔴' : 
                       parsedData.status === 'approved' ? '✅' : '🟡';
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
    .setHeader('⚡ Quick Intake Forms');
  
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
    .setText('✅ Create Permit')
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
    .setText('👤 Create Client')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction()
      .setFunctionName('handleCreateClient')
      .setParameters({ messageId: messageId })));
  
  return section;
}

/**
 * Additional actions section
 */
function createActionsSection(parsedData, messageId) {
  const section = CardService.newCardSection()
    .setHeader('🔗 Additional Actions');
  
  // Link to existing
  section.addWidget(CardService.newTextButton()
    .setText('🔗 Link to Existing Record')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('linkToExisting')
      .setParameters({ messageId: messageId })));
  
  // Open in Pilot
  section.addWidget(CardService.newTextButton()
    .setText('🚀 Open in Pilot Dashboard')
    .setOpenLink(CardService.newOpenLink()
      .setUrl('https://pilot-mvp.vercel.app')
      .setOpenAs(CardService.OpenAs.FULL_SIZE)));
  
  // Mark as processed
  section.addWidget(CardService.newTextButton()
    .setText('✅ Mark as Processed')
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
  } else {
    // Try to extract from email domain
    const emailParts = from.split('@');
    if (emailParts.length > 1) {
      const domain = emailParts[1].toLowerCase();
      if (!domain.includes('gov') && !domain.includes('city') && !domain.includes('department')) {
        parsed.clientName = emailParts[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
        .setText('❌ Please enter a permit name'))
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
          .setText('✅ Permit created: ' + result.permit.name))
        .setOpenLink(CardService.newOpenLink()
          .setUrl('https://pilot-mvp.vercel.app/clients/' + (result.permit.clientId || ''))
          .setOpenAs(CardService.OpenAs.FULL_SIZE)))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText('❌ Error: ' + (result.error || 'Failed to create permit')))
        .build();
    }
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('❌ Error: ' + error.toString()))
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
        .setText('❌ Please enter a client name'))
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
          .setText('✅ Client created: ' + result.client.businessName))
        .setOpenLink(CardService.newOpenLink()
          .setUrl('https://pilot-mvp.vercel.app/clients/' + result.client.id)
          .setOpenAs(CardService.OpenAs.FULL_SIZE)))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText('❌ Error: ' + (result.error || 'Failed to create client')))
        .build();
    }
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('❌ Error: ' + error.toString()))
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
      .setOpenAs(CardService.OpenAs.FULL_SIZE)))
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
      .setText('✅ Email marked as processed'))
    .build();
}

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
  
  // Build main intake card
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('📋 Quick Intake')
      .setSubtitle('Create records from this email'))
    .addSection(createParsedDataSection(parsedData))
    .addSection(createQuickIntakeSection(parsedData, messageId, subject, body, from))
    .addSection(createActionsSection(parsedData, messageId))
    .build();
  
  return [card];
}

/**
 * Show parsed data from email (auto-detected)
 */
function createParsedDataSection(parsedData) {
  const section = CardService.newCardSection()
    .setHeader('✨ Auto-Detected from Email');
  
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
    const statusEmoji = parsedData.status === 'action-required' ? '🔴' : 
                       parsedData.status === 'approved' ? '✅' : '🟡';
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
    .setHeader('⚡ Quick Intake Forms');
  
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
    .setText('✅ Create Permit')
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
    .setText('👤 Create Client')
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction()
      .setFunctionName('handleCreateClient')
      .setParameters({ messageId: messageId })));
  
  return section;
}

/**
 * Additional actions section
 */
function createActionsSection(parsedData, messageId) {
  const section = CardService.newCardSection()
    .setHeader('🔗 Additional Actions');
  
  // Link to existing
  section.addWidget(CardService.newTextButton()
    .setText('🔗 Link to Existing Record')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('linkToExisting')
      .setParameters({ messageId: messageId })));
  
  // Open in Pilot
  section.addWidget(CardService.newTextButton()
    .setText('🚀 Open in Pilot Dashboard')
    .setOpenLink(CardService.newOpenLink()
      .setUrl('https://pilot-mvp.vercel.app')
      .setOpenAs(CardService.OpenAs.FULL_SIZE)));
  
  // Mark as processed
  section.addWidget(CardService.newTextButton()
    .setText('✅ Mark as Processed')
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
  } else {
    // Try to extract from email domain
    const emailParts = from.split('@');
    if (emailParts.length > 1) {
      const domain = emailParts[1].toLowerCase();
      if (!domain.includes('gov') && !domain.includes('city') && !domain.includes('department')) {
        parsed.clientName = emailParts[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
        .setText('❌ Please enter a permit name'))
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
          .setText('✅ Permit created: ' + result.permit.name))
        .setOpenLink(CardService.newOpenLink()
          .setUrl('https://pilot-mvp.vercel.app/clients/' + (result.permit.clientId || ''))
          .setOpenAs(CardService.OpenAs.FULL_SIZE)))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText('❌ Error: ' + (result.error || 'Failed to create permit')))
        .build();
    }
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('❌ Error: ' + error.toString()))
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
        .setText('❌ Please enter a client name'))
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
          .setText('✅ Client created: ' + result.client.businessName))
        .setOpenLink(CardService.newOpenLink()
          .setUrl('https://pilot-mvp.vercel.app/clients/' + result.client.id)
          .setOpenAs(CardService.OpenAs.FULL_SIZE)))
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText('❌ Error: ' + (result.error || 'Failed to create client')))
        .build();
    }
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('❌ Error: ' + error.toString()))
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
      .setOpenAs(CardService.OpenAs.FULL_SIZE)))
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
      .setText('✅ Email marked as processed'))
    .build();
}
