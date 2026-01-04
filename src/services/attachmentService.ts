import { apiClient } from '@/lib/api'

export interface Attachment {
  id: string
  entityType: string
  entityId: string
  filename: string
  fileUrl: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  createdAt: string
}

export const attachmentService = {
  async uploadAttachment(file: File, entityType: string, entityId: string): Promise<Attachment> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entityType', entityType)
    formData.append('entityId', entityId)

    const response = await apiClient.post<Attachment>('/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getAttachments(entityType: string, entityId: string): Promise<Attachment[]> {
    const response = await apiClient.get<Attachment[]>('/attachments', {
      params: { entityType, entityId },
    })
    return response.data
  },

  async deleteAttachment(id: string): Promise<void> {
    await apiClient.delete(`/attachments/${id}`)
  },

  getFileUrl(fileUrl: string): string {
    // Remove /api/v1 prefix and prepend backend base URL
    return `http://localhost:8081${fileUrl}`
  },
}
