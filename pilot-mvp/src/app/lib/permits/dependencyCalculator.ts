/**
 * Calculates dependency order, blockedBy, and blocks when adding a new permit
 * to a client's permit plan.
 */

export interface ExistingPermit {
  name?: string;
  order?: number;
  blockedBy?: string;
  blocks?: string[];
}

export interface NewPermitInput {
  name: string;
  prerequisites?: string;
  permitId?: string;
}

export interface DependencyInfo {
  order: number;
  blockedBy?: string;
  blocks: string[];
}

/**
 * Parse prerequisites string (e.g. "Permit A, Permit B") into permit names.
 */
function parsePrerequisites(prerequisites: string | undefined): string[] {
  if (!prerequisites || typeof prerequisites !== 'string') return [];
  return prerequisites
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Find which prerequisite names exist in the current permit plan.
 * Used to set blockedBy for the new permit.
 */
function resolveBlockers(
  existingPermits: ExistingPermit[],
  prerequisiteNames: string[]
): string | undefined {
  if (prerequisiteNames.length === 0) return undefined;
  const existingNames = new Set(
    existingPermits.map((p) => (p.name || '').trim().toLowerCase()).filter(Boolean)
  );
  const matched = prerequisiteNames.filter((name) =>
    existingNames.has(name.trim().toLowerCase())
  );
  return matched.length > 0 ? matched.join(', ') : undefined;
}

/**
 * Get max order among permits that block the new one (by name).
 */
function maxOrderOfBlockers(
  existingPermits: ExistingPermit[],
  blockerNames: string[]
): number {
  if (blockerNames.length === 0) return -1;
  const blockerSet = new Set(
    blockerNames.map((n) => n.trim().toLowerCase()).filter(Boolean)
  );
  let max = -1;
  for (const p of existingPermits) {
    const name = (p.name || '').trim().toLowerCase();
    if (blockerSet.has(name)) {
      const order = typeof p.order === 'number' ? p.order : 0;
      max = Math.max(max, order);
    }
  }
  return max;
}

/**
 * Calculate dependency order, blockedBy, and blocks for a new permit
 * being added to the plan.
 */
export function calculateDependencyOrder(
  existingPermits: ExistingPermit[],
  newPermit: NewPermitInput
): DependencyInfo {
  const prerequisiteNames = parsePrerequisites(
    newPermit.prerequisites as string | undefined
  );
  const blockedBy = resolveBlockers(existingPermits, prerequisiteNames);

  const maxExistingOrder =
    existingPermits.length > 0
      ? Math.max(
          ...existingPermits.map((p) =>
            typeof p.order === 'number' ? p.order : 0
          )
        )
      : -1;

  const maxBlockerOrder = maxOrderOfBlockers(existingPermits, prerequisiteNames);
  const order =
    blockedBy && maxBlockerOrder >= 0 ? maxBlockerOrder + 1 : maxExistingOrder + 1;

  return {
    order: Math.max(0, order),
    blockedBy,
    blocks: [],
  };
}
