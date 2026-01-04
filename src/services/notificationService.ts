import { apiClient } from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  actorId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const notificationService = {
  // Get all notifications for current user
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  // Get unread notifications
  getUnreadNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications/unread');
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get('/notifications/unread/count');
    return response.data.count;
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
  },

  // Mark all as read
  markAllAsRead: async (): Promise<number> => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data.count;
  },

  // Delete notification
  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};
