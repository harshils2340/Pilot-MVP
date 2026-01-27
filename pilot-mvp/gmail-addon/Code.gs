/**
 * Enhanced Gmail Add-on for Pilot MVP
 * Clean sidebar UI with quick intake forms
 * Appears automatically when emails are opened
 */

function onGmailMessage(e) {
  try {
    const messageId = e.gmail.messageId;

    if (!messageId) {
      var errorCard = CardService.newCardBuilder()
        .setHeader(CardService.newCardHeader()
          .setTitle('Pilot MVP')
          .setSubtitle('Error'))
        .addSection(CardService.newCardSection()
          .addWidget(CardService.newTextParagraph()
            .setText('Unable to load email. Please try opening the email again.')))
        .build();
      return [errorCard];
    }

    var message = null;
    try {
      message = GmailApp.getMessageById(messageId);
    } catch (error) {
      var errorCard2 = CardService.newCardBuilder()
        .setHeader(CardService.newCardHeader()
          .setTitle('Pilot MVP')
          .setSubtitle('Error'))
        .addSection(CardService.newCardSection()
          .addWidget(CardService.newTextParagraph()
            .setText('Unable to access email. Please check permissions.')))
        .build();
      return [errorCard2];
    }

    const subject = message.getSubject() || '';
    const from = message.getFrom() || '';
    const body = message.getPlainBody() || '';

    const parsedData = parseEmailContent(subject, body, from);

    var clientLeadInfo = null;
    if (parsedData.fromEmail) {
      try {
        clientLeadInfo = lookupClientOrLead(parsedData.fromEmail);
      } catch (error) {
        // Continue without lookup info
      }
    }

    const card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader()
        .setTitle('Pilot MVP')
        .setSubtitle('Client & Lead Information'));

    if (clientLeadInfo && clientLeadInfo.found) {
      card.addSection(createClientLeadInfoSection(clientLeadInfo, parsedData.fromEmail));
    }

    card.addSection(createNewLeadPanel(parsedData, messageId, subject));

    return [card.build()];
  } catch (error) {
    var errorCard3 = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader()
        .setTitle('Pilot MVP')
        .setSubtitle('Error'))
      .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextParagraph()
          .setText('An error occurred. Please refresh and try again.')))
      .build();
    return [errorCard3];
  }
}

function lookupClientOrLead(email) {
  if (!email) return null;

  try {
    const apiUrl = 'https://pilot-mvp.vercel.app/api/gmail/lookup?email=' + encodeURIComponent(email);
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const responseCode = response.getResponseCode();
    if (responseCode === 200) {
      try {
        return JSON.parse(response.getContentText());
      } catch (parseError) {
        return null;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

function createClientLeadInfoSection(info, email) {
  const section = CardService.newCardSection()
    .setHeader('Client & Lead Information');

  if (!info.client && !info.lead) {
    section.addWidget(CardService.newTextParagraph()
      .setText('No existing client or lead found.'));
    return section;
  }

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

    section.addWidget(CardService.newTextButton()
      .setText('View Client in Pilot')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('openInPilot')
        .setParameters({ type: 'client', id: info.client._id })));

    section.addWidget(CardService.newDivider());
  }

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

    section.addWidget(CardService.newTextButton()
      .setText('View Lead in Pilot')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('openInPilot')
        .setParameters({ type: 'lead', id: info.lead._id })));
  }

  return section;
}

function createNewLeadPanel(parsedData, messageId, subject) {
  const section = CardService.newCardSection()
    .setHeader('New Lead');

  section.addWidget(CardService.newTextInput()
    .setFieldName('leadName')
    .setTitle('Name')
    .setValue(parsedData.clientName || parsedData.businessName || '')
    .setHint('Lead name from email sender'));

  section.addWidget(CardService.newTextInput()
    .setFieldName('leadEmail')
    .setTitle('Email')
    .setValue(parsedData.fromEmail || '')
    .setHint('Email address (required)'));

  section.addWidget(CardService.newTextInput()
    .setFieldName('leadCompany')
    .setTitle('Company')
    .setValue(parsedData.businessName || '')
    .setHint('Company or business name (optional)'));

  section.addWidget(CardService.newTextInput()
    .setFieldName('leadPhone')
    .setTitle('Phone')
    .setValue('')
    .setHint('Phone number (optional)'));

  section.addWidget(CardService.newTextInput()
    .setFieldName('leadNotes')
    .setTitle('Note')
    .setValue(subject ? 'From email: ' + subject : '')
    .setHint('Additional notes or context (optional)'));

  section.addWidget(CardService.newButtonSet()
    .addButton(CardService.newTextButton()
      .setText('Close')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('handleClosePanel')
        .setParameters({ messageId: messageId })))
    .addButton(CardService.newTextButton()
      .setText('Save Changes')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('handleSaveChanges')
        .setParameters({ messageId: messageId, subject: subject || '' })))
    .addButton(CardService.newTextButton()
      .setText('Add to Leads')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(CardService.newAction()
        .setFunctionName('handleAddToLeads')
        .setParameters({ messageId: messageId, subject: subject || '' }))));

  return section;
}

