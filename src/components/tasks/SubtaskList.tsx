import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subtaskService, type Subtask } from '@/services/subtaskService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Loader2, CheckCircle2, Circle, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SubtaskListProps {
  taskId: string;
  userRole: string;
  isTaskAssignee?: boolean;
}

export function SubtaskList({ taskId, userRole, isTaskAssignee = false }: SubtaskListProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const canManageSubtasks =
    ['ADMIN', 'SUPER_USER', 'TOP_USER'].includes(userRole) || isTaskAssignee;

  const {
    data: subtasks = [],
    isLoading,
  } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => subtaskService.getSubtasks(taskId),
    enabled: isOpen && !!taskId,
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (title: string) =>
      subtaskService.createSubtask(taskId, { title, status: 'TODO' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
      setNewSubtaskTitle('');
      setIsAdding(false);
      toast.success('Subtask created');
    },
    onError: (error: any) => {
      console.error('Create subtask error:', error);
      toast.error(error?.response?.data?.message || 'Failed to create subtask');
      setIsAdding(false);
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, status }: { subtaskId: string; status: Subtask['status'] }) =>
      subtaskService.updateSubtask(taskId, subtaskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
    },
    onError: (error: any) => {
      console.error('Update subtask error:', error);
      toast.error('Failed to update subtask');
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) => subtaskService.deleteSubtask(taskId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
      toast.success('Subtask deleted');
    },
    onError: (error: any) => {
      console.error('Delete subtask error:', error);
      toast.error('Failed to delete subtask');
    },
  });

  const handleAddSubtask = () => {
    const title = newSubtaskTitle.trim();
    if (!title) return;
    setIsAdding(true);
    createSubtaskMutation.mutate(title);
  };

  const handleToggleStatus = (subtask: Subtask) => {
    const nextStatus: Subtask['status'] =
      subtask.status === 'DONE' ? 'TODO' : subtask.status === 'TODO' ? 'IN_PROGRESS' : 'DONE';
    updateSubtaskMutation.mutate({ subtaskId: subtask.id, status: nextStatus });
  };

  const completedCount = subtasks.filter((s) => s.status === 'DONE').length;
  const totalCount = subtasks.length;

  return (
    <Accordion type="single" collapsible value={isOpen ? 'subtasks' : ''}>
      <AccordionItem value="subtasks" className="border-0">
        <AccordionTrigger
          onClick={() => setIsOpen(!isOpen)}
          className="py-2 hover:no-underline"
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Subtasks</span>
            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedCount}/{totalCount} done
              </span>
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent>
          {isLoading ? (
            <div className="space-y-2 pl-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-2 pl-6">
              {subtasks.length === 0 && !isAdding && (
                <p className="text-sm text-muted-foreground py-2">No subtasks yet</p>
              )}

              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 group hover:bg-muted/50 rounded-md p-2 -ml-2"
                >
                  <Checkbox
                    checked={subtask.status === 'DONE'}
                    onCheckedChange={() => handleToggleStatus(subtask)}
                    disabled={!canManageSubtasks}
                  />
                  <button
                    onClick={() => handleToggleStatus(subtask)}
                    disabled={!canManageSubtasks}
                    className="flex-1 text-left text-sm"
                  >
                    <span
                      className={cn(
                        subtask.status === 'DONE' && 'line-through text-muted-foreground'
                      )}
                    >
                      {subtask.title}
                    </span>
                  </button>

                  {subtask.status === 'IN_PROGRESS' && (
                    <Circle className="h-3 w-3 text-[var(--accent-primary)] fill-[var(--accent-primary)]" />
                  )}
                  {subtask.status === 'DONE' && (
                    <CheckCircle2 className="h-3 w-3 text-[var(--accent-success)]" />
                  )}

                  {canManageSubtasks && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}

              {canManageSubtasks && (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Add a subtask..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    disabled={isAdding}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim() || isAdding}
                    className="h-8"
                  >
                    {isAdding ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
