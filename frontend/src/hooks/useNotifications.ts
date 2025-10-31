import { useState, useEffect } from 'react';
import api from '@/services/api';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.data.count);
    } catch (error) {
      console.error('Erro ao buscar notificações');
    }
  };

  return { unreadCount, refresh: fetchUnreadCount };
};
