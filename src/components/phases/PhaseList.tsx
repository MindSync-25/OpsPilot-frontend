import { useQuery } from '@tanstack/react-query';
import { phaseService, type Phase } from '@/services/phaseService';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Layers, CheckCircle2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseListProps {
  projectId: string;
  selectedPhaseId: string | null;
  onPhaseSelect: (phaseId: string | null) => void;
  onCreatePhase: () => void;
  userRole: string;
}

export function PhaseList({
  projectId,
  selectedPhaseId,
  onPhaseSelect,
  onCreatePhase,
  userRole,
}: PhaseListProps) {
  const canCreatePhase = ['ADMIN', 'SUPER_USER', 'TOP_USER'].includes(userRole);

  const { data: phases = [], isLoading } = useQuery({
    queryKey: ['phases', projectId],
    queryFn: () => phaseService.getPhases(projectId),
    enabled: !!projectId,
  });

  const getPhaseIcon = (status: Phase['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'ARCHIVED':
        return <Archive className="h-4 w-4 text-gray-400" />;
      default:
        return <Layers className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Phases
          </h3>
          {canCreatePhase && (
            <Button variant="ghost" size="sm" onClick={onCreatePhase}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* All Tasks Option */}
        <Button
          variant={selectedPhaseId === null ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start',
            selectedPhaseId === null && 'bg-secondary'
          )}
          onClick={() => onPhaseSelect(null)}
        >
          <Layers className="mr-2 h-4 w-4" />
          All Tasks
          {phases.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {phases.reduce((sum, p) => sum + p.taskCount, 0)}
            </span>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {phases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No phases yet</p>
              {canCreatePhase && (
                <p className="text-xs mt-1">Create one to organize tasks</p>
              )}
            </div>
          ) : (
            phases.map((phase) => (
              <Button
                key={phase.id}
                variant={selectedPhaseId === phase.id ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  selectedPhaseId === phase.id && 'bg-secondary',
                  phase.status === 'ARCHIVED' && 'opacity-60'
                )}
                onClick={() => onPhaseSelect(phase.id)}
              >
                {getPhaseIcon(phase.status)}
                <span className="ml-2 flex-1 text-left truncate">{phase.name}</span>
                {phase.taskCount > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {phase.taskCount}
                  </span>
                )}
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
