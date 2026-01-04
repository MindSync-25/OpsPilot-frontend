import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { commentService, type Comment, type EntityType } from '@/services/commentService'
import { userService } from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'

interface CommentSectionProps {
  entityType: EntityType
  entityId: string
}

export function CommentSection({ entityType, entityId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  const queryKey = ['comments', entityType, entityId]

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      switch (entityType) {
        case 'PHASE':
          return commentService.getPhaseComments(entityId)
        case 'TASK':
          return commentService.getTaskComments(entityId)
        case 'SUBTASK':
          return commentService.getSubtaskComments(entityId)
      }
    },
  })

  // Fetch users for mentions
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-mentions'],
    queryFn: () => userService.getUsersForMentions(),
  })

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      switch (entityType) {
        case 'PHASE':
          return commentService.createPhaseComment(entityId, { content })
        case 'TASK':
          return commentService.createTaskComment(entityId, { content })
        case 'SUBTASK':
          return commentService.createSubtaskComment(entityId, { content })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setNewComment('')
      toast.success('Comment added')
    },
    onError: () => {
      toast.error('Failed to add comment')
    },
  })

  // Handle @ mentions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    setNewComment(value)
    setCursorPosition(cursorPos)

    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    
    if (atIndex !== -1) {
      const searchText = textBeforeCursor.substring(atIndex + 1)
      // Check if there's no space after @ (valid mention state)
      if (!searchText.includes(' ')) {
        setMentionSearch(searchText.toLowerCase())
        setShowMentions(true)
        return
      }
    }
    
    setShowMentions(false)
  }

  // Insert mention
  const insertMention = (userName: string) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition)
    const textAfterCursor = newComment.substring(cursorPosition)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    
    const newText = textBeforeCursor.substring(0, atIndex) + `@${userName} ` + textAfterCursor
    setNewComment(newText)
    setShowMentions(false)
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = atIndex + userName.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  // Filter users for mention suggestions
  const filteredUsers = users.filter((user: any) => 
    user.name.toLowerCase().includes(mentionSearch)
  ).slice(0, 5)

  // Render comment content with highlighted mentions
  const renderCommentContent = (content: string) => {
    // Match @username patterns (username can have spaces if followed by space or end)
    const parts = content.split(/(@[\w\s]+?)(?=\s|$|@)/g)
    
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-[var(--accent-primary)] font-medium">
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      createMutation.mutate(newComment.trim())
      setShowMentions(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>

      {/* Comment list */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment: Comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {comment.userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {renderCommentContent(comment.content)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="space-y-2 relative">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="Add a comment... (use @ to mention users)"
            value={newComment}
            onChange={handleTextChange}
            className="min-h-[80px] resize-none"
            disabled={createMutation.isPending}
          />
          
          {/* Mention dropdown */}
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-popover border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
              {filteredUsers.map((user: any) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => insertMention(user.name)}
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Comment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
