import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { phaseService, type CreatePhaseRequest } from '@/services/phaseService';
import { teamService } from '@/services/teamService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const phaseSchema = z.object({
  name: z.string().min(1, 'Phase name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  status: z.enum(['TODO', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  teamId: z.string().optional(),
});

type PhaseFormData = z.infer<typeof phaseSchema>;

interface PhaseFormDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase?: any; // For editing
}

export function PhaseFormDialog({ projectId, open, onOpenChange, phase }: PhaseFormDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch teams
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getTeams(),
  });

  const form = useForm<PhaseFormData>({
    resolver: zodResolver(phaseSchema),
    defaultValues: {
      name: phase?.name || '',
      description: phase?.description || '',
      sortOrder: phase?.sortOrder || 0,
      status: phase?.status || 'TODO',
      teamId: phase?.teamId || '',
    },
  });

  // Reset form when phase changes
  useState(() => {
    if (phase) {
      form.reset({
        name: phase.name || '',
        description: phase.description || '',
        sortOrder: phase.sortOrder || 0,
        status: phase.status || 'TODO',
        teamId: phase.teamId || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        sortOrder: 0,
        status: 'TODO',
        teamId: '',
      });
    }
  });

  const createPhaseMutation = useMutation({
    mutationFn: (data: CreatePhaseRequest) => phaseService.createPhase(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', projectId] });
      toast.success('Phase created successfully');
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Create phase error:', error);
      toast.error(error?.response?.data?.message || 'Failed to create phase');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updatePhaseMutation = useMutation({
    mutationFn: (data: Partial<CreatePhaseRequest>) => 
      phaseService.updatePhase(projectId, phase.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase', phase.id] });
      toast.success('Phase updated successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Update phase error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update phase');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (data: PhaseFormData) => {
    setIsSubmitting(true);
    const payload: CreatePhaseRequest = {
      name: data.name,
      description: data.description?.trim() || undefined,
      sortOrder: data.sortOrder,
      status: data.status,
      teamId: data.teamId === 'NO_TEAM' ? undefined : data.teamId,
    };
    if (phase) {
      updatePhaseMutation.mutate(payload);
    } else {
      createPhaseMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{phase ? 'Edit Phase' : 'Create Phase'}</DialogTitle>
          <DialogDescription>
            {phase ? 'Update the phase details.' : 'Add a new phase to organize tasks in this project.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Phase Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Planning, Development" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description of this phase"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="teamId"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Assign Team (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'NO_TEAM'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NO_TEAM">No Team</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {phase ? 'Update Phase' : 'Create Phase'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
