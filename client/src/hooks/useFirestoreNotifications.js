import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, limit, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { db, hasFirebaseConfig } from "../firebase/config.js";
import { playNotificationChime } from "../utils/notifications.js";

export function useFirestoreNotifications({ targetRole, targetUserId = "" }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(Boolean(hasFirebaseConfig && db));
  const previousUnread = useRef(0);
  const firstLoad = useRef(true);

  useEffect(() => {
    if (!hasFirebaseConfig || !db) {
      setNotifications([]);
      setLoading(false);
      return undefined;
    }

    const notificationsQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const docs = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((notification) => {
            if (notification.targetRole !== targetRole) return false;
            if (!targetUserId) return true;
            return !notification.targetUserId || notification.targetUserId === targetUserId;
          })
          .slice(0, 10);

        const unread = docs.filter((item) => !item.isRead).length;
        if (!firstLoad.current && unread > previousUnread.current) playNotificationChime();
        previousUnread.current = unread;
        firstLoad.current = false;
        setNotifications(docs);
        setLoading(false);
      },
      () => {
        setNotifications([]);
        setLoading(false);
      }
    );
  }, [targetRole, targetUserId]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  const markAsRead = useCallback(async (id) => {
    if (!db) return;
    await updateDoc(doc(db, "notifications", id), { isRead: true });
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!db) return;
    const batch = writeBatch(db);
    notifications.forEach((notification) => {
      if (!notification.isRead) {
        batch.update(doc(db, "notifications", notification.id), { isRead: true });
      }
    });
    await batch.commit();
  }, [notifications]);

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead };
}
