import React, { useState, useEffect } from 'react';
import { retrieveToken, storeToken } from '../tokenStorage';
import { buildPath } from './path';
import { useNavigate } from "react-router-dom";
import styles from '../pages/FriendsPage.module.css';

// ── Types ─────────────────────────────────────────────────────────────

interface Notification {
  _id: string;
  recipientId: string;
  type:
      | 'friend_request'
      | 'alert'
      | 'birthday'
      | 'support_received'
      | 'birthday_wish_received'
      | 'support_needed';
  requesterId: string;
  content: string;
  createdAt: string | Date;
  isRead: boolean;
  relatedId: string | null;
  senderUsername?: string;
  senderFirstName: string;
  senderLastName: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

const notificationIcon = (type: Notification['type']): string => {
  switch (type) {
    case 'friend_request':          return '👤';
    case 'birthday':                return '🎂';
    case 'alert':                   return '🤝';
    case 'support_received':        return '💙';
    case 'support_needed':          return '👋';
    case 'birthday_wish_received':  return '🎉';
    default:                        return '🔔';
  }
};


const notificationLabel = (type: Notification['type'], content?: string): string => {
  if (content && content.trim().length > 0) {
    return content;
  }

  switch (type) {
    case 'friend_request':          return 'New friend request';
    case 'birthday':                return "Birthday notification";
    case 'alert':                   return "Support alert";
    case 'support_received':        return "Support received";
    case 'birthday_wish_received':  return "Birthday wish received";
    default:                        return 'Notification';
  }
};

const isRespondable = (type: Notification['type']): boolean =>
    type === 'birthday' || type === 'alert';

const isViewOnly = (type: Notification['type']): boolean =>
    type === 'support_received' || type === 'birthday_wish_received';

// ── Modal ─────────────────────────────────────────────────────────────

interface ModalProps {
  notification: Notification;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
}

const ResponseModal: React.FC<ModalProps> = ({ notification, onClose, onSend }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const header = `${notificationIcon(notification.type)} ${notificationLabel(notification.type, notification.content)}`;

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please write a message first.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await onSend(message);
      setSuccess('Message sent!');
      setTimeout(onClose, 1500);
    } catch {
      setError('Failed to send.');
    } finally {
      setSending(false);
    }
  };

  return (
      <div id="modalOverlay" style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
      }}>
        <div id="modalCard" className="Modalcard">
          <p id="modalHeading" className="cardHeading">{header}</p>

          <p id="modalSubtext" className="cardSubtext">
            {notification.content || ''}
          </p>

          {!isViewOnly(notification.type) && (
              <div className="fieldGroup">
                <label className="label">
                  {notification.type === 'birthday' ? 'Birthday Message' : 'Support Message'}
                </label>
                <textarea
                    className="input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={notification.type === 'birthday' ? 'Write a birthday message...' : 'Write a support message...'}
                    rows={4}
                    style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
          )}

          {error   && <p className="errorMsg" style={{ color: 'red' }}>{error}</p>}
          {success && <p className="errorMsg" style={{ color: 'green' }}>{success}</p>}

          {!isViewOnly(notification.type) && (
              <button type="button" className="button" onClick={handleSend} disabled={sending}>
                {sending ? 'Sending...' : 'Send'}
              </button>
          )}

          <button type="button" className="backButton" onClick={onClose}>
            ← Close
          </button>
        </div>
      </div>
  );
};

// ── Notification Card ─────────────────────────────────────────────────

