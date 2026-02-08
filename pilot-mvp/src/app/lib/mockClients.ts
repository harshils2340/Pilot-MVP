/**
 * Mock client data — safe to import from client components (no MongoDB dependency).
 * The seed function in seedClients.ts re-exports from here for DB seeding.
 */

export const mockClients = [
  {
    id: '1',
    businessName: 'Riverside Coffee Co.',
    jurisdiction: 'Portland, OR',
    activePermits: 4,
    status: 'action-required',
    lastActivity: '2 hours ago',
    completionRate: 75,
  },
  {
    id: '2',
    businessName: 'Pacific Manufacturing LLC',
    jurisdiction: 'Seattle, WA',
    activePermits: 7,
    status: 'submitted',
    lastActivity: '1 day ago',
    completionRate: 100,
  },
  {
    id: '3',
    businessName: 'Urban Eats Restaurant Group',
    jurisdiction: 'San Francisco, CA',
    activePermits: 12,
    status: 'draft',
    lastActivity: '3 hours ago',
    completionRate: 45,
  },
  {
    id: '4',
    businessName: 'GreenTech Solutions Inc.',
    jurisdiction: 'Austin, TX',
    activePermits: 3,
    status: 'approved',
    lastActivity: '5 days ago',
    completionRate: 100,
  },
  {
    id: '5',
    businessName: 'Mountain View Brewery',
    jurisdiction: 'Denver, CO',
    activePermits: 8,
    status: 'submitted',
    lastActivity: '12 hours ago',
    completionRate: 90,
  },
  {
    id: '6',
    businessName: 'King West Kitchen & Bar',
    jurisdiction: 'Toronto, ON',
    activePermits: 5,
    status: 'action-required',
    lastActivity: '4 hours ago',
    completionRate: 60,
  },
];

export function getClientById(clientsId: string) {
  return mockClients.find(client => client.id === clientsId);
}
