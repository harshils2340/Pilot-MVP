'use client';

import { PermitPlan } from './PermitPlan';

interface EnhancedPermitPlanProps {
  clientId: string;
  clientName: string;
  onSelectPermit: (permitId: string) => void;
}

export function EnhancedPermitPlan(props: EnhancedPermitPlanProps) {
  return <PermitPlan {...props} />;
}