interface NotificationCardProps {
  notification: Notification;
  onClick: () => void;
  onAccept: (notif: Notification) => Promise<void>;
  friendResolved?: 'accept' | 'decline' | null;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
                                                             notification,
                                                             onClick,
                                                             onAccept,
                                                             friendResolved
                                                           }) => {

  const navigate = useNavigate();

  async function openChatWith(friendId: string, fName: string, lName: string): Promise<void> {
    if (!friendId) {
      console.error("friendId is missing, cannot open chat");
      return;
    }

    try {
      const token = retrieveToken();
      const response = await fetch(buildPath('api/conversations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ friendId: friendId }), // Backend needs this to get/create ConvID
      });

      const res = await response.json();
      if (res.error) return;

      if (res.accessToken) storeToken(res.accessToken);

      navigate('/conversation/' + friendId, {
        state: {
          name: `${fName} ${lName}`.trim() || "Friend",
          conversationId: res.conversationId // Passing this prevents an extra API call on the next page
        }
      });

    } catch (e) {
      console.error("Failed to open chat:", e);
    }
  }

  return (
      <div
          id={`notificationCard-${notification._id}`}
          className="Notifcard"
          onClick={onClick}
          style={{ cursor: 'pointer', marginBottom: '6px' }}
      >
        <div className="fieldRow" style={{ alignItems: 'center' }}>
          <p className="cardHeading" style={{ margin: 0 }}>
            {notificationIcon(notification.type)} {notificationLabel(notification.type, notification.content)}
            {!notification.isRead && (
                <span style={{ color: '#3b82f6', marginLeft: '6px' }}>●</span>
            )}
          </p>
        </div>

        {notification.type === 'friend_request' && !friendResolved && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <div className={styles.actionButtons}>
                <button
                    className={styles.acceptBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAccept(notification);
                    }}
                >
                  Accept
                </button>
                <button
                    className={styles.rejectBtn}
                    onClick={(e) => { e.stopPropagation(); }}
                >
                  Decline
                </button>
              </div>
            </div>
        )}

        {notification.type === 'friend_request' && friendResolved && (
            <p style={{
              fontSize: '13px',
              marginTop: '6px',
              color: friendResolved === 'accept' ? 'green' : 'red'
            }}>
              {friendResolved === 'accept' ? 'Friend request accepted' : 'Friend request declined'}
            </p>
        )}

        {notification.type === 'support_needed' && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <div className={styles.actionButtons}>
                <button
                    className={styles.acceptBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      const idToUse = notification.requesterId || notification._id;
                      const firstName = notification.senderFirstName || "A";
                      const lastName = notification.senderLastName || "Friend";

                      openChatWith(idToUse, firstName, lastName);
                    }}
                >
                  Message Friend
                </button>
              </div>
            </div>
        )}

      </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────

const Notifications: React.FC = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [friendActions, setFriendActions] = useState<Record<string, 'accept' | 'decline'>>({});

  useEffect(() => {
    const _ud = localStorage.getItem('user_data');
    if (!_ud) {
      navigate('/');
    } else {
      fetchNotifications();
    }
  }, [navigate]);

  const fetchNotifications = async () => {
    const token = retrieveToken();
    if (!token) return;

    try {
      const response = await fetch(buildPath('api/notifications'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const res = await response.json();
      console.log(res);
      if (res.accessToken) storeToken(res.accessToken);

      if (res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );

    try {
      const token = retrieveToken();
      const response = await fetch(buildPath('api/mark-notification-read'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId: id })
      });

      const res = await response.json();
      if (res.accessToken) storeToken(res.accessToken);

    } catch (e) {
      console.error("Failed to sync read status to server", e);
    }
  };

  const handleAccept = async (notif: Notification) => {
    const token = retrieveToken();
    if (!token) {
      navigate('/');
      return;
    }

    if (!notif.relatedId) {
      console.error("Critical Error: relatedId is missing.");
      return;
    }

    try {
      const response = await fetch(buildPath('api/accept-friend-request'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          friendship_id: notif.relatedId,
          senderId: notif.relatedId
        })
      });

      const res = await response.json();
      if (res.accessToken) storeToken(res.accessToken);

      if (response.ok) {
        setFriendActions(prev => ({ ...prev, [notif._id]: 'accept' }));
        markAsRead(notif._id);
      } else {
        console.error("Acceptance API Error:", res.error);
      }
    } catch (e) {
      console.error("Network error accepting friend request:", e);
    }
  };



  const handleClick = (notification: Notification) => {
    if (notification.type === 'friend_request') return;
    markAsRead(notification._id);
    if (isRespondable(notification.type) || isViewOnly(notification.type)) {
      setActiveNotification(notification);
    }
  };

  const handleSendResponse = async (message: string) => {
    console.log('Response sent:', message);
    await new Promise(res => setTimeout(res, 800));
  };

  return (
      <div id="notificationsCard" className="card">
        <p id="notificationsHeading" className="cardHeading">Notifications</p>
        <p id="notificationsSubtext" className="cardSubtext">
          Stay up to date with your friends' latest activity
        </p>

        {loading ? (
            <p className="cardSubtext">Loading...</p>
        ) : notifications.length === 0 ? (
            <p className="cardSubtext">No notifications yet.</p>
        ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {notifications.map(n => (
                  <NotificationCard
                      key={n._id}
                      notification={n}
                      onClick={() => handleClick(n)}
                      onAccept={handleAccept}
                      friendResolved={friendActions[n._id] ?? null}
                  />
              ))}
            </div>
        )}

        {activeNotification && (
            <ResponseModal
                notification={activeNotification}
                onClose={() => setActiveNotification(null)}
                onSend={handleSendResponse}
            />
        )}
      </div>
  );
};

export default Notifications;