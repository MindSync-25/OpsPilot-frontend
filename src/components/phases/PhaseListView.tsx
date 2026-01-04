import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, Users, Search, X } from 'lucide-react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingTooltip from '@/components/onboarding/OnboardingTooltip'
import { phaseService, type Phase } from '@/services/phaseService'
import { teamService } from '@/services/teamService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PhaseFormDialog } from '@/components/phases/PhaseFormDialog'

interface PhaseListViewProps {
  projectId: string
}

export function PhaseListView({ projectId }: PhaseListViewProps) {
  const navigate = useNavigate()
  const { shouldShowOnboarding, completedSteps } = useOnboarding()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')

  const { data: phases = [], isLoading } = useQuery({
    queryKey: ['phases', projectId],
    queryFn: () => phaseService.getPhases(projectId),
  })

  // Fetch teams for team lookup
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getTeams(),
  })

  const getTeamName = (teamId: string | undefined) => {
    if (!teamId) return null
    const team = teams.find(t => t.id === teamId)
    return team?.name
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-500'
      case 'ACTIVE':
        return 'bg-green-500'
      case 'COMPLETED':
        return 'bg-blue-500'
      case 'ON_HOLD':
        return 'bg-yellow-500'
      case 'CANCELLED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Filter phases based on search and filters
  const filteredPhases = phases.filter((phase: Phase) => {
    // Search filter
    const matchesSearch = searchQuery.trim() === '' || 
      phase.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phase.description?.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === 'all' || phase.status === statusFilter

    // Team filter
    const matchesTeam = teamFilter === 'all' || 
      (teamFilter === 'no-team' && !phase.teamId) ||
      (phase.teamId === teamFilter)

    return matchesSearch && matchesStatus && matchesTeam
  })

  // Get search suggestions
  const searchSuggestions = useMemo(() => {
    if (searchQuery.trim() === '') return []
    
    return phases
      .filter(phase => 
        phase.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phase.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5)
  }, [phases, searchQuery])

  const handleSuggestionClick = (phase: Phase) => {
    setSearchQuery(phase.name)
    setShowSuggestions(false)
    navigate(`/app/projects/${projectId}/phases/${phase.id}`)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Phases</h2>
          <p className="text-muted-foreground">
            Manage project phases and milestones
          </p>
        </div>
        <div className="relative">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Phase
          </Button>
          {shouldShowOnboarding && !completedSteps.includes('phase') && (
            <OnboardingTooltip
              stepId="phase-create"
              title="Add Project Phases"
              description="Break down your project into phases to organize work. Assign teams and track milestones."
              position="bottom"
            />
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search phases..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setShowSuggestions(false)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden">
              {searchSuggestions.map((phase) => (
                <button
                  key={phase.id}
                  onClick={() => handleSuggestionClick(phase)}
                  className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{phase.name}</div>
                    {phase.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {phase.description}
                      </div>
                    )}
                  </div>
                  <Badge className="text-xs flex-shrink-0">{phase.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            <SelectItem value="no-team">No Team</SelectItem>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Phase list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : filteredPhases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {phases.length === 0 ? 'No phases yet' : 'No phases found'}
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            {phases.length === 0 
              ? 'Organize your project into phases to better track progress and milestones'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {phases.length === 0 && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Phase
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPhases.map((phase: Phase) => (
            <div
              key={phase.id}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              onClick={() => navigate(`/app/projects/${projectId}/phases/${phase.id}`)}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base truncate">{phase.name}</h3>
                  <Badge className={getStatusColor(phase.status)}>
                    {phase.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Order: {phase.sortOrder}</span>
                  {phase.teamId && getTeamName(phase.teamId) && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{getTeamName(phase.teamId)}</span>
                      </div>
                    </>
                  )}
                  {phase.taskCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{phase.taskCount} {phase.taskCount === 1 ? 'task' : 'tasks'}</span>
                    </>
                  )}
                </div>
                {phase.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {phase.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <PhaseFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
      />
    </div>
  )
}
