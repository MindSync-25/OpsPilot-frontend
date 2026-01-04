import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, File, Trash2, Loader2, Image, Video, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { attachmentService } from '@/services/attachmentService'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface AttachmentSectionProps {
  entityType: 'TASK' | 'SUBTASK' | 'PHASE'
  entityId: string
}

const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024, // 10MB
  document: 25 * 1024 * 1024, // 25MB
  video: 50 * 1024 * 1024, // 50MB
}

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ],
  video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
}

export function AttachmentSection({ entityType, entityId }: AttachmentSectionProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const queryKey = ['attachments', entityType, entityId]

  // Fetch attachments
  const { data: attachments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => attachmentService.getAttachments(entityType, entityId),
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => attachmentService.uploadAttachment(file, entityType, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('File uploaded successfully')
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload file')
      setUploading(false)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: attachmentService.deleteAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Attachment deleted')
    },
    onError: () => {
      toast.error('Failed to delete attachment')
    },
  })

  const validateFile = (file: File): string | null => {
    const fileType = file.type
    let category: 'image' | 'document' | 'video' | null = null
    let maxSize = 0

    if (ALLOWED_TYPES.image.includes(fileType)) {
      category = 'image'
      maxSize = MAX_FILE_SIZE.image
    } else if (ALLOWED_TYPES.document.includes(fileType)) {
      category = 'document'
      maxSize = MAX_FILE_SIZE.document
    } else if (ALLOWED_TYPES.video.includes(fileType)) {
      category = 'video'
      maxSize = MAX_FILE_SIZE.video
    }

    if (!category) {
      return 'File type not allowed. Allowed: images (jpeg, png, gif, webp), documents (pdf, doc, docx, xls, xlsx, ppt, pptx, txt), videos (mp4, mpeg, mov, avi, webm)'
    }

    if (file.size > maxSize) {
      return `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB for ${category}s`
    }

    return null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const error = validateFile(file)
    if (error) {
      toast.error(error)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setUploading(true)
    uploadMutation.mutate(file)
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-[var(--accent-primary)]" />
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5 text-[var(--accent-primary)]" />
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Attachments</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept={[...ALLOWED_TYPES.image, ...ALLOWED_TYPES.document, ...ALLOWED_TYPES.video].join(',')}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Supported: Images (10MB), Documents (25MB), Videos (50MB)
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No attachments yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="p-3">
              <div className="flex items-center gap-3">
                {getFileIcon(attachment.mimeType)}
                <div className="flex-1 min-w-0">
                  <a
                    href={attachmentService.getFileUrl(attachment.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline truncate block"
                  >
                    {attachment.filename}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)} • {new Date(attachment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(attachment.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
