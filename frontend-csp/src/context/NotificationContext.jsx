import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) return;
    try {
      const data = await fetchWithAuth('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch { /* silent */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/notifications?limit=30');
      setNotifications(data);
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await fetchWithAuth(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetchWithAuth('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await fetchWithAuth(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => {
        const removed = prev.find(n => n.id === id);
        if (removed && !removed.isRead) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(n => n.id !== id);
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading,
      fetchNotifications, markAsRead, markAllAsRead, deleteNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
