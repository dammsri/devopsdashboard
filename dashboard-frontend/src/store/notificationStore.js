import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      type: 'info', // 'success', 'error', 'info', 'warning'
      duration: 5000,
      ...notification,
    };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
    
    if (newNotification.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, newNotification.duration);
    }
    
    return id;
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));

export const notify = {
  success: (message, options) => useNotificationStore.getState().addNotification({ type: 'success', message, ...options }),
  error: (message, options) => useNotificationStore.getState().addNotification({ type: 'error', message, ...options }),
  info: (message, options) => useNotificationStore.getState().addNotification({ type: 'info', message, ...options }),
  warning: (message, options) => useNotificationStore.getState().addNotification({ type: 'warning', message, ...options }),
};
