/**
 * Demo permit data for jurisdiction-specific permit plans.
 * Shared between PermitPlan and PermitDetailView for consistent permit lookup.
 */

export interface DemoPermit {
  id: string;
  name: string;
  authority: string;
  municipality: string;
  status: 'not-started' | 'submitted' | 'action-required' | 'approved';
  order: number;
  blockedBy?: string;
  blocks: string[];
  lastActivity: string;
  lastActivityDate: string;
  daysInState: number;
  assignee?: {
    name: string;
    initials: string;
    color: string;
  };
  priority?: 'high' | 'medium' | 'low';
  formTitle?: string;
  formCode?: string;
  formUrl?: string; // URL to the actual government fillable PDF form
}

export const JURISDICTION_PERMITS: Record<string, DemoPermit[]> = {
  'San Francisco': [
    {
      id: 'sf-1',
      name: "Seller's Permit",
      authority: 'California CDTFA',
      municipality: 'State of California',
      status: 'approved',
      order: 1,
      blocks: [],
      lastActivity: 'Approved',
      lastActivityDate: 'Nov 28, 2024',
      daysInState: 45,
      assignee: { name: 'Sarah Chen', initials: 'SC', color: 'bg-green-500' },
      formTitle: "Seller's Permit Application",
      formCode: 'CDTFA-401-A',
    },
    {
      id: 'sf-2',
      name: 'Food Service Establishment Permit',
      authority: 'SF Dept. of Public Health',
      municipality: 'San Francisco',
      status: 'submitted',
      order: 2,
      blocks: [],
      lastActivity: 'Awaiting city review',
      lastActivityDate: 'Dec 15, 2024',
      daysInState: 8,
      assignee: { name: 'Sarah Chen', initials: 'SC', color: 'bg-green-500' },
      formTitle: 'Food Service Establishment Permit Application',
      formCode: 'Form FSE-01',
      formUrl: 'https://www.sf.gov/file/electrical-permit-application-worksheet',
    },
    {
      id: 'sf-3',
      name: 'Health Department Plan Review',
      authority: 'SF Dept. of Public Health',
      municipality: 'San Francisco',
      status: 'action-required',
      order: 3,
      blocks: ['Business Operating Permit'],
      lastActivity: 'City requested revisions',
      lastActivityDate: 'Dec 18, 2024',
      daysInState: 5,
      priority: 'high',
      assignee: { name: 'Sarah Chen', initials: 'SC', color: 'bg-green-500' },
      formTitle: 'Health Permit Application',
      formCode: 'Form EH-01',
      formUrl: 'https://www.sf.gov/file/electrical-permit-application-worksheet',
    },
    {
      id: 'sf-4',
      name: 'Business Operating Permit',
      authority: 'City of San Francisco',
      municipality: 'San Francisco',
      status: 'not-started',
      order: 4,
      blockedBy: 'Health Department Plan Review',
      blocks: ['Fire Department Inspection'],
      lastActivity: 'Blocked',
      lastActivityDate: 'Dec 5, 2024',
      daysInState: 18,
      assignee: { name: 'Michael Park', initials: 'MP', color: 'bg-blue-500' },
      formTitle: 'Business Operating Permit Application',
      formCode: 'Form BOP-100',
      formUrl: 'https://www.sf.gov/file/electrical-permit-application-worksheet',
    },
    {
      id: 'sf-5',
      name: 'Building Modification Permit',
      authority: 'SF Dept. of Building Inspection',
      municipality: 'San Francisco',
      status: 'not-started',
      order: 5,
      blocks: ['Fire Department Inspection'],
      lastActivity: 'Not Started',
      lastActivityDate: 'Dec 5, 2024',
      daysInState: 18,
      assignee: { name: 'Michael Park', initials: 'MP', color: 'bg-blue-500' },
      formTitle: 'Building Modification Permit Application',
      formCode: 'Form BMP-200',
    },
    {
      id: 'sf-6',
      name: 'Fire Department Inspection',
      authority: 'San Francisco Fire Department',
      municipality: 'San Francisco',
      status: 'not-started',
      order: 6,
      blockedBy: 'Building Modification Permit',
      blocks: [],
      lastActivity: 'Blocked',
      lastActivityDate: 'Dec 5, 2024',
      daysInState: 18,
      formTitle: 'Fire Safety Inspection Request',
      formCode: 'Form FD-300',
    },
  ],
  Calgary: [
    {
      id: 'cal-1',
      name: 'Business Licence',
      authority: 'City of Calgary',
      municipality: 'Calgary',
      status: 'not-started',
      order: 1,
      blocks: [],
      lastActivity: 'Not Started',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Business Licence Application',
      formCode: 'Form BL-100',
    },
    {
      id: 'cal-2',
      name: 'Food Handling Permit',
      authority: 'Alberta Health Services',
      municipality: 'Calgary',
      status: 'not-started',
      order: 2,
      blocks: [],
      lastActivity: 'Not Started',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Food Handling Permit Application',
      formCode: 'Form FH-200',
    },
    {
      id: 'cal-3',
      name: 'Development Permit',
      authority: 'City of Calgary Planning',
      municipality: 'Calgary',
      status: 'not-started',
      order: 3,
      blocks: ['Building Permit'],
      lastActivity: 'Not Started',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Development Permit Application',
      formCode: 'Form DP-300',
    },
    {
      id: 'cal-4',
      name: 'Building Permit',
      authority: 'City of Calgary Building Services',
      municipality: 'Calgary',
      status: 'not-started',
      order: 4,
      blockedBy: 'Development Permit',
      blocks: [],
      lastActivity: 'Blocked',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Building Permit Application',
      formCode: 'Form BP-400',
    },
    {
      id: 'cal-5',
      name: 'Fire Safety Inspection',
      authority: 'Calgary Fire Department',
      municipality: 'Calgary',
      status: 'not-started',
      order: 5,
      blocks: [],
      lastActivity: 'Not Started',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Fire Safety Inspection Request',
      formCode: 'Form FS-500',
    },
  ],
  Toronto: [
    {
      id: 'tor-1',
      name: 'Business Licence',
      authority: 'City of Toronto Municipal Licensing',
      municipality: 'Toronto',
      status: 'not-started',
      order: 1,
      blocks: [],
      lastActivity: 'Not Started',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Business Licence Application',
      formCode: 'Form TML-100',
    },
    {
      id: 'tor-2',
      name: 'Food Premises Licence',
      authority: 'Toronto Public Health',
      municipality: 'Toronto',
      status: 'not-started',
      order: 2,
      blocks: [],
      lastActivity: 'Not Started',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Food Premises Licence Application',
      formCode: 'Form FPL-200',
    },
    {
      id: 'tor-3',
      name: 'Building Permit',
      authority: 'City of Toronto Building Division',
      municipality: 'Toronto',
      status: 'not-started',
      order: 3,
      blocks: [],
      lastActivity: 'Not Started',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Building Permit Application',
      formCode: 'Form BP-300',
    },
    {
      id: 'tor-4',
      name: 'Sign Permit',
      authority: 'City of Toronto Sign Unit',
      municipality: 'Toronto',
      status: 'not-started',
      order: 4,
      blocks: [],
      lastActivity: 'Not Started',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Sign Permit Application',
      formCode: 'Form SP-400',
    },
  ],
  default: [
    {
      id: 'def-1',
      name: 'Business Registration',
      authority: 'Local Government',
      municipality: 'Local',
      status: 'not-started',
      order: 1,
      blocks: [],
      lastActivity: 'Not Started',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Business Registration Application',
      formCode: 'Form BR-100',
    },
    {
      id: 'def-2',
      name: 'Health & Safety Permit',
      authority: 'Health Department',
      municipality: 'Local',
      status: 'not-started',
      order: 2,
      blocks: [],
      lastActivity: 'Not Started',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Health & Safety Permit Application',
      formCode: 'Form HS-200',
    },
    {
      id: 'def-3',
      name: 'Building Permit',
      authority: 'Building Department',
      municipality: 'Local',
      status: 'not-started',
      order: 3,
      blocks: [],
      lastActivity: 'Not Started',
      lastActivityDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysInState: 0,
      formTitle: 'Building Permit Application',
      formCode: 'Form BP-300',
    },
  ],
};

export function getPermitsForJurisdiction(jurisdiction: string): DemoPermit[] {
  if (JURISDICTION_PERMITS[jurisdiction]) {
    return JURISDICTION_PERMITS[jurisdiction];
  }
  const jurisdictionLower = jurisdiction.toLowerCase();
  if (jurisdictionLower.includes('san francisco') || jurisdictionLower.includes('sf')) {
    return JURISDICTION_PERMITS['San Francisco'];
  }
  if (jurisdictionLower.includes('calgary')) {
    return JURISDICTION_PERMITS['Calgary'];
  }
  if (jurisdictionLower.includes('toronto')) {
    return JURISDICTION_PERMITS['Toronto'];
  }
  return JURISDICTION_PERMITS['default'];
}

/** Look up a permit by ID across all jurisdictions. */
export function getPermitById(permitId: string, jurisdiction?: string): DemoPermit | null {
  if (!permitId) return null;
  const permits = jurisdiction
    ? getPermitsForJurisdiction(jurisdiction)
    : Object.values(JURISDICTION_PERMITS).flat();
  return permits.find((p) => p.id === permitId) ?? null;
}
