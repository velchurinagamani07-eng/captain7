import { useCallback, useState } from "react";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const pushNotification = useCallback((notification) => {
    setNotifications((current) => [{ id: Date.now(), isRead: false, ...notification }, ...current]);
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
  }, []);

  return { notifications, pushNotification, markRead };
}
