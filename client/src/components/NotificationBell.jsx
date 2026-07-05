import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const { data } = await axiosInstance.get('/notifications');
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    window.addEventListener('clearLocalNotifications', fetchNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener('clearLocalNotifications', fetchNotifications);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await axiosInstance.put(`/notifications/${notification._id}/read`);
        setNotifications(notifications.map((n) =>
          n._id === notification._id ? { ...n, isRead: true } : n
        ));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    setIsOpen(false);

    // Prefer a deep-link built from the related entity so older notifications
    // (which may only have a generic actionUrl) still land on the exact item.
    const isOpportunity = notification.type === 'New_Opportunity' || notification.relatedEntityModel === 'Opportunity';
    const target = isOpportunity && notification.relatedEntityId
      ? `/jobs?job=${notification.relatedEntityId}`
      : notification.actionUrl;

    if (target) navigate(target);
  };

  const handleDeleteNotification = async (e, notif) => {
    e.stopPropagation();
    try {
      await axiosInstance.delete(`/notifications/${notif._id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
      if (!notif.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-muted transition-colors hover:bg-paper-2 hover:text-ink"
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold leading-none text-paper">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="card animate-fade-up absolute right-0 mt-2 w-80 overflow-hidden p-0 shadow-xl">
          <div className="flex items-center justify-between border-b border-line bg-paper-2 px-4 py-3">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            {unreadCount > 0 && <span className="badge">{unreadCount} new</span>}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center font-serif text-sm italic text-muted">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group flex cursor-pointer items-start gap-3 border-b border-line px-4 py-3.5 transition-colors last:border-b-0 hover:bg-paper-2 ${
                    notif.isRead ? '' : 'bg-paper-2/60'
                  }`}
                >
                  {!notif.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`truncate text-sm ${notif.isRead ? 'font-medium text-muted' : 'font-semibold text-ink'}`}>
                        {notif.title}
                      </h4>
                      {notif.createdAt && (
                        <span className="shrink-0 text-[10px] text-muted">
                          {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{notif.message}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteNotification(e, notif)}
                    className="shrink-0 rounded-md p-1 text-muted opacity-0 transition-all hover:bg-paper hover:text-ink group-hover:opacity-100"
                    title="Clear notification"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
