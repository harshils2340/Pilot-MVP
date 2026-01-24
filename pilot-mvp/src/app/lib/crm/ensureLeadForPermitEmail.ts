import connectToDB from '@/app/lib/mongodb';
import { Lead } from '@/app/lib/crm/leadSchema';
import { PipelineStage, initializeDefaultStages } from '@/app/lib/crm/pipelineSchema';
import { PermitEmail } from '@/app/lib/emails/schema';

export interface EnsureLeadParams {
  emailId: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  receivedAt: Date;
}

/**
 * Create or update a lead for a permit-related email.
 * - If no lead exists for the sender email → create a new lead (permitRelated: true).
 * - If lead exists → add this email to their history and update counts/name/company.
 * Returns the lead ID if created/updated, or null if skipped (e.g. email already tracked).
 */
export async function ensureLeadForPermitEmail(params: EnsureLeadParams): Promise<string | null> {
  const { emailId, fromEmail, fromName, subject, receivedAt } = params;
  await connectToDB();

  const normalizedEmail = fromEmail.toLowerCase().trim();
  if (!normalizedEmail) return null;

  const leadName =
    fromName && fromName.trim().length > 0
      ? fromName.trim()
      : fromEmail.split('@')[0].replace(/[._-]/g, ' ');
  const leadCompany = fromEmail.split('@')[1]?.split('.')[0] || undefined;

  const existingLead = await Lead.findOne({ email: normalizedEmail }).lean();

  if (existingLead) {
    const emailAlreadyTracked = existingLead.emails?.some(
      (e: any) => e.emailId?.toString() === emailId
    );
    if (emailAlreadyTracked) return existingLead._id.toString();

    const emailEntry = {
      emailId,
      subject,
      receivedAt,
      direction: 'inbound' as const,
    };

    const updateData: any = {
      $inc: { emailCount: 1 },
      $set: {
        lastEmailDate: receivedAt,
        permitRelated: true,
      },
      $push: { emails: emailEntry },
    };

    if (!existingLead.firstEmailDate) {
      updateData.$set.firstEmailDate = receivedAt;
    }

    if (fromName && fromName.trim().length > 0) {
      const currentName = (existingLead.name || '').trim();
      if (fromName.trim().length > currentName.length || currentName.length === 0) {
        updateData.$set.name = fromName.trim();
      }
    }

    if (leadCompany && leadCompany.length > 0) {
      const currentCompany = existingLead.company || '';
      if (leadCompany.length > currentCompany.length || currentCompany.length === 0) {
        updateData.$set.company = leadCompany;
      }
    }

    await Lead.findByIdAndUpdate(existingLead._id, updateData);
    return existingLead._id.toString();
  }

  await initializeDefaultStages();
  const firstStage = await PipelineStage.findOne().sort({ sequence: 1 }).lean();
  if (!firstStage) {
    console.error('ensureLeadForPermitEmail: No pipeline stages found');
    return null;
  }

  try {
    const newLead: any = new Lead({
      name: leadName,
      email: normalizedEmail,
      company: leadCompany,
      source: 'gmail',
      status: 'new',
      permitRelated: true,
      stageId: firstStage._id.toString(),
      stageName: firstStage.name,
      probability: firstStage.probability,
      emailCount: 1,
      firstEmailDate: receivedAt,
      lastEmailDate: receivedAt,
      emails: [
        {
          emailId,
          subject,
          receivedAt,
          direction: 'inbound',
        },
      ],
    });
    await newLead.save();
    return newLead._id.toString();
  } catch (err: any) {
    if (err.code === 11000 || err.message?.includes('duplicate key')) {
      const raceLead = await Lead.findOne({ email: normalizedEmail }).lean();
      if (raceLead) {
        const alreadyTracked = raceLead.emails?.some((e: any) => e.emailId?.toString() === emailId);
        if (alreadyTracked) return raceLead._id.toString();
        await Lead.findByIdAndUpdate(raceLead._id, {
          $inc: { emailCount: 1 },
          $set: { lastEmailDate: receivedAt, permitRelated: true },
          $push: {
            emails: { emailId, subject, receivedAt, direction: 'inbound' as const },
          },
        });
        return raceLead._id.toString();
      }
    }
    throw err;
  }
}

const PERMIT_KEYWORDS = ['permit', 'permits', 'licensing', 'licencing', 'license', 'licence'];
const PROMO_DOMAINS = ['expedia', 'booking', 'amazon', 'paypal', 'facebook', 'instagram', 'twitter', 'linkedin', 'netflix', 'spotify', 'uber', 'lyft', 'doordash'];

function isPermitRelatedEmail(email: { subject?: string; body?: string; permitId?: string; clientId?: string }): boolean {
  const sub = (email.subject || '').toLowerCase();
  const body = (email.body || '').toLowerCase();
  const hasKeyword = PERMIT_KEYWORDS.some((k) => sub.includes(k) || body.includes(k));
  return !!(hasKeyword || email.permitId || email.clientId);
}

function isCityOrPromoSender(fromEmail: string): boolean {
  const lower = fromEmail.toLowerCase();
  const isCity = lower.includes('@gov') || lower.includes('@city') || lower.includes('@department') || lower.includes('noreply') || lower.includes('no-reply');
  const isPromo = PROMO_DOMAINS.some((d) => lower.includes(`@${d}`) || lower.endsWith(d));
  return isCity || isPromo;
}

/**
 * Backfill leads from existing permit-related emails in Permit Inbox (PermitEmail).
 * Creates or updates leads for each such email so they show up on the Leads page.
 */
export async function backfillLeadsFromPermitEmails(): Promise<{ processed: number; createdOrUpdated: number }> {
  await connectToDB();

  const emails = await PermitEmail.find({ direction: 'inbound' })
    .sort({ receivedAt: -1 })
    .limit(1000)
    .lean();

  let processed = 0;
  let createdOrUpdated = 0;

  for (const e of emails) {
    if (!isPermitRelatedEmail(e)) continue;
    const fromEmail = (e.from?.email || '').trim();
    if (!fromEmail || isCityOrPromoSender(fromEmail)) continue;

    processed++;
    try {
      const receivedAt = e.receivedAt ? new Date(e.receivedAt) : new Date();
      const leadId = await ensureLeadForPermitEmail({
        emailId: e._id.toString(),
        fromEmail,
        fromName: (e.from?.name || '').trim(),
        subject: e.subject || '(No Subject)',
        receivedAt,
      });
      if (leadId) createdOrUpdated++;
    } catch (err) {
      console.warn(`backfillLeadsFromPermitEmails: skip email ${e._id} from ${fromEmail}:`, (err as Error).message);
    }
  }

  return { processed, createdOrUpdated };
}
