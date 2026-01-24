/**
 * Email Content Parser
 * Extracts permit-related information from email content
 */

export interface ParsedEmailContent {
  permitName?: string;
  permitType?: string;
  clientName?: string;
  businessName?: string;
  status?: string;
  priority?: 'high' | 'medium' | 'low';
  actionRequired?: string;
  dueDate?: Date;
  referenceNumber?: string;
  messageId?: string;
  references?: string;
  inReplyTo?: string;
  isBounce?: boolean;
  attachments?: any[];
}

/**
 * Parse email content to extract permit-related information
 */
export function parseEmailContent(
  subject: string,
  body: string,
  fromEmail: string,
  fromName: string
): ParsedEmailContent {
  const result: ParsedEmailContent = {};
  
  const subjectLower = subject.toLowerCase();
  const bodyLower = body.toLowerCase();
  
  // Try to extract permit type from subject
  const permitTypes = [
    'business license',
    'health permit',
    'fire permit',
    'building permit',
    'food handler',
    'liquor license',
    'sign permit',
    'zoning',
    'conditional use',
  ];
  
  for (const type of permitTypes) {
    if (subjectLower.includes(type) || bodyLower.includes(type)) {
      result.permitType = type;
      result.permitName = subject;
      break;
    }
  }
  
  // Determine priority based on keywords
  const highPriorityKeywords = ['urgent', 'immediate', 'deadline', 'expiring', 'overdue', 'action required'];
  const lowPriorityKeywords = ['reminder', 'update', 'newsletter', 'information'];
  
  if (highPriorityKeywords.some(kw => subjectLower.includes(kw) || bodyLower.includes(kw))) {
    result.priority = 'high';
  } else if (lowPriorityKeywords.some(kw => subjectLower.includes(kw) || bodyLower.includes(kw))) {
    result.priority = 'low';
  } else {
    result.priority = 'medium';
  }
  
  // Try to extract status
  const statusKeywords = {
    'approved': 'approved',
    'denied': 'denied',
    'rejected': 'rejected',
    'pending': 'pending',
    'under review': 'under-review',
    'submitted': 'submitted',
    'received': 'received',
  };
  
  for (const [keyword, status] of Object.entries(statusKeywords)) {
    if (subjectLower.includes(keyword) || bodyLower.includes(keyword)) {
      result.status = status;
      break;
    }
  }
  
  // Try to extract reference number
  const refPatterns = [
    /ref(?:erence)?[#:\s]+([A-Z0-9-]+)/i,
    /permit[#:\s]+([A-Z0-9-]+)/i,
    /application[#:\s]+([A-Z0-9-]+)/i,
    /case[#:\s]+([A-Z0-9-]+)/i,
  ];
  
  for (const pattern of refPatterns) {
    const match = subject.match(pattern) || body.match(pattern);
    if (match) {
      result.referenceNumber = match[1];
      break;
    }
  }
  
  // Use sender name as potential client name
  if (fromName && !fromName.includes('@')) {
    result.clientName = fromName;
  }
  
  // Check for action required
  if (subjectLower.includes('action required') || bodyLower.includes('action required')) {
    result.actionRequired = 'Response needed';
  }
  
  return result;
}

