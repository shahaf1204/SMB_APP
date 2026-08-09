import { useMemo } from 'react';
import { generateBusinessInsights } from '../../../business-coach/insightEngine';
import { useAppStore } from '../../../store/useAppStore';
import { BusinessCoachPanel } from '../../business-coach/BusinessCoachPanel';

/** Package-primary dashboard coach — hidden when no meaningful insights. */
export function PackageBusinessCoachPanel() {
  const business = useAppStore((s) => s.business);
  const engagements = useAppStore((s) => s.engagements ?? []);
  const engagementSessions = useAppStore((s) => s.engagementSessions ?? []);

  const insights = useMemo(() => {
    const workspace = business?.workspace;
    if (!workspace) return [];
    return generateBusinessInsights({
      workspaceConfig: workspace,
      data: { engagements, engagementSessions },
    });
  }, [business?.workspace, engagements, engagementSessions]);

  return <BusinessCoachPanel insights={insights} />;
}