function openInPilot(e) {
  const type = e.parameters.type;
  const id = e.parameters.id;
  
  var url = 'https://pilot-mvp.vercel.app';
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

function handleClosePanel(e) {
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText('Form cleared. You can continue editing or add to leads.'))
    .build();
}

function handleSaveChanges(e) {
  const formInputs = e.formInputs;
  const messageId = e.parameters.messageId || '';
  const subject = (e.parameters.subject || '').substring(0, 200);
  
  // Extract form values
  const name = (formInputs.leadName && formInputs.leadName[0]) ? formInputs.leadName[0].trim() : '';
  const email = (formInputs.leadEmail && formInputs.leadEmail[0]) ? formInputs.leadEmail[0].trim() : '';
  const company = (formInputs.leadCompany && formInputs.leadCompany[0]) ? formInputs.leadCompany[0].trim() : '';
  const phone = (formInputs.leadPhone && formInputs.leadPhone[0]) ? formInputs.leadPhone[0].trim() : '';
  const notes = (formInputs.leadNotes && formInputs.leadNotes[0]) ? formInputs.leadNotes[0].trim() : '';
  
  // Validate required fields
  if (!email) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Email is required'))
      .build();
  }
  if (!name) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Name is required'))
      .build();
  }
  
  // Show confirmation that form is ready
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText('Form data saved. Ready to add to leads.'))
    .build();
}

function handleAddToLeads(e) {
  const formInputs = e.formInputs;
  const messageId = e.parameters.messageId || '';
  const subject = (e.parameters.subject || '').substring(0, 200);
  
  // Extract form values
  const name = (formInputs.leadName && formInputs.leadName[0]) ? formInputs.leadName[0].trim() : '';
  const email = (formInputs.leadEmail && formInputs.leadEmail[0]) ? formInputs.leadEmail[0].trim() : '';
  const company = (formInputs.leadCompany && formInputs.leadCompany[0]) ? formInputs.leadCompany[0].trim() : '';
  const phone = (formInputs.leadPhone && formInputs.leadPhone[0]) ? formInputs.leadPhone[0].trim() : '';
  const notes = (formInputs.leadNotes && formInputs.leadNotes[0]) ? formInputs.leadNotes[0].trim() : '';

  // Validation
  if (!email) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Email is required'))
      .build();
  }
  if (!name) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Name is required'))
      .build();
  }

  // Use /api/crm/leads (same domain, known to accept POST)
  const apiUrl = 'https://pilot-mvp.vercel.app/api/crm/leads';
  const payload = {
    name: name,
    email: email,
    company: company || undefined,
    phone: phone || undefined,
    notes: notes || (subject ? 'From email: ' + subject : undefined),
    source: 'email',
    permitRelated: true
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    // CRM API returns 201 on create; treat 200 or 201 as success
    if (responseCode !== 200 && responseCode !== 201) {
      // Try to parse error response
      var errorMessage = 'Failed to add lead';
      try {
        const errorResult = JSON.parse(responseText);
        errorMessage = errorResult.error || errorMessage;
      } catch (parseError) {
        if (responseCode === 405) {
          errorMessage = 'Method not allowed. Please ensure the API is deployed and try again.';
        } else {
          errorMessage = 'HTTP ' + responseCode + ': ' + (responseText.substring(0, 100) || 'Unknown error');
        }
      }
      return CardService.newActionResponseBuilder()
        .setNotification(CardService.newNotification()
          .setText('Error: ' + errorMessage))
        .build();
    }
    
    const result = JSON.parse(responseText);

    if (result.success && result.lead) {
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
          .setText('Error: ' + (result.error || 'Failed to add lead')))
        .build();
    }
  } catch (error) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Error: ' + (error.message || error.toString())))
      .build();
  }
}

function parseEmailContent(subject, body, from) {
  const parsed = {
    clientName: null,
    businessName: null,
    fromEmail: null
  };

  // Extract email and name from "From" field
  const fromMatch = from.match(/([^<]+)\s*<(.+)>/);
  if (fromMatch) {
    parsed.clientName = fromMatch[1].trim();
    parsed.businessName = fromMatch[1].trim();
    parsed.fromEmail = fromMatch[2].trim();
  } else {
    // If no name, try to extract from email address
    const emailParts = from.split('@');
    if (emailParts.length > 1) {
      parsed.fromEmail = from.trim();
      const domain = emailParts[1].toLowerCase();
      // Only extract name if it's not a government/authority email
      if (!domain.includes('gov') && !domain.includes('city') && !domain.includes('department')) {
        parsed.clientName = emailParts[0].replace(/[._]/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
        parsed.businessName = parsed.clientName;
      }
    }
  }

  return parsed;
}
