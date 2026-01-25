/**
 * Odoo Email Parser - Ported from Odoo's mail_thread.py
 * 
 * This module ports Odoo's email parsing logic to TypeScript/Node.js
 * Based on: odoo/addons/mail/models/mail_thread.py
 * 
 * Key methods ported:
 * - message_parse() - Main email parsing method
 * - _message_parse_extract_payload() - Extract body and attachments
 * - _message_parse_extract_bounce() - Detect bounce emails
 * - message_new() - Create records from emails
 */

import { simpleParser, ParsedMail } from 'mailparser';

export interface OdooParsedMessage {
  message_id: string;
  subject?: string;
  email_from?: string;
  from?: string;
  to?: string;
  cc?: string;
  recipients?: string;
  partner_ids?: number[];
  body?: string;
  htmlBody?: string;
  references?: string;
  in_reply_to?: string;
  is_bounce?: boolean;
  parent_id?: number;
  is_internal?: boolean;
  date?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    info?: {
      encoding?: string;
      cid?: string;
    };
  }>;
  message_type?: string;
}

export interface OdooAttachment {
  filename: string;
  content: Buffer | string;
  info?: {
    encoding?: string;
    cid?: string;
  };
}

/**
 * Parse email message using Odoo's parsing logic
 * Ported from: mail_thread.message_parse()
 */
export async function odooMessageParse(
  messageRaw: string | Buffer,
  saveOriginal: boolean = false
): Promise<OdooParsedMessage> {
  // Parse email using mailparser (Node.js equivalent of Python's email.message)
  const message = await simpleParser(messageRaw);
  
  const msgDict: OdooParsedMessage = {
    message_id: '',
    message_type: 'email',
  };

  // Extract Message-ID
  const messageId = message.messageId;
  if (!messageId) {
    msgDict.message_id = `<${Date.now()}@localhost>`;
  } else {
    msgDict.message_id = messageId.trim();
  }

  // Extract Subject
  if (message.subject) {
    msgDict.subject = message.subject;
  }

  // Extract From
  if (message.from) {
    const emailFrom = message.from.text || message.from.value?.[0]?.address || '';
    msgDict.email_from = emailFrom;
    msgDict.from = emailFrom; // compatibility
  }

  // Extract To, CC, Recipients
  const toValue = Array.isArray(message.to) ? message.to : (message.to as any)?.value || message.to;
  const ccValue = Array.isArray(message.cc) ? message.cc : (message.cc as any)?.value || message.cc;
  const toAddresses = Array.isArray(toValue) ? toValue.map((v: any) => v.address || v).join(',') : (toValue?.address || toValue || '');
  const ccAddresses = Array.isArray(ccValue) ? ccValue.map((v: any) => v.address || v).join(',') : (ccValue?.address || ccValue || '');
  const deliveredTo = message.headers.get('delivered-to') || '';
  
  msgDict.recipients = [deliveredTo, toAddresses, ccAddresses].filter(Boolean).join(',');
  msgDict.to = [deliveredTo, toAddresses].filter(Boolean).join(',');
  msgDict.cc = ccAddresses;

  // Extract References and In-Reply-To
  const references = message.references;
  if (references) {
    msgDict.references = Array.isArray(references) ? references.join(' ') : references;
  }

  const inReplyTo = message.inReplyTo;
  if (inReplyTo) {
    msgDict.in_reply_to = Array.isArray(inReplyTo) ? inReplyTo[0] : inReplyTo;
  }

  // Extract Date
  if (message.date) {
    msgDict.date = message.date.toISOString();
  } else {
    msgDict.date = new Date().toISOString();
  }

  // Extract payload (body and attachments) - Odoo's _message_parse_extract_payload
  const payload = extractPayloadFromParsedMail(message, msgDict, saveOriginal);
  msgDict.body = payload.body;
  msgDict.htmlBody = payload.htmlBody;
  msgDict.attachments = payload.attachments;

  // Detect bounce - Odoo's _message_parse_extract_bounce
  const bounceInfo = detectBounce(message, msgDict);
  msgDict.is_bounce = bounceInfo.is_bounce;

  return msgDict;
}

/**
 * Extract body and attachments from parsed mail (mailparser)
 * Ported from: mail_thread._message_parse_extract_payload()
 */
function extractPayloadFromParsedMail(
  message: ParsedMail,
  messageDict: OdooParsedMessage,
  saveOriginal: boolean
): {
  body: string;
  htmlBody?: string;
  attachments: OdooAttachment[];
} {
  const attachments: OdooAttachment[] = [];
  let body = '';
  let htmlBody = '';

  // Extract text and HTML body (mailparser already handles this)
  if (message.text) {
    // Convert plain text to HTML <pre> (Odoo pattern)
    body = `<pre>${escapeHtml(message.text)}</pre>`;
  }

  if (message.html) {
    htmlBody = message.html;
    // If no plain text, use HTML as body
    if (!body) {
      body = htmlToPlainText(htmlBody);
    }
  }

  // Extract attachments (mailparser already parses these)
  if (message.attachments) {
    for (const attachment of message.attachments) {
      attachments.push({
        filename: attachment.filename || 'attachment',
        content: attachment.content || Buffer.alloc(0),
        info: {
          encoding: attachment.contentType,
          cid: attachment.cid,
        },
      });
    }
  }

  return {
    body: body || htmlBody || '',
    htmlBody: htmlBody || undefined,
    attachments,
  };
}

/**
 * Detect bounce emails
 * Ported from: mail_thread._message_parse_extract_bounce()
 */
function detectBounce(
  message: ParsedMail,
  messageDict: OdooParsedMessage
): { is_bounce: boolean; bounced_email?: string } {
  // Check for bounce indicators
  const subject = (messageDict.subject || '').toLowerCase();
  const body = (messageDict.body || message.text || '').toLowerCase();

  const bounceKeywords = [
    'undelivered mail',
    'mail delivery failed',
    'delivery failure',
    'returned mail',
    'mailer-daemon',
    'postmaster',
    'bounce',
    'failure notice',
  ];

  const isBounce = bounceKeywords.some(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  );

  if (!isBounce) {
    return { is_bounce: false };
  }

  // Try to extract bounced email from headers - using type assertion since header type is complex
  const headers = message.headers as any;
  const finalRecipient = headers?.get?.('final-recipient');
  let bouncedEmail: string | undefined;

  if (finalRecipient && typeof finalRecipient === 'string' && finalRecipient.includes(';')) {
    const parts = finalRecipient.split(';');
    if (parts.length > 1) {
      bouncedEmail = parts[1].trim();
    }
  }

  return {
    is_bounce: true,
    bounced_email: bouncedEmail,
  };
}

/**
 * Convert HTML to plain text
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Create new record from parsed email (Odoo's message_new pattern)
 */
export function odooMessageNew(
  msgDict: OdooParsedMessage,
  customValues?: Record<string, any>
): Record<string, any> {
  const data: Record<string, any> = customValues ? { ...customValues } : {};
  
  // Set name from subject (Odoo pattern)
  if (!data.name && msgDict.subject) {
    data.name = msgDict.subject;
  }
  
  // Set email from email_from (Odoo pattern)
  if (msgDict.email_from) {
    data.email = msgDict.email_from;
  }
  
  return data;
}
