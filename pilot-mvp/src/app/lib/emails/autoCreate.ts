/**
 * Auto-create clients and permits from parsed email content
 */

import { ParsedEmailContent } from './parser';

export interface AutoCreateResult {
  success: boolean;
  clientCreated?: boolean;
  permitCreated?: boolean;
  clientId?: string;
  permitId?: string;
  actions?: string[];
  errors?: string[];
}

/**
 * Automatically create clients and permits from email data
 */
export async function autoCreateFromEmail(
  emailId: string,
  parsedData: ParsedEmailContent,
  emailRecord: any
): Promise<AutoCreateResult> {
  const result: AutoCreateResult = {
    success: true,
    actions: [],
    errors: [],
  };
  
  try {
    // For now, just log what would be created
    // Full implementation would create client/permit records in database
    
    if (parsedData.clientName) {
      result.actions?.push(`Would create client: ${parsedData.clientName}`);
    }
    
    if (parsedData.permitName) {
      result.actions?.push(`Would create permit: ${parsedData.permitName}`);
    }
    
    console.log(`📧 Auto-create from email ${emailId}:`, result.actions);
    
    return result;
  } catch (error: any) {
    console.error('Error in auto-create:', error);
    result.success = false;
    result.errors?.push(error.message);
    return result;
  }
}

