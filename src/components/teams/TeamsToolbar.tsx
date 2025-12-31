import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useRef, useEffect } from 'react'
import { type User } from '@/services/userService'
import { type Team } from '@/services/teamService'

export interface TeamsToolbarFilters {
  search: string
  roleFilter: string
  teamFilter: string
  statusFilter: string
  sortBy: string
}

interface TeamsToolbarProps {
  filters: TeamsToolbarFilters
  onFiltersChange: (filters: TeamsToolbarFilters) => void
  teamNames: { id: string; name: string }[]
  allUsers?: User[]
  allTeams?: Team[]
}

export default function TeamsToolbar({ filters, onFiltersChange, teamNames, allUsers = [], allTeams = [] }: TeamsToolbarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const updateFilter = (key: keyof TeamsToolbarFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  // Get search suggestions
  const suggestions = filters.search.length >= 2 ? [
    ...allUsers
      .filter(u => 
        u.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        u.email.toLowerCase().includes(filters.search.toLowerCase())
      )
      .slice(0, 5)
      .map(u => ({ type: 'user' as const, label: u.name, sublabel: u.email, value: u.name })),
    ...allTeams
      .filter(t => t.name.toLowerCase().includes(filters.search.toLowerCase()))
      .slice(0, 3)
      .map(t => ({ type: 'team' as const, label: t.name, sublabel: 'Team', value: t.name }))
  ].slice(0, 8) : []

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="bg-card border rounded-lg p-4 mb-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search teams, members, emails..."
            value={filters.search}
            onChange={(e) => {
              updateFilter('search', e.target.value)
              setShowSuggestions(e.target.value.length >= 2)
            }}
            onFocus={() => filters.search.length >= 2 && setShowSuggestions(true)}
            className="pl-10"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-popover border rounded-md shadow-md z-50 max-h-64 overflow-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between"
                  onClick={() => {
                    updateFilter('search', suggestion.value)
                    setShowSuggestions(false)
                  }}
                >
                  <div>
                    <div className="font-medium text-sm">{suggestion.label}</div>
                    <div className="text-xs text-muted-foreground">{suggestion.sublabel}</div>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{suggestion.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Role Filter */}
        <Select value={filters.roleFilter} onValueChange={(value) => updateFilter('roleFilter', value)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="TOP_USER">Top User</SelectItem>
            <SelectItem value="SUPER_USER">Super User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="USER">User</SelectItem>
          </SelectContent>
        </Select>

        {/* Team Filter */}
        <Select value={filters.teamFilter} onValueChange={(value) => updateFilter('teamFilter', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {teamNames.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filters.statusFilter} onValueChange={(value) => updateFilter('statusFilter', value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Team name A→Z</SelectItem>
            <SelectItem value="members-desc">Member count (high→low)</SelectItem>
            <SelectItem value="updated-desc">Recently updated</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
