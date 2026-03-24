import { create } from 'zustand';
import { Notification } from '@/types';
import { expenseService } from '@/lib/services';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  loadNotifications: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  loadNotifications: () => {
    const notifications = expenseService.getNotifications();
    const unreadCount = expenseService.getUnreadCount();
    set({ notifications, unreadCount });
  },

  markAsRead: (notificationId: string) => {
    expenseService.markNotificationAsRead(notificationId);
    const notifications = get().notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    const unreadCount = notifications.filter(n => !n.read).length;
    set({ notifications, unreadCount });
  },

  markAllAsRead: () => {
    expenseService.markAllNotificationsAsRead();
    const notifications = get().notifications.map(n => ({ ...n, read: true }));
    set({ notifications, unreadCount: 0 });
  },

  refreshUnreadCount: () => {
    const unreadCount = expenseService.getUnreadCount();
    set({ unreadCount });
  },
}));
